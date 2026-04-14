Designing a Low-Level System for an Elevator Controller requires balancing real-time responsiveness with efficient scheduling. We’ll design for a multi-elevator bank (an "Elevator Group") that must handle concurrent requests and specialized modes like Fire Emergency.

---

## 1. Core Classes and Interfaces

We’ll use the **State Pattern** for elevator movement and the **Strategy Pattern** for the scheduling algorithm to allow for easy swaps between SCAN, LOOK, or Shortest Seek Time First (SSTF).

### Key Entities
* **Elevator:** Represents the physical unit (ID, current floor, direction, state).
* **ElevatorController:** The brain of a single elevator.
* **Dispatcher:** The central orchestrator that assigns "Hall Calls" (external buttons) to the best elevator.
* **Request:** Encapsulates the source floor, destination (if known), and priority.

### Class Definitions
```java
enum Direction { UP, DOWN, IDLE }
enum State { MOVING, STOPPED, MAINTENANCE, FIRE_MODE }

interface DispatchStrategy {
    int pickElevator(List<Elevator> elevators, HallRequest request);
}

class Elevator {
    int id;
    int currentFloor;
    Direction direction;
    State state;
    TreeSet<Integer> upStops;   // Floors to stop at while going up
    TreeSet<Integer> downStops; // Floors to stop at while going down

    void move();
    void openDoor();
}
```

---

## 2. Data Structures & Justification

* **`TreeSet<Integer>` (for Stops):** We use two `TreeSets` per elevator (`upStops` and `downStops`). 
    * **Justification:** `TreeSet` keeps floor numbers sorted. When moving `UP`, we fetch the `ceiling()` (next highest floor); when moving `DOWN`, we fetch the `floor()` (next lowest). This provides $O(\log N)$ insertion and retrieval.
* **`PriorityQueue` (for Dispatcher):** If using a weighted cost function to pick elevators, a min-priority queue helps select the optimal car based on proximity and load.

---

## 3. Scheduling Algorithm: LOOK vs. SCAN

We will implement the **LOOK** algorithm, which is an optimized version of SCAN (the "Elevator Algorithm").

* **SCAN:** The elevator travels from the bottom floor to the top floor and back, regardless of whether there are requests at the extremes.
* **LOOK:** The elevator only travels as far as the highest or lowest requested floor in its current direction, then reverses. This reduces latency by avoiding empty travel to terminal floors.



---

## 4. API Contracts

### External (Hall Button)
`POST /v1/request/hall`
* **Payload:** `{ floor: 5, direction: "UP", type: "NORMAL" }`
* **Errors:** `429 Too Many Requests`, `503 Service Unavailable (Fire Mode Active)`

### Internal (Inside Elevator)
`POST /v1/elevator/{id}/request/floor`
* **Payload:** `{ destinationFloor: 12 }`

### Admin/Emergency
`PUT /v1/system/mode`
* **Payload:** `{ mode: "FIRE_ALARM" }`

---

## 5. Handling Concurrency

The system is highly concurrent: multiple users press buttons simultaneously.
1.  **Request Locking:** Use a `ReentrantLock` or `synchronized` block on the `Elevator` object when updating its `TreeSets` to prevent race conditions.
2.  **Atomic State:** The `currentFloor` and `direction` should be `volatile` or updated via atomic references to ensure the Dispatcher sees the most recent position.
3.  **Producer-Consumer:** Hall calls are placed into a thread-safe `BlockingQueue`. The `Dispatcher` thread consumes these calls and assigns them.

---

## 6. Key Flows

### Happy Path: Hall Call
1.  User presses "UP" on Floor 3.
2.  **Dispatcher** calculates the "Cost" for each elevator. 
    * *Cost = Distance + Penalty (if moving away) + Penalty (if full).*
3.  Elevator A (moving UP at Floor 1) is chosen.
4.  Floor 3 is added to Elevator A's `upStops`.
5.  Elevator A reaches Floor 3, opens doors, and transitions to `STOPPED`.

### Priority Flow: Fire Mode
1.  Fire sensor triggers `SystemMode = FIRE_ALARM`.
2.  **Global Interrupt:** All current `upStops` and `downStops` are cleared for all elevators.
3.  **Override:** Every elevator is assigned a single destination: `Floor 0` (Lobby).
4.  **Lockdown:** Doors open at the lobby and remain open. Manual override by firefighters is required to resume service.

---

## 7. Trade-offs

| Factor | Choice | Trade-off |
| :--- | :--- | :--- |
| **Consistency vs. Availability** | **Eventual Consistency** | The display inside the elevator might lag by milliseconds behind the actual floor sensor (Availability), but the motor control must be strictly consistent for safety. |
| **Memory vs. Latency** | **Memory Intensive** | We store separate sets for directions and pre-calculate costs. This uses more RAM but ensures the Dispatcher can make a decision in $O(1)$ or $O(E)$ time (where E is # of elevators). |
| **Throughput vs. Fairness** | **LOOK Algorithm** | LOOK favors throughput (picking people up along the way) but can lead to "starvation" if the elevator stays busy in the middle floors while a user waits at the very top. |

---

## 8. Database Schema (Persistence/Logging)

While the real-time controller lives in RAM, we persist for analytics and maintenance.

```sql
-- Track elevator health and usage
CREATE TABLE elevator_metadata (
    elevator_id INT PRIMARY KEY,
    last_serviced TIMESTAMP,
    total_trips BIGINT,
    status VARCHAR(20) -- ACTIVE, FIRE, OUT_OF_SERVICE
);

-- Audit log for performance tuning
CREATE TABLE request_logs (
    id UUID PRIMARY KEY,
    elevator_id INT,
    source_floor INT,
    dest_floor INT,
    wait_time_seconds INT,
    request_time TIMESTAMP
);
```