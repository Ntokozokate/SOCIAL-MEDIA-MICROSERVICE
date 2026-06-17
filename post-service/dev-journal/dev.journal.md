- post controller handles creating, editing, fetching, deleting posts.

- who has access has to be from a middleware that stands inbetween the post requests that will determine if the user is eligible to make that request

- that is when we create a auth middleware that conects from the suth service.

- post request only trusts the gateway never the client.

### authMiddleware

- this is header based identification
- instead of using jwt or a db session in this middleware the code looks for a specific header

* const userId = req.headers["x-user-id"];- pulls the identity directly from the incoming request headers.

- if the header is missing it logs an error and kills the request with a 401

* req.user = { userId }; - `attaches the ID t the request object.

### RESOURCE BASED THROTTLING

-
