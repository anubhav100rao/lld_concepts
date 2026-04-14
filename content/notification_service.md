### 1. API Contracts

**1.1. Event Ingestion API**
Used by upstream microservices to trigger a notification event (e.g., `ORDER_SHIPPED`).
* **Endpoint:** `POST /api/v1/events`
* **Request:**
    ```json
    {
      "event_id": "uuid-1234",
      "event_type": "ORDER_SHIPPED",
      "user_id": "user-789",
      "payload": { "order_id": "A123", "tracking_url": "..." },
      "priority": "HIGH" 
    }
    ```
* **Response:** `202 Accepted` (Acknowledges receipt; processing is asynchronous).
* **Error Handling:** `400 Bad Request` (Invalid schema), `429 Too Many Requests` (Rate limited).

**1.2. Preference Management API**
* **Endpoint:** `PUT /api/v1/users/{user_id}/preferences`
* **Request:**
    ```json
    {
      "channels": {
        "EMAIL": { "marketing": false, "transactional": true },
        "SMS": { "marketing": false, "transactional": true },
        "PUSH": { "marketing": true, "transactional": true }
      },
      "quiet_hours": { "start": "22:00", "end": "08:00", "timezone": "UTC" }
    }
    ```
* **Response:** `200 OK`

---

### 2. Database Schema

For this service, a polyglot persistence strategy is optimal:

**2.1. User Preferences (Document DB / PostgreSQL with JSONB)**
Read-heavy, updated infrequently. Cached heavily in Redis.
* **Table: `user_preferences`**
    * `user_id` (VARCHAR/UUID, Primary Key)
    * `preferences` (JSONB)
    * `updated_at` (TIMESTAMP)

