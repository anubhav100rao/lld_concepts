# Back-of-the-Envelope Calculations

> The ability to estimate system scale quickly is the single most important skill in a system design interview. This guide covers the mental math, patterns, and worked examples you need.

---

## 1. Essential Mental Math

### Powers of 2

| Power | Value         | Mnemonic  |
| ----- | ------------- | --------- |
| 2¹⁰   | ≈ 10³         | 1 KB      |
| 2²⁰   | ≈ 10⁶         | 1 MB      |
| 2³⁰   | ≈ 10⁹         | 1 GB      |
| 2⁴⁰   | ≈ 10¹²        | 1 TB      |

### Latency Numbers Every Engineer Should Know

| Operation              | Latency | Ratio to RAM  |
| ---------------------- | ------- | ------------- |
| L1 cache               | ~1 ns   | 0.01×         |
| L2 cache               | ~4 ns   | 0.04×         |
| RAM access             | ~100 ns | 1× (baseline) |
| SSD random read        | ~100 µs | 1,000×        |
| HDD seek               | ~10 ms  | 100,000×      |
| Network (same DC)      | ~0.5 ms | 5,000×        |
| Network (cross region) | ~100 ms | 1,000,000×    |

> **Key insight:** Disk is 10⁵× slower than RAM. Network is often your biggest bottleneck, not CPU.

### Time Conversions (Anchor Numbers)

| Duration | Seconds  | QPS Rule of Thumb        |
| -------- | -------- | ------------------------ |
| 1 minute | 60       |                          |
| 1 hour   | 3,600    |                          |
| 1 day    | **~10⁵** | 1M requests/day ≈ 10 QPS |
| 1 month  | ~2.5×10⁶ |                          |
| 1 year   | ~3×10⁷   |                          |

**QPS anchor table** (memorize these):

| Daily Volume | ≈ QPS   |
| ------------ | ------- |
| 1M/day       | 10      |
| 100M/day     | 1K      |
| 1B/day       | 10K     |
| 10B/day      | 100K    |

---

## 2. Core Estimation Patterns

### Pattern 1 — QPS from Daily Users

```
QPS ≈ (daily requests) / 10⁵
```

**Example:** 10M daily users × 2 requests each = 20M requests/day → **200 QPS**

### Pattern 2 — Storage

```
Daily storage = requests/day × avg payload size
Yearly storage = daily × 365
```

**Example:** 10M requests/day × 1 KB each = 10 GB/day → **~3.6 TB/year**

Always factor in:
* Payload size per request
* Retention period
* Replication factor (typically 3×)

### Pattern 3 — Bandwidth

```
Bandwidth = QPS × payload size
```

**Example:** 1,000 QPS × 1 KB = 1 MB/sec

### Pattern 4 — Cache Sizing (80/20 Rule)

```
Cache size ≈ 20% of total hot data
```

**Example:** Total data = 1 TB → cache ≈ 200 GB (assuming 80% hit rate on 20% of data)

### Pattern 5 — Peak vs Average

```
Peak QPS ≈ Avg QPS × 3  (typical multiplier: 2–5×)
```

**Example:** Avg 200 QPS → Peak ~600 QPS. Always design for peak, not average.

---

## 3. Data Size Heuristics

| Data Type        | Typical Size    |
| ---------------- | --------------- |
| UUID / User ID   | 8–16 bytes      |
| Timestamp        | 8 bytes         |
| Short string     | 50–200 bytes    |
| Small JSON       | 1 KB            |
| Image (compressed) | 100 KB – 1 MB |
| Video (1 min)    | 10–50 MB        |

---

## 4. System Characterization

### Read vs Write Ratios

| System Type  | Read:Write | Implication                      |
| ------------ | ---------- | -------------------------------- |
| Social media | 100:1      | Optimize reads, cache aggressively |
| Messaging    | 1:1        | Balance read/write paths         |
| Logging      | 1:10       | Optimize writes, batch + compress |

### Cardinality Estimation

Always clarify:
* **Total users** vs **DAU** (typically 10–30% of total)
* **DAU / MAU ratio** — signals engagement level
* **Actions per user per day**

### Growth Estimation

* Assume **2× yearly growth** as a safe default
* Design for **3–5 years ahead**
* Mention horizontal scaling for capacity planning

---

## 5. Common Interview Scenarios

### URL Shortener
* Read-heavy at redirect, write-heavy at creation
* Key space: 6 chars base62 → ~56 billion combinations
* Storage: each mapping ≈ 100 bytes

### Chat System
* 1B messages/day → ~10K QPS
* 1 KB/message → 1 TB/day storage
* Fan-out multiplies effective writes

### Logging / Metrics Pipeline
* Append-only, sequential disk I/O
* Compression is critical (10:1 ratio typical)
* Partition by time for efficient retention

