### SOCIAL MEDIA MICROSERVICE

- explaining the business logic of the service in detail

MENTAL NODE FOR RATELIMITING

- think of one service as just one project that is just handling 1 business

The core responsibilities of ths service

- ACCOUNT MANAGEMENT

* user registration
* email verification
* account activatuion/ deactivation
*

- AUTHENTICATION

* user login
* password hashing
* password verification
* token issing
* token rotation
* logout

- AUTHORIZATUIONz

* handle roles
* handle permuissuion

- TOKEN AND SESSUION MANAGEMENT

* Access and refresh token
* handle token verification, validation, revocation expiratuion
*

- SECURUITY

* Rate limiting(login attempts)

START

### Install the dependencies we are going to need.

- nodemom
- dotenv
- express
- express-rate-limit
- ioredis
- joi
- jsonwebtoken
- mongoose
- rate-limit-redis
- winston

### Create folder structure

- create src folder
- add folders(controller, models, routes, utils and middlewares)
- add server.js file

### USER-MODEL (models/User.js)

A schema model defines the core identity field for authN and authZ for the identity service

- import mongoose, argon2

PASSWORD HANDLIING

- we handled hashing password at the model level using pre("Save)
- password hashed using argon2 only if the password is modified
- password comparison is handled using userSchema method (comparePasswords)
- argon2.verify takes 2 args to complete
- timestamp: true tacks createdAt and updatedAt, important for auditing

INDEXING

- this is very important for me because i want to build fast services and indexing stores data in indexes making looking it up much faster

## NOTES - Pre and Post Hooks

- pre-hooks
  - used to validate or transform data before it us sved
  - eg hashing passwords
    userSchema.pre("save", async function (next){
    if(!this.isModified("password)) return next();
    this.password = await argon.hash(this.password)
    })
- Post-host
  - used to perform action after saving to the data base if successfull
  - used in logging, sending emails, cleaning up database

### REFRESH TOKEN MODEL

- Refresh tokens stored in the mongodb need their own database hense the model
- the token field only stores hashed refresh tokens not the raw value
- each token is linked to a user using ObjectId
-

### input validation with JOI

- previously in the same controller i would add the validation logic there , but joi handles vlidation seperately

- Joi is a schema based validation library for js that allows you to define blueprints for yur data to ensure tht it meets specific criteria before being added to the data base
- with joi you describe what your data should look like eg .string() .email() .required()
- joi provides very detailed error feedbacks
- automatically joi can perform data transformation tasks like whitespace trimming, converting strings to numbers ,stripping uknown fields

### TOKEN GENERATION(utils/generate.tokens.js)

- import crypto, jwt and token model
  ACCESSTOKENS - shortlived, stateles credentials used to authorize requests

- Access tokens are okay being stateless because the server does not track them.

REFRESH TOKENS - longlived credentils used to obtain new access tokens

- Refresh tokens however should be statefull on the server.
- Server needs to track them in order to be able to revoke, rotate and detect use
- Refresh tokens can be be stored in Redis for faster reach, not permanent and uses TTL
- Refresh tokens can be stored in the database for durability and this enables auditability
- Before storing the refresh tokens they need to be hashed incase of a breach
- in the utils/generateToken.js i use crypto to create a random string
- then instead of just storing the random string i hash it using crypto too
