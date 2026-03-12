# Design Document

## Bug Condition Specification

### Bug Condition: Docker Network Misconfiguration

```
isBugCondition(deployment) =
  deployment.environment == "production" AND
  deployment.platform == "docker" AND
  (
    // Frontend trying to connect via host network instead of Docker network
    (deployment.component == "frontend" AND 
     deployment.backendUrl.contains("localhost") OR
     deployment.backendUrl.contains(deployment.vpsHostname)) OR
    
    // Backend trying to connect to databases via localhost
    (deployment.component == "backend" AND
     (deployment.databaseUrl.contains("localhost") OR
      deployment.redisHost == "localhost"))
  )
```

**Concrete Bug Conditions:**

1. **Frontend Connection Bug**
   - Environment: Production Docker deployment on VPS
   - Trigger: `NEXT_PUBLIC_API_BASE_URL` or `VITE_API_BASE_URL` not set or empty
   - Behavior: Frontend constructs URL using `window.location.hostname:3000`
   - Result: Connection fails because backend is not accessible via host network

2. **Backend-PostgreSQL Connection Bug**
   - Environment: Production Docker deployment
   - Trigger: `DATABASE_URL` contains `localhost:5433`
   - Behavior: Backend attempts to connect to PostgreSQL on localhost
   - Result: Connection fails because localhost refers to backend container, not postgres service

3. **Backend-Redis Connection Bug**
   - Environment: Production Docker deployment
   - Trigger: `REDIS_HOST=localhost`
   - Behavior: Backend attempts to connect to Redis on localhost
   - Result: Connection fails because localhost refers to backend container, not redis service

### Counterexamples (Concrete Failing Cases)

**Frontend Connection Failures:**
- Users app with empty `NEXT_PUBLIC_API_BASE_URL` → constructs `http://103.200.22.111:3000` → fails
- Super-admin dashboard with empty `VITE_API_BASE_URL` → constructs `http://103.200.22.111:3000` → fails
- Login request from frontend → "cannot connect to backend API" error

**Backend Connection Failures:**
- Backend startup with `DATABASE_URL=postgresql://postgres:postgres@localhost:5433/rental` → PostgreSQL connection error
- Backend startup with `REDIS_HOST=localhost` → Redis connection error
- User login attempt → "Internal server error" due to database connection failure

## Expected Behavior Properties

### Property 1: Correct Docker Network Communication

```
expectedBehavior(deployment) =
  deployment.environment == "production" AND
  deployment.platform == "docker" =>
  (
    // Frontend uses Docker service names for server-side requests
    (deployment.component == "frontend" AND
     deployment.serverSideBackendUrl == "http://backend:3000") AND
    
    // Frontend uses public URL for client-side requests
    (deployment.component == "frontend" AND
     deployment.clientSideBackendUrl == deployment.publicApiUrl) AND
    
    // Backend uses Docker service names for databases
    (deployment.component == "backend" AND
     deployment.databaseUrl.contains("postgres:5432") AND
     deployment.redisHost == "redis")
  ) =>
  deployment.connectionStatus == "success"
```

**Expected Outcomes:**

1. **Frontend Server-Side Requests**
   - Next.js SSR/API routes use `http://backend:3000`
   - Vite React server-side proxy uses `http://backend:3000`
   - Connections succeed via Docker internal network

2. **Frontend Client-Side Requests**
   - Browser requests use public URL (e.g., `http://103.200.22.111:3000`)
   - Configured via `NEXT_PUBLIC_API_BASE_URL` and `VITE_API_BASE_URL`
   - Connections succeed via public network

3. **Backend Database Connections**
   - PostgreSQL: `postgresql://postgres:password@postgres:5432/rental?schema=public`
   - Redis: `REDIS_HOST=redis`, `REDIS_PORT=6379`
   - Connections succeed via Docker internal network

4. **User Experience**
   - Login and signup succeed without "Internal server error"
   - Data loads consistently without appearing/disappearing
   - Super-admin dashboard connects successfully

## Preservation Requirements

### Non-Bug Condition

```
¬isBugCondition(deployment) =
  deployment.environment == "development" OR
  deployment.platform != "docker" OR
  (
    deployment.environment == "production" AND
    deployment.platform == "docker" AND
    deployment.component NOT IN ["frontend", "backend"]
  )
```

**Scenarios to Preserve:**

1. **Local Development Mode**
   - Environment: `docker-compose.local.yml` or direct `npm run dev`
   - Backend URL: `http://127.0.0.1:3000` or `http://localhost:3000`
   - Database: `localhost:5433`
   - Redis: `localhost:6379`
   - Expected: All connections work as before

2. **Authenticated Request Processing**
   - Valid JWT tokens are processed correctly
   - Authorization checks work as before
   - Response formats remain unchanged

3. **CORS Configuration**
   - `CORS_ORIGIN=*` continues to allow cross-origin requests
   - No changes to CORS behavior

4. **Docker Build Process**
   - Existing Dockerfile configurations remain unchanged
   - Build processes continue to work
   - Container startup order preserved

5. **Prisma Migrations**
   - Init container runs migrations before backend starts
   - Migration process remains unchanged

### Preservation Properties

