# Bug Condition Exploration Test - Execution Guide

## Overview

This document explains how to run the bug condition exploration test for the Docker network connection failures bug.

## Test File

`backend/test/bug-condition-docker-network.e2e-spec.ts`

## Purpose

This test verifies that the bug exists by attempting connections using localhost URLs in a Docker production environment. The test is **EXPECTED TO FAIL** on unfixed code, which confirms the bug condition.

## Bug Conditions Being Tested

1. **Frontend-Backend Connection**: Frontend containers trying to connect to backend using VPS hostname (`http://103.200.22.111:3000`) instead of Docker service name (`http://backend:3000`)

2. **Backend-PostgreSQL Connection**: Backend trying to connect to PostgreSQL using `localhost:5433` instead of Docker service name `postgres:5432`

3. **Backend-Redis Connection**: Backend trying to connect to Redis using `localhost:6379` instead of Docker service name `redis:6379`

## Running the Test

### In Local Development (Current Environment)

```bash
cd backend
npm run test:e2e -- bug-condition-docker-network.e2e-spec.ts
```

**Expected Result**: Test PASSES (because localhost connections work in local dev)

**Note**: This does NOT properly test the bug condition. The bug only manifests in Docker production.

### In Docker Production (Proper Bug Detection)

1. **Build and start Docker containers**:
   ```bash
   docker compose up --build -d
   ```

2. **Run the test inside the backend container**:
   ```bash
   docker compose exec backend npm run test:e2e -- bug-condition-docker-network.e2e-spec.ts
   ```

**Expected Result**: Test FAILS (confirms the bug exists)

The test will output counterexamples showing:
- Connection errors when trying to reach localhost from within Docker
- Specific error messages (ECONNREFUSED, etc.)
- Configuration details that cause the failures

## Expected Counterexamples (When Run in Docker)

When the test runs in Docker production with the buggy configuration, it should document counterexamples like:

```
[COUNTEREXAMPLE FOUND] Backend-PostgreSQL with localhost:
  Config: {
    "host": "localhost",
    "port": 5433,
    "user": "postgres",
    "password": "postgres",
    "database": "rental"
  }
  Error: connect ECONNREFUSED 127.0.0.1:5433
  This confirms the bug condition exists in Docker production.

[COUNTEREXAMPLE FOUND] Backend-Redis with localhost:
  Config: {
    "host": "localhost",
    "port": 6379
  }
  Error: connect ECONNREFUSED 127.0.0.1:6379
  This confirms the bug condition exists in Docker production.

[COUNTEREXAMPLE FOUND] Frontend-Backend connection via VPS hostname:
  Attempted URL: http://103.200.22.111:3000
  Error: connect ETIMEDOUT
  This confirms the bug condition exists in Docker production.
```

## Test Status

- **Current Status**: Test written and validated in local development
- **Next Step**: Run in Docker production to document actual counterexamples
- **Expected Outcome**: Test FAILS in Docker (confirming bug exists)

## After Running in Docker

Once the test has been run in Docker and counterexamples are documented:

1. The test confirms the bug exists
2. Task 1 is complete
3. Proceed to Task 2 (implementing the fix)
4. After the fix, this test should be updated or removed as the bug will be resolved

## Notes

- This is a **bug condition exploration test**, not a regression test
- It's designed to FAIL on unfixed code
- It documents the specific failure modes of the bug
- After the fix is applied, the test behavior will change (connections will succeed)
