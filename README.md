# Banking System

A complete banking system with REST API backend and modern React frontend, built with Node.js/Express and PostgreSQL.

## Features

### Backend
- RESTful API with Express.js
- JWT-based authentication
- Account management (create, view, delete)
- Transaction processing (deposits, withdrawals, transfers)
- Transaction history with filtering and pagination
- Balance inquiries
- Input validation and error handling
- Request logging and rate limiting
- Swagger/OpenAPI documentation

### Frontend
- Modern, responsive React application
- User authentication (login/register)
- Dashboard with account overview
- Account management interface
- Transaction form for deposits, withdrawals, and transfers
- Transaction history with search and filters
- Mobile-responsive design

### CLI Tools
- Database migrations
- Database seeding
- User management
- Account management
- Transaction execution
- Balance queries

## Prerequisites

- Node.js (v14 or higher)
- Docker and Docker Compose
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone https://github.com/swissmarley/banking-system.git
cd banking-system
```

2. Install backend dependencies:
```bash
npm install
```

3. Install frontend dependencies:
```bash
cd frontend
npm install
cd ..
```

4. Start PostgreSQL with Docker:
   ```bash
   npm run docker:up
   # or
   docker-compose up -d
   ```

5. Configure environment variables:
   
   Create a `.env` file in the root directory:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=bankingsystem
   DB_USER=postgres
   DB_PASSWORD=postgres
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   PORT=5000
   NODE_ENV=development
   ```

6. Run database migrations:
```bash
npm run migrate
```

7. (Optional) Seed the database with test data:
```bash
npm run seed
```

## Running the Application

### Start the backend server:
```bash
npm start
# or for development with auto-reload:
npm run dev
```

The API will be available at `http://localhost:5000`
Swagger documentation: `http://localhost:5000/api-docs`

### Start the frontend:
```bash
npm run client
```

The frontend will be available at `http://localhost:3000`

### Frontend API access

- The production build is served through Nginx (see `frontend/nginx/default.conf`), which now proxies `/api` and `/api-docs` back to the backend container and rewrites SPA routes to `index.html`. This removes the blank-page issue when accessing `/dashboard` or other client routes directly and keeps API calls on the same origin to avoid CORS errors.
- If you expose the API on a different public domain (for example, `https://api.example.com`), set `FRONTEND_PUBLIC_API_URL` in your `.env` before running `docker-compose build frontend`. The value is forwarded to the `REACT_APP_API_URL` build argument so the React app calls the correct host.
- `npm audit fix --force` still runs as part of the backend image build to address the node module warnings you observed. Create React App's toolchain cannot be auto-fixed with that flag without uninstalling `react-scripts`, so the frontend Dockerfile only runs `npm install`. The outstanding CRA advisories are documented via `npm audit` output and can be reviewed in the CI logs.

### API Documentation hosts

- The Swagger UI served at `/api-docs` now auto-detects the origin where it is being accessed (so `Try it out` calls hit the same domain/subdomain you used to open the docs).
- You can provide additional absolute URLs (for example, staging or production domains) via the `SWAGGER_SERVER_URLS` env variable in `.env`. Use a comma-separated list and they will appear in the Servers dropdown inside Swagger UI.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user info

### Accounts
- `GET /api/accounts` - Get all user accounts
- `POST /api/accounts` - Create a new account
- `GET /api/accounts/:id` - Get account by ID
- `DELETE /api/accounts/:id` - Delete an account

### Transactions
- `GET /api/transactions` - Get transaction history (with filters and pagination)
- `POST /api/transactions/deposit` - Deposit money
- `POST /api/transactions/withdraw` - Withdraw money
- `POST /api/transactions/transfer` - Transfer money
- `GET /api/transactions/balance/:account_id` - Get account balance

## CLI Commands

The Banking System includes an interactive CLI tool. Launch it with:

```bash
# Interactive mode (recommended)
node backend/cli.js
# or
node backend/cli.js -i

# Show help
node backend/cli.js -h
```

### Quick Command Examples

```bash
# Database
node backend/cli.js migrate                    # Run migrations
node backend/cli.js seed                      # Seed database
node backend/cli.js reset                     # Reset database (with confirmation)

# Users
node backend/cli.js create-user               # Interactive mode
node backend/cli.js create-user -u john -e john@example.com -p pass123

# Accounts
node backend/cli.js create-account            # Interactive mode
node backend/cli.js create-account -u 1 -t checking
node backend/cli.js list-accounts -u 1
node backend/cli.js balance -a 1

# Transactions
node backend/cli.js deposit -a 1 -m 100.50
node backend/cli.js withdraw -a 1 -m 50.00
node backend/cli.js transfer -f 1 -t 2 -m 25.00
node backend/cli.js history -u 1
```

**📖 For complete CLI documentation with API equivalents, see [CLI_DOCUMENTATION.md](./CLI_DOCUMENTATION.md)**

## Database Schema

### Users Table
- `id` (SERIAL, Primary Key)
- `username` (VARCHAR(50), Unique)
- `email` (VARCHAR(100), Unique)
- `password_hash` (VARCHAR(255))
- `created_at` (TIMESTAMP)

### Accounts Table
- `id` (SERIAL, Primary Key)
- `user_id` (INTEGER, Foreign Key)
- `account_number` (VARCHAR(50), Unique)
- `balance` (DECIMAL(18,2))
- `account_type` (VARCHAR(20))
- `created_at` (TIMESTAMP)

### Transactions Table
- `id` (SERIAL, Primary Key)
- `from_account_id` (INTEGER, Foreign Key, Nullable)
- `to_account_id` (INTEGER, Foreign Key, Nullable)
- `amount` (DECIMAL(18,2))
- `type` (VARCHAR(20))
- `status` (VARCHAR(20))
- `timestamp` (TIMESTAMP)

## Test Accounts

After seeding, you can use these test accounts:
- Email: `john@example.com`, Password: `password123`
- Email: `jane@example.com`, Password: `password123`
- Email: `bob@example.com`, Password: `password123`

## Docker Commands

- Start PostgreSQL: `npm run docker:up` or `docker-compose up -d`
- Stop PostgreSQL: `npm run docker:down` or `docker-compose down`
- View logs: `docker-compose logs -f postgres`
- Check status: `docker-compose ps`
- Reset database (removes all data): `docker-compose down -v`

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Rate limiting on API endpoints
- Input validation
- SQL injection protection (parameterized queries)
- CORS configuration

## Development

The project uses ES6 modules. Make sure your Node.js version supports ES modules.

For development with auto-reload:
```bash
npm run dev
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


