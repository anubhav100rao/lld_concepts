Designing a robust code deployment pipeline—akin to a system like Spinnaker, Argo Rollouts, or AWS CodePipeline—requires balancing strict state management with high availability. At its core, this system must reliably orchestrate a Directed Acyclic Graph (DAG) of tasks while providing bulletproof mechanisms for safe rollouts and rollbacks.

Here is the low-level design (LLD) for a highly available, concurrent Deployment Pipeline system.


---

### **1. Core Classes & Interfaces**

We will use an object-oriented approach (Java/TypeScript style) to define the domain model.

```typescript
// Enums
enum TaskStatus { PENDING, RUNNING, SUCCESS, FAILED, CANCELLED }
enum RolloutType { CANARY, BLUE_GREEN, ROLLING }

// Interfaces
interface DeploymentStrategy {
    execute(context: DeploymentContext): Promise<DeploymentResult>;
    rollback(context: DeploymentContext): Promise<void>;
}

interface HealthGate {
    evaluate(targetEnv: string, metrics: MetricCriteria[]): Promise<boolean>;
}

interface ArtifactRepository {
    upload(buildPath: string): Promise<string>; // Returns artifact URI
    download(uri: string, targetPath: string): Promise<void>;
}

// Core Classes
class PipelineEngine {
    constructor(private queue: TaskQueue, private db: Database) {}
    
    async triggerPipeline(config: PipelineConfig, commitHash: string): Promise<string> {
        // Parses DAG, creates DB entries, pushes initial tasks to queue
    }
}

class BlueGreenStrategy implements DeploymentStrategy {
    async execute(context: DeploymentContext): Promise<DeploymentResult> {
        // 1. Provision Green environment
        // 2. Deploy artifact to Green
        // 3. Run HealthGate on Green
        // 4. Switch Router/Load Balancer traffic to Green
    }
    // ... rollback implementation
}

class CanaryStrategy implements DeploymentStrategy {
    async execute(context: DeploymentContext): Promise<DeploymentResult> {
        // 1. Deploy to Canary pods
        // 2. Shift X% traffic
        // 3. Wait for HealthGate approval (Automated or Manual)
        // 4. Incrementally scale to 100%
    }
    // ... rollback implementation
}
```

---

### **2. Database Schema (Relational)**

We choose a Relational Database (e.g., PostgreSQL) because pipeline execution requires strong ACID guarantees (Consistency over Availability) to prevent state corruption during concurrent state transitions.

| Table Name | Schema / Columns | Justification |
| :--- | :--- | :--- |
| **Pipelines** | `id` (PK), `name`, `repo_url`, `config_yaml`, `created_at` | Stores the static definition of a pipeline. |
| **Pipeline_Runs** | `id` (PK), `pipeline_id` (FK), `commit_hash`, `status`, `triggered_by`, `created_at` | Tracks an individual execution of a pipeline. |
| **Tasks** | `id` (PK), `run_id` (FK), `type` (Build/Deploy/Gate), `status`, `depends_on` (JSON/Array), `version` (Optimistic lock) | The individual nodes of the DAG. |
| **Artifacts** | `id` (PK), `run_id` (FK), `uri` (S3/GCS path), `checksum`, `size` | Immutable tracking of built assets to ensure consistent rollouts. |
| **Environments** | `id` (PK), `name` (Prod/Staging), `lock_token`, `locked_at` | Tracks environment state to prevent concurrent deployments. |

---

### **3. Data Structures & Algorithms**

* **Directed Acyclic Graph (DAG):** Pipeline configurations are parsed into a DAG. This allows for parallel execution of non-dependent tasks (e.g., running unit tests and linting simultaneously) while blocking dependent tasks (e.g., deploy waits for build).
* **Priority Queue:** Used by the worker nodes to fetch `Tasks`. Hotfixes or production rollbacks are injected with high priority to bypass standard queued builds.
* **Distributed Lock (via Redis):** A strictly enforced lock mechanism. If Pipeline Run A is deploying to `Production-Cluster`, it acquires a Redis lock with a TTL. Pipeline Run B must wait or fail if it attempts to deploy to the same environment.

---

### **4. Concurrency & State Handling**