### News Feed
* Fan-out-on-write vs fan-out-on-read trade-off
* Cache is critical for read path
* Celebrity problem: hybrid approach needed

---

## 6. Worked Example — WhatsApp Scale Estimation

A complete walkthrough showing senior-level estimation technique.

### Step 1 — User Base

| Metric      | Value  |
| ----------- | ------ |
| Total users | 2B     |
| DAU (20%)   | 400M   |

### Step 2 — Message Volume

```
Avg messages/user/day = 50
Total messages/day   = 400M × 50 = 20B messages/day
```

### Step 3 — QPS

```
QPS = 20B / 10⁵ = 200K messages/sec
Peak (3×)        = 600K messages/sec
```

### Step 4 — Storage

```
Avg message size  = 200 bytes
Daily storage     = 20B × 200B = 4 TB/day
Yearly storage    = ~1.5 PB/year
```

> At this scale, you need distributed storage: Cassandra, HDFS, or S3.

### Step 5 — Bandwidth

```
Ingestion bandwidth = 200K QPS × 200B = 40 MB/sec
Peak                = ~120 MB/sec
```

### Step 6 — Fan-out (Critical Insight)

Most candidates miss this. If average group size = 5:

```
Effective write ops = 200K × 5 = 1M ops/sec
```

Fan-out is what turns a "large" system into a "massive" one.

### Summary

| Metric            | Value             |
| ----------------- | ----------------- |
| Messages/day      | 20B               |
| Avg QPS           | 200K msg/sec      |
| Peak QPS          | 600K msg/sec      |
| Daily storage     | 4 TB              |
| Yearly storage    | 1.5 PB            |
| Effective writes  | 1M ops/sec        |

---

## 7. Worked Example — YouTube Scale Estimation

### Step 1 — User Base

| Metric            | Value  |
| ----------------- | ------ |
| Total users       | 2.5B   |
| DAU (30%)         | 750M   |
| Creators (0.1%)   | 2.5M   |

### Step 2 — Read Path (Video Streaming)

```
Avg videos watched/user/day = 5
Avg video length             = 5 min
Total watch time/day         = 750M × 5 × 5 min = 18.75B minutes/day
```

### Step 3 — Bandwidth (Read-Heavy)

```
Avg bitrate (720p)    = 2.5 Mbps
Concurrent viewers    = 750M / 24hrs × avg_session(30min) ≈ ~15M concurrent
Egress bandwidth      = 15M × 2.5 Mbps = 37.5 Petabits/sec → ~4.7 PB/sec
```

> This is why YouTube uses CDN edge caches globally — origin servers can't handle this alone.

### Step 4 — Write Path (Video Uploads)

```
Uploads/day           = 500K videos
Avg raw video size    = 500 MB
Daily upload ingress  = 500K × 500 MB = 250 TB/day
```

After transcoding into multiple resolutions (360p, 720p, 1080p, 4K):

```
Storage multiplier    = ~4× (multiple formats + thumbnails)
Daily storage         = 250 TB × 4 = 1 PB/day
```

### Step 5 — Bottleneck Analysis

| Component         | Concern                                    |
| ----------------- | ------------------------------------------ |
| Egress bandwidth  | Dominant cost — CDN is mandatory            |
| Transcoding       | CPU-intensive — async job queues needed     |
| Storage           | 1 PB/day — tiered storage (hot/warm/cold)  |
| Metadata DB       | 750M users × 5 reads = 3.75B queries/day → 37.5K QPS |

### Summary

| Metric              | Value              |
| -------------------- | ------------------ |
| Concurrent viewers   | ~15M               |
| Egress bandwidth     | ~4.7 PB/sec        |
| Uploads/day          | 500K               |
| Daily upload storage | 1 PB               |
| Metadata QPS         | 37.5K              |

---

## 8. Worked Example — Uber Scale Estimation

### Step 1 — User Base

| Metric            | Value  |
| ----------------- | ------ |
| Total riders      | 130M   |
| Daily active riders | 20M  |
| Total drivers     | 5M     |
| Active drivers    | 2M     |

### Step 2 — Location Updates (Write-Heavy)

Drivers send GPS pings every 4 seconds while online:

```
Active drivers        = 2M
Pings/driver/sec      = 1/4 = 0.25
Location update QPS   = 2M × 0.25 = 500K writes/sec
Peak (3×)             = 1.5M writes/sec
```

### Step 3 — Storage for Location Data

```
Each ping             = ~100 bytes (driver_id, lat, lon, timestamp, heading)
Daily pings           = 500K × 86,400 sec = ~43B pings/day
Daily storage         = 43B × 100B = 4.3 TB/day
```

> Location data is ephemeral (only recent positions matter for matching). Historical data goes to cold storage for analytics.

### Step 4 — Ride Matching

