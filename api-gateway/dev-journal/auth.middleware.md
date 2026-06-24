- An API gateway shouldnt blindly trust X-user-id headers coming from outside world
- the gateway must verify a JWT access token
- exttract te real userID from token
- then generate/ overide the X-user-Id yourself before passing it down

THE LIFE CYCLE

1. Client logs in and gets a JWT token
2. Client sends a request to your gateway with an Authorization Header :
   Authorization: Bearer <JWT_TOKEN>
3. Your gateway's authrequest middleware intecepts it , verifies the JWT signature using your secret key and reads the oayload.
4. If valid, the gateway manually inserts X-User-Id into request headers
5. The Gateway proxies the request to the post-service. Now, the post-service can completely trust the X-User-Id header because it knows only the Gateway could have put it there.

Option 2: Gateway asks Identity Service

Some companies do:

Client
↓
Gateway
↓
Identity Service
↓
Validate token

every request.

Example:

POST SERVICE REQUEST
↓
Gateway
↓
Identity Service
"Is this token valid?"
↓
yes/no

An important microservices pattern

After verification, the gateway often forwards trusted headers:

x-user-id: 123
x-user-role: user

to downstream services.

Architecture:

Client
|
| JWT
v
Gateway
|
| Verified User
v
Post Service

The Post Service does not need to verify JWTs again.

It trusts requests coming from the Gateway.

This is one of the biggest reasons gateways exist.

The Engineering Choices (Anticipating their questions)
Q: How do your microservices know who the user is if they don't validate the JWT themselves?

Your Answer: "I implemented a pattern called Context Propagation. The API Gateway acts as the trusted authenticator. It validates the JWT once, decrypts the payload, and injects user identity into downstream headers like x-user-id and x-user-role. The microservices behind the firewall are configured to trust these headers coming from the gateway, keeping them lightweight and decoupled from token logic."

Q: Why use an API Gateway for rate limiting instead of putting it on the microservices?

Your Answer: "Putting rate limiting at the gateway layer protects our entire network topology. With gatewayWideLimiter (backed by Redis), malicious traffic or noisy neighbors are blocked at the edge before hitting our internal networks or wasting microservice compute power."

Q: How did you handle pathing between public-facing APIs and internal APIs?

Your Answer: "I used a shared configuration object with proxyReqPathResolver to translate our versioned public endpoints (like /v1/posts) into our standard internal routes (like /api/posts). This decouples our external API contract from internal service routing."
