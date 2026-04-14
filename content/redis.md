# 🧠 Redis — Mental Model First

Think of **Redis** as:

> A **single-threaded, in-memory, ultra-fast data structure server** with optional durability and rich primitives.

Key implications:

* RAM-first → microsecond latency
* Single-threaded → no locks → predictable performance
* Data structures → not just key-value, but *operations on structures*

---

# ⚡ Core Design Philosophy

### 1. Single-threaded event loop

* Uses **epoll/kqueue** underneath
* Avoids locks → simpler + faster
* Bottleneck = CPU core (but mitigated via clustering)

👉 Staff-level insight:

* You optimize Redis by **reducing round trips**, not threads

---

### 2. In-memory with optional persistence

* Writes go to memory first
* Persistence is async (mostly)

Tradeoff triangle:

```
Latency ↔ Durability ↔ Throughput
```

---

# 🧱 Data Structures (Know Use Cases Deeply)

### Strings

* Most common
* Max size: 512 MB
* Use cases:

  * caching
  * counters (`INCR`)
  * distributed locks

---

### Lists (linked list)

* Ordered, push/pop both sides

Use cases:

* queues (simple)
* streaming (lightweight)

---

### Sets / Sorted Sets

#### Sets

* unique elements
* operations: union/intersection

#### Sorted Sets (ZSET)

* score + value

🔥 **Important use cases**

* leaderboards
* rate limiting
* scheduling systems

---

### Hashes

* small objects (like JSON-lite)

👉 optimization:

* memory-efficient encoding (ziplist / listpack)

---

### Streams

* append-only log

Use cases:

* Kafka-lite
* event sourcing
* consumer groups

---

### Bitmaps / HyperLogLog

* probabilistic / compact structures

Use cases:

* unique counts at scale
* feature flags

---

# 🚀 Performance Model

### Why Redis is fast

* In-memory
* Single-threaded
* No context switching
* Efficient encodings

### Real bottlenecks

* network I/O
* large values
* blocking commands

👉 Staff insight:

> Redis performance is often *network-bound, not CPU-bound*

---

# 🧵 Concurrency Model

Redis is:

* single-threaded for command execution
* multi-threaded for I/O (since Redis 6)

### Atomicity

Every command is atomic

Example:

```redis
INCR key
```

→ no race condition

---

# 🔐 Transactions

### MULTI / EXEC

* queues commands
* executes atomically

BUT:

* no rollback
* no isolation levels like SQL

---

### WATCH (optimistic locking)

* CAS mechanism

Pattern:

```redis
WATCH key
GET key
MULTI
SET key new_value
EXEC
```

---

# ⚙️ Persistence

## 1. RDB (Snapshotting)

* point-in-time snapshots

Pros:

* fast recovery
* compact

Cons:

* data loss window

---

## 2. AOF (Append Only File)

* logs every write

Modes:

* always
* every second (default)
* no fsync

Tradeoff:

* durability vs latency

---

## Hybrid

* RDB + AOF (best practice)

---

# 🧠 Memory Management

### Eviction Policies

* LRU
* LFU
* TTL-based
* random

👉 Most important:

* `allkeys-lru`
* `volatile-lru`

---

### Memory fragmentation

* jemalloc behavior
* can cause > actual memory usage

---

# 📦 Scaling Redis

## Vertical scaling

* limited (single thread)

---

## Horizontal scaling → Redis Cluster

### Redis Cluster

* shards data across nodes
* 16384 hash slots

Key formula:

```
slot = CRC16(key) % 16384
```

---

### Key insight

Multi-key ops require same slot:

```
{user:1}:name
{user:1}:email
```

---

## Replication

* async replication
* master → replicas

---

### Failover

* handled by **Redis Sentinel**

---

# 🧠 Advanced Patterns (VERY IMPORTANT)

## 1. Caching Patterns

### Cache-aside (most common)

* app reads DB → sets cache

Problems:

* stale data
* cache stampede

---

### Write-through / Write-back

* less common but useful

---

## Cache Stampede Solutions

* mutex lock (Redis lock)
* request coalescing
* jittered TTL

---

## 2. Distributed Locks

Using:

```redis
SET key value NX PX 10000
```

Critical:

* use unique value
* use Lua script for unlock

---

### Redlock Algorithm

* distributed locking across nodes

👉 Interview insight:

* controversial correctness
* mention tradeoffs

---

## 3. Rate Limiting

### Token bucket using ZSET

* timestamps as score

---

## 4. Pub/Sub

* real-time messaging
* not durable

---

## 5. Streams vs Kafka

| Feature    | Redis Streams | Kafka   |
| ---------- | ------------- | ------- |
| latency    | ultra low     | low     |
| durability | medium        | high    |
| scaling    | limited       | massive |

---

# 🔥 Lua Scripting

* server-side execution
* atomic

Use cases:

* complex operations
* avoid race conditions

---

# ⚠️ Pitfalls (INTERVIEW GOLD)

## 1. Big keys problem

* large values block event loop

---

## 2. Hot keys

* uneven load

Solutions:

* sharding
* replication

---

## 3. Cache inconsistency

* classic distributed system issue

---

## 4. Expensive commands

* `KEYS *` → O(N)
* use `SCAN`

---

## 5. Persistence latency spikes

* AOF fsync

---

# 🧠 Real System Design Usage

## Where Redis shines

### 1. Caching layer

* DB read offload

---

### 2. Distributed coordination

* locks
* leader election

---

### 3. Real-time systems

* leaderboards
* messaging

---

### 4. Feature stores (ML)

* low latency retrieval

---

# 🧩 Redis vs Other Systems

| System    | When to use            |
| --------- | ---------------------- |
| Redis     | low latency, ephemeral |
| Memcached | simpler cache          |
| Kafka     | durable streaming      |
| Cassandra | write-heavy persistent |

---

# 🧠 Staff-Level Talking Points

If you want to impress:

### 1. Tradeoffs

* Redis is not just cache → it's a **consistency tradeoff system**

---

### 2. Failure modes

* replication lag
* split brain

---

### 3. Cost awareness

* RAM expensive
* eviction strategy matters

---

### 4. Observability

* latency spikes
* memory fragmentation
* slowlog

---

### 5. Production tuning

* pipelining
* batching
* connection pooling

---

# ⚡ Redis Commands You MUST Know

* `SET NX PX` → locks
* `INCR` → counters
* `ZADD / ZRANGE` → ranking
* `HSET / HGET` → objects
* `EXPIRE` → TTL
* `SCAN` → safe iteration

---

# 🧠 Final Mental Model

> Redis is not just a cache.
> It’s a **low-latency, in-memory compute layer with data structure semantics and eventual durability**.
