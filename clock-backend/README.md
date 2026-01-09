# Clock Backend API

Go backend service for the Clock check-in/check-out system.

## Tech Stack

- **Language**: Go 1.23+
- **Framework**: Iris v12
- **Database**: PostgreSQL 16
- **Authentication**: JWT (30-day expiration for intranet use)
- **Password Hashing**: bcrypt (cost 10)
- **Logging**: Zap (structured logging)

## Project Structure

```
clock-backend/
├── cmd/
│   └── main.go                 # Application entry point
├── pkg/
│   ├── handlers/              # HTTP request handlers
│   ├── models/                # Data models
│   ├── services/              # Business logic
│   ├── middleware/            # Middleware (JWT, CORS, etc.)
│   ├── database/              # Database connection
│   ├── reqres/                # Request/Response DTOs
│   ├── errors/                # Custom errors
│   └── utils/                 # Utilities (JWT, password, logger)
├── router/
│   └── router.go              # Route definitions
├── config/
│   └── config.go              # Configuration management
├── migrations/                # Database migrations
├── scripts/
│   └── generate_password.go  # Password hash generator
├── .env                       # Environment variables
├── Dockerfile                 # Docker image definition
└── docker-entrypoint.sh       # Docker startup script

```

## Setup

### Local Development

1. **Install dependencies**:
   ```bash
   go mod download
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Run migrations**:
   ```bash
   sql-migrate up -env=development
   ```

4. **Start the server**:
   ```bash
   go run cmd/main.go
   ```

The API will be available at `http://localhost:8080`

### Docker

Build and run with Docker:

```bash
docker build -t clock-backend .
docker run -p 8080:8080 --env-file .env clock-backend
```

## API Endpoints

### Authentication (Public)

- `POST /api/v1/auth/login` - Login with username/password
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout (client-side cleanup)

### Attendance (Protected)

Requires `Authorization: Bearer <token>` header

- `POST /api/v1/attendance/check-in` - Check in to work
- `POST /api/v1/attendance/check-out` - Check out from work
- `GET /api/v1/attendance/status` - Get current check-in status
- `GET /api/v1/attendance/records` - Get attendance records (with optional year/month filters)

### Settings (Protected)

- `PUT /api/v1/auth/change-password` - Change user password

## Test Credentials

After running migrations, the following test users are available:

- **Admin**: username: `admin`, password: `admin123`
- **Staff**: username: `jane.smith`, password: `staff123`

## Environment Variables

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=clock
DB_SSLMODE=disable

# JWT (30-day expiration for intranet use)
JWT_SECRET=your-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRATION=2592000        # 30 days in seconds
JWT_REFRESH_EXPIRATION=2592000

# Server
PORT=8080
ENV=development
LOG_LEVEL=debug

# CORS (Frontend URL)
FRONTEND_URL=http://localhost:3000
```

## Business Logic

### Check-In Rules

1. If user has active check-in from **previous day**:
   - Auto-close that record with status='AUTO_CLOSED'
   - Create new check-in for today
   - Return both new record and info about auto-closed record

2. If user has active check-in from **today**:
   - Return error: "You already have an active check-in today"

3. Otherwise:
   - Create new check-in record with status='CHECKED_IN'

### Check-Out Rules

- Employee must have an active check-in (status='CHECKED_IN') to check out
- Update the record's `check_out_time` to current timestamp
- Update status to 'CHECKED_OUT'
- If no active check-in found, return error

## Testing

Generate password hashes for testing:

```bash
go run scripts/generate_password.go <password>
```

Build and test the application:

```bash
# Build
go build -o clock-backend cmd/main.go

# Run tests
go test ./...
```

## Database Schema

The database uses two main tables:

- `employees` - User accounts with roles (STAFF, ADMIN)
- `attendance_records` - Check-in/check-out events with status tracking

See `migrations/20260105000001-initial-schema.sql` for complete schema.

## Security Features

- JWT-based authentication with 30-day expiration (suitable for intranet)
- bcrypt password hashing
- CORS configured for frontend origin only
- SQL injection prevention via parameterized queries
- Security headers (X-Content-Type-Options, X-Frame-Options, etc.)
- Request logging

## License

[Add your license here]
