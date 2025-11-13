import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve paths relative to this file so swagger works both in local dev and in Docker
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Banking System API',
      version: '1.0.0',
      description: `Complete banking system REST API with authentication, accounts, and transactions

## Authentication Instructions

1. **First, get a JWT token:**
   - Use \`POST /api/auth/register\` to create a new user, OR
   - Use \`POST /api/auth/login\` to login with existing credentials
   - Copy the \`token\` from the response

2. **Authorize in Swagger:**
   - Click the **"Authorize"** button (🔒) at the top right
   - In the "Value" field, paste ONLY the token (without "Bearer " prefix)
   - Click "Authorize" then "Close"
   - Now you can use all protected endpoints

3. **Token expires after 24 hours** - re-login to get a new token`,
      contact: {
        name: 'API Support'
      }
    },
    servers: [
      {
        url: 'https://localhost:5000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token. Get it by calling /api/auth/login or /api/auth/register'
        }
      }
    }
  },
  // Use absolute globs resolved from this config file. This ensures the spec is found
  // whether the app is run from the repo root or from inside the backend build context.
  apis: [path.join(__dirname, '..', 'routes', '*.js'), path.join(__dirname, '..', 'server.js')]
};

export const swaggerSpec = swaggerJsdoc(options);