Concurrency is the hardest part of a CI/CD orchestrator. If two workers pick up the same task, or two pipelines try to deploy simultaneously, the system can fracture.

* **Optimistic Concurrency Control (OCC):** The `Tasks` table uses a `version` column. When a worker updates a task status from `PENDING` to `RUNNING`, it uses: 
    `UPDATE Tasks SET status = 'RUNNING', version = 2 WHERE id = X AND version = 1`. 
    If the update returns 0 rows affected, another worker grabbed it first.
* **Idempotent Workers:** Build and deployment tasks are designed to be idempotent. If a worker dies mid-deployment and the lock TTL expires, another worker picking up the task will safely overwrite or reconcile the state without side effects.
* **Heartbeats:** Workers send a heartbeat to the DB/Redis every 10 seconds. If a heartbeat is missed for 30 seconds, the orchestrator marks the task as `ORPHANED` and requeues it.

---

### **5. API Contracts**



**Trigger a Deployment**
```http
POST /api/v1/deployments
Content-Type: application/json

{
  "pipeline_id": "uuid",
  "commit_hash": "a1b2c3d4",
  "strategy": "CANARY",
  "canary_steps": [10, 50, 100]
}
```
*Response: `202 Accepted` with `run_id`.*

**Approve a Manual Health Gate**
```http
POST /api/v1/pipelines/runs/{run_id}/gates/{task_id}/approve
```
*Response: `200 OK`.*

**Trigger Emergency Rollback**
```http
POST /api/v1/deployments/{run_id}/rollback
```
*Response: `202 Accepted`. Instantly cancels pending forward tasks and spawns a Rollback DAG sequence.*

---

### **6. Trade-offs Discussed**

1.  **Polling vs. Webhook for Health Gates:**
    * *Decision:* Polling via background workers.
    * *Trade-off:* While webhooks (e.g., Datadog pushing an alert to the pipeline) are lower latency, they require complex reverse-integration. Polling the metrics provider (Prometheus/Datadog) every 15 seconds during a canary rollout is slightly more resource-intensive but vastly more reliable and decoupled.
2.  **Stateful vs. Stateless Workers:**
    * *Decision:* Stateless workers using ephemeral containers (e.g., Kubernetes Pods).
    * *Trade-off:* Spinning up a pod for a build task adds latency (a few seconds) compared to a persistent stateful worker. However, it guarantees a clean environment, preventing "works on my machine" residue where an artifact builds only because of cached files from a previous run.
3.  **Database: Consistency over Availability (CP in CAP):**
    * If the database goes down, the pipeline engine halts. We trade availability for strict consistency, because a split-brain scenario where two instances believe they have the right to deploy to production is catastrophic.

---

### **7. Key Flows Walkthrough**

#### **Happy Path: Blue-Green Rollout**
1.  **Build:** User pushes code. Webhook hits the API. Engine parses the DAG and creates a DB Run. Worker picks up the Build Task, compiles the code, and uploads the artifact to S3.
2.  **Deploy (Green):** Worker downloads the artifact and deploys it to the inactive environment (Green).
3.  **Health Gate:** Worker triggers the `HealthGate.evaluate()` method. It runs end-to-end smoke tests against Green.
4.  **Traffic Shift:** Health gate passes. Worker updates the API Gateway/Load Balancer to route 100% of traffic to Green.
5.  **Teardown:** Blue environment is spun down to save resources. Run is marked `SUCCESS`.

#### **Failure & Edge Case: Canary Rollback due to Metric Spike**
1.  **Canary Deploy:** Engine deploys the artifact to 10% of production pods.
2.  **Health Gate Failure:** The polling worker queries Prometheus and notices the `HTTP 5xx Error Rate` exceeds the 1% threshold for the canary pods.
3.  **Halt:** Engine immediately marks the task `FAILED` and halts further DAG execution.
4.  **Auto-Rollback:** The engine invokes `CanaryStrategy.rollback()`.
5.  **Revert:** The load balancer is reverted to route 100% traffic to the stable baseline pods. The canary pods are killed.
6.  **Audit:** The artifact is marked as `UNSAFE_FOR_PROD` in the DB, and Slack alerts are fired to the engineering team.