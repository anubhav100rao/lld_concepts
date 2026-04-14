## URL Shortener

### 1. Core Architecture & Encoding Scheme

To generate short URLs, we have two primary approaches: Hashing (e.g., MD5 + Base62) or a Distributed Counter (Key Generation Service). We will use the **Distributed Counter + Base62 Encoding** approach.

* **Why Counter + Base62?** Hashing produces collisions that require expensive DB lookups and retries to resolve. A distributed counter guarantees unique IDs. We convert this base-10 ID to a Base-62 string (a-z, A-Z, 0-9). 
* **Capacity:** A 7-character Base62 string yields $62^7 \approx 3.5 \times 10^{12}$ unique URLs, enough to generate 1,000 URLs per second for over 100 years.

---

### 2. Core Classes & Interfaces (TypeScript/Java-esque)

```typescript
// --- Interfaces ---

interface UrlShortenerService {
    shortenUrl(req: ShortenRequest): Promise<ShortenResponse>;
    resolveUrl(shortAlias: string): Promise<string>;
}

interface KeyGenerator {
    getNextId(): Promise<number>;
}

interface CacheService {
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttlSeconds: number): Promise<void>;
}

interface AnalyticsPublisher {
    publishClickEvent(event: ClickEvent): void;
}

// --- Data Models ---

class UrlMapping {
    shortAlias: string;     // PK
    originalUrl: string;
    userId?: string;
    createdAt: Date;
    expiresAt?: Date;
    isCustom: boolean;
}

class ClickEvent {
    shortAlias: string;
    clickedAt: Date;
    ipAddress: string;
    userAgent: string;
    referer: string;
}

// --- Implementations ---

class UrlShortenerServiceImpl implements UrlShortenerService {
    constructor(
        private keyGenerator: KeyGenerator,
        private dbRepository: DatabaseRepository,
        private cache: CacheService,
        private analyticsPublisher: AnalyticsPublisher
    ) {}

    async shortenUrl(req: ShortenRequest): Promise<ShortenResponse> {
        let alias = req.customAlias;
        let isCustom = !!alias;

        if (isCustom) {
            // Collision handling for custom aliases
            const exists = await this.dbRepository.aliasExists(alias);
            if (exists) throw new ConflictException("Alias already in use");
        } else {
            // Auto-generation
            const uniqueId = await this.keyGenerator.getNextId();
            alias = Base62Encoder.encode(uniqueId);
        }

        const urlMapping = new UrlMapping(alias, req.longUrl, req.userId, new Date(), req.expiresAt, isCustom);
        await this.dbRepository.saveUrl(urlMapping);
        
        // Warm up the cache
        await this.cache.set(alias, req.longUrl, CACHE_TTL);

        return new ShortenResponse(alias);
    }

    async resolveUrl(shortAlias: string): Promise<string> {
        // 1. Check Cache
        let longUrl = await this.cache.get(shortAlias);
        
        if (!longUrl) {
            // 2. Check DB
            const mapping = await this.dbRepository.getUrl(shortAlias);
            if (!mapping) throw new NotFoundException("URL not found");
            if (mapping.expiresAt && mapping.expiresAt < new Date()) {
                throw new GoneException("URL has expired");
            }
            longUrl = mapping.originalUrl;
            await this.cache.set(shortAlias, longUrl, CACHE_TTL);
        }

        // 3. Fire-and-forget Analytics
        this.analyticsPublisher.publishClickEvent({
            shortAlias, 
            clickedAt: new Date(),
            // ... inject IP/UserAgent from request context
        });

        return longUrl;
    }
}
```

---

### 3. Database Schema

We use a relational database (e.g., PostgreSQL) or a NoSQL Key-Value store (e.g., DynamoDB). Given the heavy read volume, NoSQL is an excellent choice for the `URL_Mapping` table, but here is a standard normalized schema for clarity.

**Table: `URL_Mappings`**
| Column | Type | Constraints / Notes |
| :--- | :--- | :--- |
| `short_alias` | VARCHAR(15) | **Primary Key**, B-Tree Index |
| `original_url` | VARCHAR(2048) | |
| `created_at` | TIMESTAMP | |
| `expires_at` | TIMESTAMP | TTL Index (if DB supports it, or for cron cleanup) |
| `user_id` | VARCHAR(50) | Indexed (to fetch "My Links") |