```
preservationProperty(deployment, F, F') =
  ¬isBugCondition(deployment) =>
  F(deployment) == F'(deployment)
```

Where:
- `F` = Original (unfixed) function behavior
- `F'` = Fixed function behavior
- For all non-buggy deployments, behavior must remain identical

**Specific Preservation Checks:**

1. **Local Development Connections**
   - `F(localDev).backendUrl == F'(localDev).backendUrl == "http://127.0.0.1:3000"`
   - `F(localDev).databasePort == F'(localDev).databasePort == 5433`

2. **Authentication Flow**
   - `F(validToken).response == F'(validToken).response`
   - `F(invalidToken).error == F'(invalidToken).error`

3. **CORS Behavior**
   - `F(crossOriginRequest).allowed == F'(crossOriginRequest).allowed == true`

4. **Container Build**
   - `F(dockerBuild).success == F'(dockerBuild).success == true`
   - `F(dockerBuild).imageSize ≈ F'(dockerBuild).imageSize` (within reasonable margin)

## Implementation Strategy

### Fix Approach

The fix involves updating environment variable configurations to use Docker service names for internal communication while maintaining localhost for local development:

1. **Frontend Configuration**
   - Add `NEXT_PUBLIC_API_BASE_URL` for client-side requests (public URL)
   - Use `http://backend:3000` for server-side requests in production
   - Keep localhost URLs for local development

2. **Backend Configuration**
   - Update `DATABASE_URL` to use `postgres:5432` in production
   - Update `REDIS_HOST` to use `redis` in production
   - Keep localhost URLs for local development

3. **Environment File Structure**
   - `.env.production` for production Docker deployment
   - `.env.local` or `.env` for local development
   - Docker Compose files pass appropriate environment variables

### Files to Modify

1. **Backend Environment Configuration**
   - `backend/.env` or `backend/.env.production`
   - Update `DATABASE_URL`, `REDIS_HOST`, `REDIS_PORT`

2. **Frontend Environment Configuration**
   - `users/.env.production` (Next.js app)
   - `super-admin/.env.production` (Vite React app)
   - Add `NEXT_PUBLIC_API_BASE_URL` and `VITE_API_BASE_URL`

3. **Docker Compose Configuration**
   - `docker-compose.yml` (production)
   - Ensure environment variables are passed correctly
   - Verify service names match configuration

4. **Frontend API Client Code**
   - `users/src/lib/api.ts` or similar
   - `super-admin/src/lib/api.ts` or similar
   - Update to use environment variables correctly

### Validation Strategy

1. **Bug Condition Exploration Test**
   - Test connection failures with localhost URLs in Docker
   - Verify errors match observed symptoms
   - Document counterexamples

2. **Preservation Tests**
   - Test local development connections still work
   - Test authentication flow unchanged
   - Test CORS behavior unchanged

3. **Fix Verification**
   - Test production Docker connections succeed
   - Test frontend can reach backend
   - Test backend can reach PostgreSQL and Redis
   - Test user login and data loading work

## Correctness Properties

### Property 1: Bug Condition (Exploration)

**Title:** Docker Network Connection Failures

**Type:** Bug Condition

**Description:** Verify that the bug exists - connections fail when using localhost URLs in Docker production environment.

**Test Approach:** Scoped property-based test focusing on concrete failing cases.

**Pseudocode:**
```
property_bugCondition_dockerNetworkFailures():
  // Concrete failing cases
  testCases = [
    {component: "frontend", backendUrl: "http://103.200.22.111:3000", expected: "connection_failure"},
    {component: "backend", databaseUrl: "postgresql://postgres:postgres@localhost:5433/rental", expected: "connection_failure"},
    {component: "backend", redisHost: "localhost", expected: "connection_failure"}
  ]
  
  for each testCase in testCases:
    result = attemptConnection(testCase.component, testCase.config)
    assert result.status == testCase.expected
    document counterexample: testCase
```

**Expected Outcome on Unfixed Code:** FAIL (confirms bug exists)

**Expected Outcome on Fixed Code:** Test should be updated or removed as bug is resolved

### Property 2: Preservation

**Title:** Local Development and Existing Functionality Preserved

**Type:** Preservation

**Description:** Verify that local development connections and existing functionality remain unchanged after the fix.

**Test Approach:** Property-based test covering non-buggy scenarios.

**Pseudocode:**
```
property_preservation_localDevelopment():
  // Test local development connections
  for all localDevConfig in generateLocalDevConfigs():
    assert connectionSucceeds(localDevConfig)
    assert backendUrl == "http://127.0.0.1:3000" OR "http://localhost:3000"
    assert databasePort == 5433
    assert redisPort == 6379

property_preservation_authentication():
  // Test authentication flow unchanged
  for all validToken in generateValidTokens():
    response = authenticatedRequest(validToken)
    assert response.status == 200
    assert response.format == expectedFormat

property_preservation_cors():
  // Test CORS behavior unchanged
  for all crossOriginRequest in generateCrossOriginRequests():
    response = makeRequest(crossOriginRequest)
    assert response.corsAllowed == true
```

**Expected Outcome on Unfixed Code:** PASS (confirms baseline behavior)

**Expected Outcome on Fixed Code:** PASS (confirms no regressions)

