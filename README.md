# Clock - Check-In/Check-Out System

A simple and efficient time tracking system for employees to check in/out and view their attendance records.

## Overview

Clock is a full-stack web application that provides:
- Employee login with JWT authentication
- Check-in/check-out functionality
- Monthly attendance record viewing
- Admin capabilities (Phase 2)

## Technology Stack

### Frontend
- Next.js 14 with React 18
- TypeScript
- Material-UI (MUI) v5
- Axios for API calls
- Formik + Yup for forms

### Backend
- Go 1.23+
- Iris web framework
- PostgreSQL 16
- JWT authentication
- sqlx for database operations

### Infrastructure
- Docker & Docker Compose
- Nginx reverse proxy
- sql-migrate for database migrations

## Project Structure

```
clock/
├── clock-backend/          # Go backend application
├── clock-frontend/         # Next.js React frontend
├── migrations/             # Database migrations
├── nginx/                  # Nginx configuration
├── docker-compose.yml      # Development environment
├── docker-compose.staging.yml  # Staging environment
├── PROJECT_PLAN.md         # Detailed project documentation
└── README.md               # This file
```

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Git
- (Optional) Go 1.23+ for local backend development
- (Optional) Node.js 18+ for local frontend development

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd clock
   ```

2. **Start the development environment**
   ```bash
   docker-compose up -d
   ```

   This will start:
   - PostgreSQL database on port 5433
   - Backend API on port 8080
   - Frontend app on port 3000

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080/api/v1
   - Database: localhost:5433

4. **Default login credentials**
   - Admin: `admin` / `admin123`
   - Staff: `john.doe` / `staff123`
   - Staff: `jane.smith` / `staff123`

### Database Management

The database is automatically initialized with the schema and seed data when the containers start.

To manually run migrations:
```bash
docker-compose exec backend sql-migrate up
```

To check migration status:
```bash
docker-compose exec backend sql-migrate status
```

### Stopping the Development Environment

```bash
docker-compose down
```

To remove volumes (reset database):
```bash
docker-compose down -v
```

## API Documentation

### Authentication

#### POST /api/v1/auth/login
Login with username and password.

**Request:**
```json
{
  "username": "john.doe",
  "password": "staff123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "employee": {
    "id": 2,
    "username": "john.doe",
    "name": "John Doe",
    "email": "john.doe@clock.local",
    "role": "STAFF"
  }
}
```

### Attendance (Requires Authentication)

All attendance endpoints require the `Authorization: Bearer <token>` header.

#### POST /api/v1/attendance/check-in
Check in to work.

#### POST /api/v1/attendance/check-out
Check out from work.

#### GET /api/v1/attendance/status
Get current check-in status.

#### GET /api/v1/attendance/records
Get attendance records with optional month filter.

**Query Parameters:**
- `year` (optional): e.g., 2026
- `month` (optional): 1-12

See [PROJECT_PLAN.md](./PROJECT_PLAN.md) for complete API documentation.

## Development

### Backend Development

1. Navigate to backend directory:
   ```bash
   cd clock-backend
   ```

2. Install dependencies:
   ```bash
   go mod download
   ```

3. Run locally (requires PostgreSQL):
   ```bash
   go run cmd/main.go
   ```

4. Run tests:
   ```bash
   go test ./...
   ```

### Frontend Development

1. Navigate to frontend directory:
   ```bash
   cd clock-frontend
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

3. Run development server:
   ```bash
   yarn dev
   ```

4. Build for production:
   ```bash
   yarn build
   ```

## Deployment

### Staging Deployment

1. SSH to staging server:
   ```bash
   ssh user@staging-server
   ```

2. Navigate to project directory:
   ```bash
   cd /path/to/clock
   ```

3. Pull latest changes:
   ```bash
   git pull origin main
   ```

4. Deploy with Docker Compose:
   ```bash
   docker-compose -f docker-compose.staging.yml up -d --build
   ```

5. Check logs:
   ```bash
   docker-compose -f docker-compose.staging.yml logs -f
   ```

### Production Deployment

Similar to staging deployment but using production configuration files and environment variables.

## Environment Variables

### Backend

Create `.env` file in `clock-backend/` directory:

```env
DB_HOST=localhost
DB_PORT=5433
DB_USER=clock_user
DB_PASSWORD=clock_pass
DB_NAME=clock
JWT_SECRET=your-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRATION=3600
JWT_REFRESH_EXPIRATION=604800
PORT=8080
ENV=development
LOG_LEVEL=debug
```

### Frontend

Create `.env.local` file in `clock-frontend/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

## Database Schema

The database consists of two main tables:

1. **employees** - User accounts with authentication
2. **attendance_records** - Check-in/check-out events

Both tables support soft delete (via `deleted_at` column) for audit trails.

See [migrations/20260105000001-initial-schema.sql](./migrations/20260105000001-initial-schema.sql) for the complete schema.

## Security

- Passwords hashed with bcrypt (cost factor 10)
- JWT-based authentication with access and refresh tokens
- Rate limiting on API endpoints
- CORS configured for frontend origin only
- SQL injection prevention via parameterized queries
- HTTPS enforced in production

## Testing

### Backend Tests
```bash
cd clock-backend
go test ./...
```

### Frontend Tests
```bash
cd clock-frontend
yarn test
```

## Troubleshooting

### Database connection failed
- Ensure PostgreSQL container is running: `docker-compose ps`
- Check database logs: `docker-compose logs postgres`
- Verify credentials in `.env` file

### Frontend can't connect to backend
- Verify backend is running: `docker-compose ps`
- Check NEXT_PUBLIC_API_URL in frontend `.env.local`
- Check CORS configuration in backend

### Migrations not running
- Check backend logs: `docker-compose logs backend`
- Manually run migrations: `docker-compose exec backend sql-migrate up`

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Run tests
4. Commit with descriptive message
5. Push and create a pull request

## License

[Add your license here]

## Support

For detailed documentation, see [PROJECT_PLAN.md](./PROJECT_PLAN.md).

For issues and questions, [add contact information or issue tracker link].

---

**Status:** Phase 1 (Planning Complete - Ready for Implementation)

**Version:** 0.1.0

**Last Updated:** 2026-01-05
