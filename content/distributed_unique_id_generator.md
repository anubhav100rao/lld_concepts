Designing a **Distributed Unique ID Generator** (often called a "Ticket Server" or "Snowflake" service) requires balancing high availability, low latency, and uniqueness across a cluster.

## 1. High-Level Strategy: Snowflake Approach
While UUIDs are simple, they are 128-bit and not naturally sortable. For most distributed systems, a **64-bit sortable ID** (Twitter Snowflake style) is preferred because it fits into a `long` and keeps database indexes efficient.



### The ID Structure (64 bits)
* **Sign Bit (1 bit):** Reserved for future use.
* **Timestamp (41 bits):** Millisecond precision (gives us ~69 years).
* **Datacenter ID (5 bits):** Supports 32 datacenters.
* **Worker ID (5 bits):** Supports 32 workers per datacenter.
* **Sequence Number (12 bits):** Supports 4,096 IDs per millisecond per worker.

---

## 2. Core Classes & Interfaces

### `IdGenerator` Interface
```java
public interface IdGenerator {
    /**
     * Generates a unique 64-bit ID.
     * @throws ClockMovedBackwardsException if system clock is skewed.
     */
    long nextId() throws ClockMovedBackwardsException;
}
```

### `SnowflakeGenerator` Implementation
```java
public class SnowflakeGenerator implements IdGenerator {
    private final long workerId;
    private final long datacenterId;
    private long sequence = 0L;
    private long lastTimestamp = -1L;

    // Constants for bit shifting
    private final long workerIdBits = 5L;
    private final long datacenterIdBits = 5L;
    private final long sequenceBits = 12L;

    public SnowflakeGenerator(long workerId, long datacenterId) {
        this.workerId = workerId;
        this.datacenterId = datacenterId;
    }

    @Override
    public synchronized long nextId() {
        long timestamp = System.currentTimeMillis();

        if (timestamp < lastTimestamp) {
            throw new ClockMovedBackwardsException("Clock moved backwards. Refusing to generate ID");
        }

        if (lastTimestamp == timestamp) {
            // Masking ensures sequence wraps at 4095
            sequence = (sequence + 1) & ((1 << sequenceBits) - 1);
            if (sequence == 0) {
                timestamp = tilNextMillis(lastTimestamp);
            }
        } else {
            sequence = 0L;
        }

        lastTimestamp = timestamp;

        return ((timestamp - EPOCH) << (workerIdBits + datacenterIdBits + sequenceBits))
                | (datacenterId << (workerIdBits + sequenceBits))
                | (workerId << sequenceBits)
                | sequence;
    }
}
```

---

## 3. Data Structures & Concurrency

| Component | Choice | Justification |
| :--- | :--- | :--- |
| **Concurrency** | `synchronized` / `Lock` | The generator must be thread-safe to ensure the `sequence` isn't duplicated within the same millisecond. |
| **Worker Coordination** | **Zookeeper / Etcd** | Used for service discovery and to assign unique `workerId` and `datacenterId` to instances on startup. |
| **Storage** | **In-memory** | To achieve sub-millisecond latency, IDs should not require a DB round-trip per request. |

---

## 4. API Contract & Error Handling

### API Signature
`GET /api/v1/generate-id`

**Success Response (200 OK):**
```json
{
  "id": "7102938475621001",
  "timestamp": 1712921300000
}
```

**Error Handling:**
* **503 Service Unavailable:** Clock skew detected (Critical).
* **429 Too Many Requests:** If the 4,096/ms limit is exceeded and the buffer/wait-time is too high.

---

## 5. Key Flows

### Happy Path
1.  Request arrives at a specific `WorkerNode`.
2.  Node checks current `System.currentTimeMillis()`.
3.  If it's a new millisecond, `sequence` resets to 0.
4.  ID is bit-shifted and returned.

### Edge Case: Clock Skew
If a server's clock is synchronized via NTP and moves **backward**, the generator might produce duplicate IDs.
* **Mitigation:** The `nextId()` method throws an exception if `currentTimestamp < lastTimestamp`. The service can then either wait for the clock to catch up or shut down to prevent collisions.

---

## 6. Trade-offs

### Memory vs. Latency
* **Snowflake:** Extremely low latency (in-memory) and low memory footprint.
* **Database Ticket Server (Flickr style):** Higher latency due to DB writes, but easier to manage as it doesn't rely on system clocks.

### Consistency vs. Availability
* **Consistency:** The system guarantees uniqueness (CP). If Zookeeper is down and a new node cannot get a `workerId`, it cannot start.
* **Availability:** During execution, it is highly available (AP) because it doesn't need to communicate with other nodes to generate an ID once it has its `workerId`.

### Future-Proofing
* **Epoch:** We use a custom epoch (e.g., `2026-01-01`) instead of the Unix epoch (1970) to maximize the 41-bit timestamp's lifespan.