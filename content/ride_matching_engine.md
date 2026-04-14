Designing a ride-matching engine is a classic, high-stakes engineering challenge. It requires balancing sub-second latency for geospatial lookups with strict transactional guarantees to prevent double-booking. 

Here is a comprehensive Low-Level Design (LLD) for the core matching engine.

---

### **1. Geospatial Indexing & Data Structures**

To match riders to drivers, we must rapidly query active drivers within a specific radius. Calculating raw Haversine distances for millions of drivers per second is mathematically prohibitive, so we use spatial indexing.

**Comparison of Spatial Indexes**

| Indexing System | Shape | Pros | Cons | Decision for this LLD |
| :--- | :--- | :--- | :--- | :--- |
| **Geohash** | Rectangle | Built into Redis, simple string prefix matching. | Edge cases where close coordinates have completely different hashes. | No. |
| **Google S2** | Square (Projected) | Excellent hierarchy, handles spherical distortion well. | Neighbor traversal can be complex depending on the cell. | No. |
| **Uber H3** | Hexagon | Equal distance from center to all neighbors, making radius/ETA calculations highly uniform and predictable. | Slightly more complex to implement than Geohash. | **Yes.** It is the industry standard for ride-sharing. |

**Data Structure Strategy**
* **Active Driver Location:** We cannot use a relational database for realtime location updates (drivers pinging every 3-5 seconds). 
* **Choice:** **Redis (In-Memory)**. We will map an H3 index (Resolution 9, roughly a 174-meter edge length) to a Redis `SET` or `Sorted Set` containing Driver IDs. 
* **Driver Metadata:** A separate Redis Hash stores the driver's exact lat/lon, status, and last heartbeat.

---

### **2. Core Classes & Interfaces**

Let's define the domain models and core engine interfaces.

```java
// Domain Models
enum RideStatus { REQUESTED, MATCHING, ACCEPTED, IN_PROGRESS, COMPLETED, CANCELLED }
enum DriverStatus { ONLINE, IN_RIDE, OFFLINE }

class Location {
    double latitude;
    double longitude;
    String h3Index; // Pre-computed at the edge/gateway
}

class RideRequest {
    String requestId;
    String riderId;
    Location pickupLocation;
    Location dropoffLocation;
    RideStatus status;
    long requestedAtEpochMs;
}

class Driver {
    String driverId;
    Location currentLocation;
    DriverStatus status;
    double rating;
}

// Core Engine Interface
interface RideMatchingEngine {
    List<Driver> findCandidateDrivers(Location pickup, int radiusH3Rings);
    double calculateMatchScore(RideRequest request, Driver driver);
    boolean dispatchToDriver(RideRequest request, String driverId);
    void handleTimeout(String requestId);
}
```

---

### **3. Database Schema**

We use a polyglot persistence approach: **Redis** for ephemeral state (matching, location) and **PostgreSQL/Cassandra** for durable state (financials, analytics).

**Table: `ride_requests` (PostgreSQL)**
* `request_id` (UUID, Primary Key)
* `rider_id` (UUID, Indexed)
* `driver_id` (UUID, Nullable)
* `pickup_lat`, `pickup_lon` (Decimal)
* `status` (Varchar/Enum)
* `created_at`, `updated_at` (Timestamp)

**Key/Value Design: Active Drivers (Redis)**
* **Spatial Index:** `Key: h3_cell:{h3_id} -> Value: Set<driver_id>`
* **Driver State:** `Key: driver:{driver_id} -> Value: Hash { lat, lon, status, last_ping_ms }`
* **Active Dispatch:** `Key: dispatch:{request_id} -> Value: driver_id` (With a TTL of 15 seconds).

---

### **4. API Contracts**

**1. Request Ride**
* **Method:** `POST /v1/rides`
* **Payload:** `{ "riderId": "uuid", "pickup": {"lat": 17.38, "lon": 78.48}, "dropoff": {"lat": 17.41, "lon": 78.45} }`
* **Response (202 Accepted):** `{ "requestId": "uuid", "status": "MATCHING" }`

**2. Update Driver Location (High Throughput)**
* **Method:** `PUT /v1/drivers/{driverId}/location` (Typically handled via gRPC or WebSockets for lower overhead)
* **Payload:** `{ "lat": 17.39, "lon": 78.47, "h3Index": "8962e24..." }`
* **Response (200 OK):** Empty body.