**Table: `Analytics`** (Optimized for append-only, potentially in a Data Warehouse/Columnar DB like ClickHouse)
| Column | Type | Constraints / Notes |
| :--- | :--- | :--- |
| `id` | BIGINT | **Primary Key** |
| `short_alias` | VARCHAR(15) | Indexed |
| `clicked_at` | TIMESTAMP | |
| `ip_address` | VARCHAR(45) | |
| `country` | VARCHAR(50) | Derived asynchronously |

---

### 4. Concurrency & Collision Handling

* **Concurrency in ID Generation:** If multiple app servers ask a central DB for the `nextId()`, it becomes a massive bottleneck. 
    * **Solution:** Token Range Allocation (e.g., via ZooKeeper or a dedicated Redis counter). 
    * App Server A requests a block of IDs (e.g., `1,000,000` to `1,010,000`). It stores this range in memory and increments an `AtomicLong`. It only hits the central generator once every 10,000 requests. 
    * If Server A crashes, we lose those unused IDs, which is an acceptable trade-off for zero-latency ID generation.
* **Collision Handling:**
    * Auto-generated URLs will *never* collide due to the distributed counter.
    * Custom aliases handle concurrency via the Database's `UNIQUE` constraint on the `short_alias` Primary Key. If two threads insert "myPromo" simultaneously, one gets an `HTTP 409 Conflict`.

---

### 5. API Contracts

**1. Create Short URL**
* `POST /api/v1/urls`
* **Request:** `{"longUrl": "https://example.com/very-long", "customAlias": "promo24", "expiresInSec": 86400}`
* **Response (201 Created):** `{"shortUrl": "https://sho.rt/promo24"}`
* **Errors:** `400 Bad Request` (Invalid URL), `409 Conflict` (Custom alias taken).

**2. Redirect URL**
* `GET /{shortAlias}`
* **Response (302 Found):** `Location: https://example.com/very-long`
* **Errors:** `404 Not Found`, `410 Gone` (Expired).

---

### 6. Trade-offs Discussed

* **301 (Permanent) vs 302 (Temporary) Redirect:**
    * *Trade-off:* A 301 redirect is cached by the user's browser. Subsequent clicks bypass your server entirely, reducing latency and server load. However, you *lose* analytics for those subsequent clicks.
    * *Decision:* Use **302 Redirect**. URL shorteners rely heavily on accurate analytics. 302 forces the browser to hit our server every time, allowing us to track the click.
* **Memory vs. Latency (Caching):**
    * *Trade-off:* Hitting the DB for every read is slow.
    * *Decision:* Introduce an LRU (Least Recently Used) Cache (Redis). 80% of traffic usually hits 20% of the links (Pareto Principle). We cache the most popular URLs. Memory is traded for ultra-low latency.
* **Consistency vs. Availability (Analytics):**
    * *Trade-off:* Synchronously writing an analytics row to the DB before returning the redirect increases latency and risks failing the redirect if the analytics DB is down.
    * *Decision:* Favor Availability for redirects. Analytics tracking is pushed to an asynchronous message queue (e.g., Kafka). A separate worker consumes these events and batches them into the database.

---

### 7. Key Flows

* **Happy Path (Redirection):** User requests `sho.rt/Ab3x`. System checks Redis ($O(1)$). Cache miss. System queries PostgreSQL via PK index ($O(\log N)$). DB returns URL. System pushes event to Kafka (`AnalyticsPublisher`). System caches the result in Redis. System returns HTTP 302 to the user.
* **Failure Case (Cache Stampede):** A highly popular link goes viral, and the cache expires. Thousands of requests hit the DB simultaneously for the same alias. 
    * *Mitigation:* Implement "Mutex/Cache Locks" (or Read-through cache strategies). Only one thread is allowed to query the DB for that specific alias, while others wait briefly.
* **Edge Case (Expiration):** A cron job runs periodically to hard-delete expired mappings from the DB to save space, but the application logic also checks `expiresAt` dynamically during the `resolveUrl` flow to prevent serving stale content before the cron job runs.