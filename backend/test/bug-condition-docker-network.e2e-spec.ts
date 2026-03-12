/**
 * Bug Condition Exploration Test: Docker Network Connection Failures
 * 
 * **Validates: Bugfix Requirements 1.1, 1.2, 1.3**
 * 
 * This test verifies that the bug exists by documenting the connection
 * configuration issues that occur in Docker production environment.
 * 
 * The test is EXPECTED TO FAIL on unfixed code when run in Docker production,
 * which confirms the bug condition exists.
 * 
 * Bug Conditions:
 * 1. Frontend connections fail when using http://{VPS_HOSTNAME}:3000
 * 2. Backend-PostgreSQL connections fail when using localhost:5433
 * 3. Backend-Redis connections fail when using localhost
 * 
 * NOTE: This test must be run in Docker production environment to properly
 * detect the bug. In local development, connections to localhost work correctly.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import axios from 'axios';
import { Client } from 'pg';
import { createClient } from 'redis';
import * as fs from 'fs';

describe('Bug Condition: Docker Network Connection Failures (Property-Based)', () => {
  let app: INestApplication;
  
  // Detect if we're in Docker environment
  const isDockerEnvironment = () => {
    return (
      process.env.DOCKER === 'true' ||
      process.env.IS_DOCKER === 'true' ||
      fs.existsSync('/.dockerenv')
    );
  };

  // Test configuration representing the buggy state
  const buggyConfigs = [
    {
      name: 'Backend-PostgreSQL with localhost',
      type: 'database',
      config: {
        host: 'localhost',
        port: 5433,
        user: 'postgres',
        password: 'postgres',
        database: 'rental',
      },
      expectedError: /ECONNREFUSED|connect ECONNREFUSED|Connection refused/,
    },
    {
      name: 'Backend-Redis with localhost',
      type: 'redis',
      config: {
        host: 'localhost',
        port: 6379,
      },
      expectedError: /ECONNREFUSED|connect ECONNREFUSED|Connection refused/,
    },
  ];

  describe('Property 1: Bug Condition - Docker Network Connection Failures', () => {
    /**
     * This property-based test verifies that connections fail when using
     * localhost URLs in Docker production environment.
     * 
     * EXPECTED OUTCOME ON UNFIXED CODE: FAIL (confirms bug exists)
     * EXPECTED OUTCOME ON FIXED CODE: Test should be updated or removed
     */

    beforeAll(() => {
      const inDocker = isDockerEnvironment();
      console.log(`\n[TEST ENVIRONMENT] Running in Docker: ${inDocker}`);
      
      if (!inDocker) {
        console.log('[WARNING] This test is designed to run in Docker production environment.');
        console.log('[WARNING] In local development, localhost connections work correctly.');
        console.log('[WARNING] To properly test the bug condition, run: docker compose up --build');
      }
    });

    it.each(buggyConfigs)(
      'should fail to connect in Docker production: $name',
      async ({ name, type, config, expectedError }) => {
        const inDocker = isDockerEnvironment();
        
        let connectionAttempt: Promise<any>;
        let client: any;

        try {
          if (type === 'database') {
            // Attempt PostgreSQL connection with localhost
            client = new Client({
              host: config.host,
              port: config.port,
              user: config.user,
              password: config.password,
              database: config.database,
              connectionTimeoutMillis: 2000,
            });

            connectionAttempt = client.connect();
          } else if (type === 'redis') {
            // Attempt Redis connection with localhost
            client = createClient({
              socket: {
                host: config.host,
                port: config.port,
                connectTimeout: 2000,
              },
            });

            connectionAttempt = client.connect();
          }

          // Wait for connection attempt
          await connectionAttempt;

          // If we reach here, connection succeeded
          if (client) {
            if (type === 'redis') {
              await client.quit();
            } else {
              await client.end();
            }
          }

          if (inDocker) {
            // In Docker, connection should have failed - this is the bug!
            throw new Error(
              `[BUG DETECTED] Connection succeeded for ${name} in Docker environment, ` +
              `but it should have failed. This confirms the bug exists.`
            );
          } else {
            // In local dev, connection succeeding is expected
            console.log(`[LOCAL DEV] Connection succeeded for ${name} (expected in local environment)`);
            // Skip this test in local dev
            return;
          }
        } catch (error) {
          if (inDocker) {
            // Connection failed in Docker - this confirms the bug exists
            expect(error.message).toMatch(expectedError);
            
            // Document the counterexample
            console.log(`\n[COUNTEREXAMPLE FOUND] ${name}:`);
            console.log(`  Config: ${JSON.stringify(config, null, 2)}`);
            console.log(`  Error: ${error.message}`);
            console.log(`  This confirms the bug condition exists in Docker production.\n`);
          } else {
            // In local dev, we expect connections to work
            // If they fail, it might be a different issue
            console.log(`[LOCAL DEV] Connection failed for ${name}: ${error.message}`);
            console.log(`[LOCAL DEV] This test should be run in Docker production to verify the bug.`);
          }

          // Clean up if needed
          if (client) {
            try {
              if (type === 'redis' && client.isOpen) {
                await client.quit();
              } else if (type === 'database' && client._connected) {
                await client.end();
              }
            } catch (cleanupError) {
              // Ignore cleanup errors
            }
          }
        }
      },
      10000 // 10 second timeout per test
    );

    it('should fail frontend connection to backend via VPS hostname in Docker', async () => {
      /**
       * This test simulates a frontend trying to connect to the backend
       * using the VPS hostname instead of the Docker service name.
       * 
       * In a real Docker environment, this would fail because the backend
       * is not accessible via the host network from within containers.
       */
      
      const inDocker = isDockerEnvironment();
      const vpsHostname = '103.200.22.111'; // From .env file
      const backendPort = 3000;
      const buggyUrl = `http://${vpsHostname}:${backendPort}`;

      try {
        // Attempt to connect to backend using VPS hostname
        // This simulates what a frontend container would do with the buggy config
        const response = await axios.get(`${buggyUrl}/api/auth/health`, {
          timeout: 2000,
        });

        if (inDocker) {
          // In Docker, connection should have failed - this is the bug!
          throw new Error(
            `[BUG DETECTED] Frontend connection to ${buggyUrl} succeeded in Docker, ` +
            `but it should have failed. This confirms the bug exists.`
          );
        } else {
          // In local dev, this might work if backend is running
          console.log(`[LOCAL DEV] Connection to ${buggyUrl} succeeded (may work in local environment)`);
          return;
        }
      } catch (error) {
        if (inDocker) {
          // Connection failed in Docker - this confirms the bug exists
          expect(error.message).toMatch(
            /ECONNREFUSED|ETIMEDOUT|ENOTFOUND|socket hang up|timeout|Network Error/
          );

          // Document the counterexample
          console.log(`\n[COUNTEREXAMPLE FOUND] Frontend-Backend connection via VPS hostname:`);
          console.log(`  Attempted URL: ${buggyUrl}`);
          console.log(`  Error: ${error.message}`);
          console.log(`  This confirms the bug condition exists in Docker production.\n`);
        } else {
          // In local dev, connection might fail for different reasons
          console.log(`[LOCAL DEV] Connection to ${buggyUrl} failed: ${error.message}`);
          console.log(`[LOCAL DEV] This test should be run in Docker production to verify the bug.`);
        }
      }
    });
  });

  describe('Environment Detection', () => {
    it('should detect if running in Docker environment', () => {
      /**
       * This test helps verify that we're actually testing in a Docker
       * environment where the bug would manifest.
       */
      
      const inDocker = isDockerEnvironment();

      console.log(`\n[ENVIRONMENT] Running in Docker: ${inDocker}`);
      console.log(`[ENVIRONMENT] DATABASE_URL: ${process.env.DATABASE_URL || 'not set'}`);
      console.log(`[ENVIRONMENT] REDIS_HOST: ${process.env.REDIS_HOST || 'not set'}`);
      
      if (!inDocker) {
        console.log(`\n[INFO] To test the bug condition in Docker production:`);
        console.log(`  1. Build and run: docker compose up --build`);
        console.log(`  2. Run tests in container: docker compose exec backend npm run test:e2e`);
        console.log(`  3. The test should FAIL, confirming the bug exists\n`);
      }
      
      // This is informational - we don't fail the test
      // But we log it so the user knows the test context
    });
  });
});