**2.2. Notification Log & Tracking (Wide-Column Store like Cassandra / DynamoDB)**
Extremely high write throughput. Data is time-series by nature (can be TTL'd after 30-90 days).
* **Table: `notification_logs`**
    * `notification_id` (UUID, Partition Key)
    * `user_id` (UUID, Secondary Index for querying user history)
    * `event_id` (UUID)
    * `channel` (ENUM: EMAIL, SMS, PUSH)
    * `status` (ENUM: PENDING, DISPATCHED, DELIVERED, FAILED)
    * `provider_message_id` (VARCHAR, used for webhook reconciliation)
    * `created_at` (TIMESTAMP)

**2.3. Deduplication Store (Redis)**
* **Key:** `dedup:{event_id}:{channel}`
* **Value:** `1`
* **TTL:** 24 - 72 hours.

---

### 3. Core Classes & Interfaces

```java
// --- Core Interfaces ---

public interface NotificationChannel {
    boolean supports(ChannelType type);
    DeliveryResult send(NotificationContext context);
}

public interface PreferenceService {
    UserPreference getPreferences(String userId);
}

public interface DeduplicationService {
    boolean isDuplicate(String eventId, ChannelType channel);
}

// --- Domain Models ---

public class NotificationContext {
    private String notificationId;
    private String eventId;
    private String userId;
    private ChannelType channel;
    private Map<String, Object> payload;
    private UserDeviceMetadata deviceMetadata; // for Push
}

public class DeliveryResult {
    private Status status; // SUCCESS, RETRYABLE_FAILURE, TERMINAL_FAILURE
    private String providerMessageId;
    private String errorMessage;
}

// --- Orchestration (The Fan-Out Engine) ---

public class NotificationCoordinator {
    private PreferenceService preferenceService;
    private DeduplicationService dedupService;
    private MessagePublisher messagePublisher; // Publishes to channel-specific queues

    public void processEvent(Event event) {
        UserPreference pref = preferenceService.getPreferences(event.getUserId());
        List<ChannelType> activeChannels = evaluateChannels(event, pref);

        for (ChannelType channel : activeChannels) {
            if (!dedupService.isDuplicate(event.getEventId(), channel)) {
                NotificationContext ctx = buildContext(event, channel);
                messagePublisher.publish(channel.getQueueName(), ctx);
            }
        }
    }
}

// --- Dispatcher (Workers consuming from Queues) ---

public class ChannelDispatcher {
    private NotificationChannel channelProvider; // e.g., TwilioSmsProvider
    private TrackingRepository trackingRepo;

    @Consume(queue = "sms_queue")
    public void dispatch(NotificationContext context) {
        DeliveryResult result = channelProvider.send(context);
        
        if (result.getStatus() == Status.SUCCESS) {
            trackingRepo.updateStatus(context.getNotificationId(), Status.DISPATCHED, result.getProviderMessageId());
        } else if (result.getStatus() == Status.RETRYABLE_FAILURE) {
            handleRetry(context);
        } else {
            trackingRepo.updateStatus(context.getNotificationId(), Status.FAILED, result.getErrorMessage());
        }
    }
}
```

---

### 4. Data Structures & Concurrency Handling

**4.1. Deduplication (Redis `SETNX`)**
To prevent race conditions where duplicate events arrive concurrently, we use Redis `SETNX` (Set if Not eXists). 
* Complexity: $O(1)$
* If `SETNX` returns 1, proceed. If 0, drop the message.

**4.2. Concurrency: The Bulkhead Pattern**
Do not process SMS, Email, and Push notifications in the same thread pool. If the SendGrid (Email) API degrades and blocks threads, it will starve Twilio (SMS) processing.
* **Solution:** Route fanned-out messages to channel-specific queues (e.g., `email_queue`, `sms_queue`). Assign dedicated worker thread pools or container replicas to each queue.

**4.3. Retry Logic & Delay Queues**
Use an exponential backoff formula for retries: 
$$Delay = Base \times 2^{retry\_count} \pm Jitter$$
* **Implementation:** If a dispatch fails with a `RETRYABLE_FAILURE` (e.g., 429 Too Many Requests, 503 Service Unavailable from the provider), the message is routed to a Delay Queue (e.g., using RabbitMQ Dead Letter Exchanges with TTL, or AWS SQS Delay Queues) with an incremented `retry_count` header.
* Once `retry_count > MAX_RETRIES`, route to a Dead Letter Queue (DLQ) for manual inspection/alerting.

---

### 5. Key Flows

**5.1. Happy Path Flow**
1.  **Ingestion:** Upstream service POSTs `ORDER_SHIPPED`. API validates, pushes to `event_ingestion_queue`, returns 202.
2.  **Fan-out & Preference:** `NotificationCoordinator` consumes the event. Fetches user preferences (from Redis cache). User allows Email and SMS for transactional events.
3.  **Deduplication:** Checks Redis `SETNX dedup:uuid:EMAIL` and `dedup:uuid:SMS`. Both succeed.
4.  **Routing:** Coordinator publishes two separate JSON messages to `email_queue` and `sms_queue`.
5.  **Dispatch:** `SmsDispatcher` pulls from `sms_queue`, calls Twilio API. Twilio returns HTTP 200 with a `message_id`.
6.  **Tracking:** Dispatcher updates Cassandra: `status = DISPATCHED`.
7.  **Webhook Delivery:** Twilio asynchronously hits our webhook endpoint `/api/v1/webhooks/twilio` confirming delivery. We update Cassandra: `status = DELIVERED`.

**5.2. Failure & Edge Cases**
* **Provider Outage (e.g., SendGrid down):** The `EmailDispatcher` receives HTTP 500s. It updates Cassandra to `status = PENDING_RETRY`, increments `retry_count`, and pushes back to an SQS Delay Queue. Circuit breaker (e.g., Resilience4j) opens if failure rate exceeds 50%, pausing consumption from `email_queue` to prevent cascading failure.
* **Duplicate Event Ingestion:** Upstream sends the same `event_id` twice due to a network partition. The `NotificationCoordinator` checks Redis `SETNX`, which returns 0. The duplicate is silently dropped (idempotent).
* **Cache Stampede on Preferences:** If Redis restarts, fetching millions of user preferences from PostgreSQL simultaneously will crash the DB. *Solution:* Use an in-memory cache layer (Guava/Caffeine) locally in the pods, or employ a probabilistic early-expiration strategy to smooth out cache repopulation.

---

### 6. Trade-offs

**6.1. Consistency vs. Availability (CAP Theorem)**
* **Choice:** We favor **Availability** and **Partition Tolerance** (AP). Notifications are generally not financially binding transactions.
* **Trade-off:** We guarantee *at-least-once* delivery. While deduplication catches 99.9% of duplicates, if Redis crashes or a worker dies exactly after sending an email but before committing the status update, the user *might* receive a duplicate email upon retry. This is vastly preferable to an unavailable system where OTPs or security alerts are delayed.

**6.2. Latency vs. Storage**
* **Choice:** Heavy reliance on caching (Preferences) and fast in-memory stores (Deduplication) reduces latency but increases memory costs.
* **Trade-off:** We bound the storage cost by enforcing strict TTLs on deduplication keys (24 hours) and using tiered storage for Notification Logs (hot data in Cassandra, cold data shipped to S3/Parquet after 30 days).

**6.3. Push vs. Pull for Status Tracking**
* **Choice:** We rely on webhooks (Push) from providers (Twilio/APNS) for delivery tracking rather than polling (Pull).
* **Trade-off:** Requires public-facing webhook ingestion endpoints and handling provider-specific payload schemas. Polling would be easier to implement but would exhaust API rate limits and introduce severe latency in tracking.