```
Ride requests/day     = 20M
Matching QPS          = 20M / 10⁵ = 200 QPS
```

Each match requires:
- Geospatial query (nearby drivers in H3 cell)
- ETA calculation for top ~10 candidates
- Atomic lock on chosen driver

```
Effective geospatial reads = 200 × 10 candidates = 2K reads/sec
```

### Step 5 — Bandwidth

```
Location ingestion    = 500K/sec × 100B = 50 MB/sec
Peak                  = 150 MB/sec
```

### Summary

| Metric                | Value              |
| --------------------- | ------------------ |
| Location update QPS   | 500K (1.5M peak)  |
| Daily location storage | 4.3 TB            |
| Ride matching QPS     | 200                |
| Ingestion bandwidth   | 50 MB/sec          |
| Bottleneck            | Geospatial index throughput |

---

## 9. Worked Example — Twitter Scale Estimation

### Step 1 — User Base

| Metric            | Value  |
| ----------------- | ------ |
| Total users       | 400M   |
| DAU (50%)         | 200M   |
| Power users (5%)  | 10M    |

### Step 2 — Tweet Ingestion (Write Path)

```
Tweets/day           = 500M (avg 2.5 per DAU)
Write QPS            = 500M / 10⁵ = 5K tweets/sec
Peak (5×)            = 25K tweets/sec
```

### Step 3 — Timeline Reads (Read Path)

```
Timeline refreshes/user/day = 10
Total reads/day             = 200M × 10 = 2B
Read QPS                    = 2B / 10⁵ = 20K QPS
Peak                        = 60K QPS
```

> Read:Write ratio ≈ 4:1 — heavily read-skewed.

### Step 4 — Fan-out (The Hard Part)

When a user tweets, it must appear in all followers' timelines:

```
Avg followers         = 200
Fan-out writes/tweet  = 200 home timeline inserts
Total fan-out/sec     = 5K tweets × 200 = 1M writes/sec to timeline cache
```

**Celebrity problem:** A user with 50M followers causes 50M writes per tweet.
- Solution: Hybrid fan-out — precompute for normal users, fan-out-on-read for celebrities.

### Step 5 — Storage

```
Avg tweet size        = 300 bytes (text + metadata, no media)
Tweet storage/day     = 500M × 300B = 150 GB/day
Media storage/day     ≈ 50M media tweets × 500 KB = 25 TB/day
Timeline cache        = 200M users × 200 tweets × 8B (tweet ID) = 320 GB
```

### Summary

| Metric               | Value              |
| -------------------- | ------------------ |
| Tweet write QPS      | 5K (25K peak)      |
| Timeline read QPS    | 20K (60K peak)     |
| Fan-out writes       | 1M ops/sec         |
| Tweet storage/day    | 150 GB             |
| Media storage/day    | 25 TB              |
| Timeline cache       | 320 GB             |
| Bottleneck           | Fan-out writes + celebrity problem |

---

## 10. Advanced Techniques

### Reverse Estimation

Instead of `users → QPS`, work backwards: if you know the infrastructure supports ~10K QPS, derive how many DAU that implies.

### Order-of-Magnitude Discipline

Interviewers care about getting the right **order of magnitude**, not exact numbers. Being off by 2× is fine. Being off by 1000× is not.

### Structured Approach

Always estimate in this order:
1. **Users** → DAU
2. **QPS** → peak QPS
3. **Storage** → daily, yearly
4. **Bandwidth** → ingress, egress
5. **Bottleneck** → what will break first?

---

## 11. Common Mistakes

| Mistake                        | Fix                                           |
| ------------------------------ | --------------------------------------------- |
| Forgetting peak traffic        | Always multiply avg by 3–5×                   |
| Ignoring network cost          | Network is often the true bottleneck           |
| Not estimating storage growth  | Project 3–5 years with replication factor      |
| Unrealistic assumptions        | State assumptions explicitly, justify each one |
| No justification of numbers    | Show your math, even if approximate            |
| Ignoring fan-out               | Multiply by recipients for messaging systems   |

---

## 12. Senior-Level Phrases

Use these to signal experience:

* *"Let me estimate the order of magnitude first before diving into design."*
* *"I'll assume peak is roughly 3× average."*
* *"By the 80/20 rule, we can cache the hot 20% of data."*
* *"This is read-heavy, so we optimize the read path with caching and replication."*
* *"At this scale, disk seek latency will dominate — we need sequential I/O."*

---

## 13. Practice Problems

Estimate these end-to-end (QPS, storage, bandwidth, bottleneck):

1. **Redis cache** — memory sizing for a 100M-user app
2. **Slack** — messages + file uploads + presence
3. **Instagram** — image uploads + feed generation
4. **Google Maps** — tile serving + route calculation
5. **Stripe** — payment processing + webhook delivery