**3. Driver Accepts Ride**
* **Method:** `POST /v1/rides/{requestId}/accept`
* **Payload:** `{ "driverId": "uuid" }`
* **Error Codes:**
    * `409 Conflict`: Ride already accepted by another driver or cancelled.
    * `404 Not Found`: Request expired/timed out.

---

### **5. Concurrency & Locking**

The most critical concurrency issue is the **"Thundering Herd" or Double-Booking problem**: Two riders requesting the same nearby driver, or a driver receiving multiple requests simultaneously.

**Strategy: Distributed Locking via Redis (Lua Scripts)**
When the engine selects `Driver A` for `Ride 1`, it must "lock" the driver so they aren't dispatched to `Ride 2`.

1.  We use a Redis Lua script to atomically check and set the driver's state.
2.  `EVAL "if redis.call('hget', KEYS[1], 'status') == 'ONLINE' then redis.call('hset', KEYS[1], 'status', 'MATCHING'); return 1; else return 0; end"`
3.  If it returns `1`, the engine sends the notification to the driver. If `0`, the engine skips and moves to the next candidate driver.
4.  If the driver rejects or times out, the status reverts to `ONLINE`.

---

### **6. Core Mechanics: Scoring, ETA, and Timeouts**

**Driver Scoring**
We don't just pick the absolute closest driver; we score candidates based on multiple factors to optimize network efficiency.

$Score = (w_1 \times ETA\_seconds) + (w_2 \times Batching\_Efficiency) - (w_3 \times Driver\_Rating)$

* *ETA:* Lower is better.
* *Batching Efficiency:* Does giving this ride to this driver put them in a high-demand zone for their next ride?
* *Weights ($w_n$):* Dynamically tuned by Machine Learning models based on current city-wide demand.

**ETA Estimation**
1.  **Fast Path (Initial Filter):** Use raw H3 grid distances multiplied by a straight-line multiplier (e.g., 1.4) to find the top 10 candidates.
2.  **Accurate Path:** Send the top 10 candidates to a Routing API (Mapbox/Google Maps Matrix API or an internal OSRM engine) to get road-network ETAs accounting for one-way streets and current traffic.

**Request Timeout Handling**
A ride request typically times out if a driver doesn't accept within 10-15 seconds.
* **Mechanism:** When a dispatch is created, push a message to a **Kafka Delayed Topic** or a **RabbitMQ Dead Letter Queue** with a 15-second delay.
* **Processor:** A consumer reads this delayed message. It checks the DB/Redis: is the ride still `MATCHING`? 
* **Action:** If yes, the driver missed the request. Revert the driver to `ONLINE`, fetch the next candidate from the priority queue, and dispatch again.

---

### **7. Key Flows**

**Happy Path (Successful Match)**
1.  Rider calls `POST /v1/rides`. System creates `RideRequest` in DB, pushes event to a `matching_queue` (Kafka).
2.  `RideMatchingEngine` consumes the event. Determines H3 cell of pickup.
3.  Queries Redis for drivers in that cell and neighboring rings (radius expansion).
4.  Calculates ETAs and scores the top 5 candidates.
5.  Attempts to lock the #1 driver via Redis Lua script. Success.
6.  Pushes a WebSocket notification to the driver's app.
7.  Driver taps "Accept". API validates the state. Updates DB to `ACCEPTED`. Updates driver status to `IN_RIDE`. 

**Failure Case (Driver Rejects / Ignores)**
1.  Engine locks #1 driver and sends notification.
2.  Driver taps "Reject" OR 15-second delayed queue message fires.
3.  Engine unlocks #1 driver (sets status to `ONLINE`).
4.  Engine pulls candidate #2 from the previously calculated list.
5.  Repeats the lock and notify process.
6.  If all candidates exhaust, system expands the H3 radius and recalculates.

---

### **8. Trade-Offs & Architectural Decisions**

* **Memory vs. Latency (Driver Location):** We store driver locations in Redis rather than a persistent DB. *Trade-off:* We lose exact driver traces if Redis crashes, but we gain the sub-millisecond read/write speeds required for a realtime matching engine. Analytics traces are sent asynchronously to a data lake.
* **Consistency vs. Availability (CAP Theorem):** Ride matching leans heavily toward **Consistency (CP)** during the dispatch phase. It is better to fail a match and retry (briefly degrading availability) than to assign two riders to one driver (violating consistency and creating a terrible real-world user experience).
* **Push vs. Pull:** The driver app does not "pull" for ride requests. The backend pushes requests via WebSockets/Server-Sent Events (SSE). This heavily reduces API polling overhead but requires managing thousands of persistent TCP connections.