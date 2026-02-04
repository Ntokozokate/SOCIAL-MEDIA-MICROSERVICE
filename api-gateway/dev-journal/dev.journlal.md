download our dependencies
cors, dotenv, express, expresshttp proxy, helmet, ioredis, jasonwebton, winston

### RATE-LIMIT (node-rate-limiter-flexible)

- LAYERED-DEFENCE (use 2-tier limiting)

* Gateway-Wide Limiter: Acts as a "Tsunami Shield." High throughput (e.g., 1000 req/s) to stop massive DDoS attacks at the entry point.
* Service-Specific Limiter: Protects individual resource pools. For example, the Auth Service has lower limits to prevent expensive password-hashing operations from exhausting the DB.
* Non-Blocking: By using ioredis with enableOfflineQueue: false, we ensure the Gateway fails fast if the cache is slow, preventing a "bottleneck" at the front door.
* Use insurance strategy using rate-limite-memory incase Redis connection drops
* Implement RateLimiterHeaders to inform the frontend on howmuch time or points are left
*
