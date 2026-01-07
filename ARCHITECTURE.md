# Clock System Architecture

## System Overview

The Clock system is a full-stack web application for employee time tracking with check-in/check-out functionality.

```
┌─────────────────────────────────────────────────────────────────┐
│                         User's Browser                          │
│                     (http://localhost:3000)                     │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                │ HTTP/HTTPS
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                         Nginx (Port 80)                         │
│                     Reverse Proxy & Load Balancer               │
└───────────┬─────────────────────────────┬───────────────────────┘
            │                             │
            │ /                           │ /api/*
            │                             │
┌───────────▼──────────────┐    ┌─────────▼──────────────────────┐
│   Frontend (Port 3000)   │    │    Backend API (Port 8080)     │
│                          │    │                                │
│  Next.js 14 + React 18   │    │  Go 1.23 + Iris Framework      │
│  TypeScript              │    │                                │
│  Material-UI (MUI)       │    │  - JWT Authentication          │
│  Redux + Context API     │    │  - RESTful API                 │
│  Axios                   │    │  - Rate Limiting               │
│  Formik + Yup            │    │  - Input Validation            │
└──────────────────────────┘    └────────┬───────────────────────┘
                                         │
                                         │ SQL Queries
                                         │
                                ┌────────▼─────────────────────────┐
                                │  PostgreSQL 16 (Port 5432)       │
                                │                                  │
                                │  - employees table               │
                                │  - attendance_records table      │
                                │  - Soft delete support           │
                                │  - Automatic timestamps          │
                                └──────────────────────────────────┘
```

## Component Architecture

### Frontend (Next.js + React)

```
src/
├── app/
│   ├── (auth)/login/              # Login page
│   └── (dashboard)/attendance/    # Main attendance page
├── components/
│   ├── auth/
│   │   └── LoginForm              # Login form with validation
│   ├── attendance/
│   │   ├── CheckInButton          # Check-in action
│   │   ├── CheckOutButton         # Check-out action
│   │   ├── AttendanceStatus       # Current status display
│   │   ├── AttendanceTable        # Records table
│   │   └── MonthSelector          # Month filter
│   └── layout/
│       ├── Header                 # App header
│       └── Sidebar                # Navigation (future)
├── context/
│   └── AuthContext                # User state management
└── services/
    ├── api                        # Axios instance
    ├── authService                # Auth API calls
    └── attendanceService          # Attendance API calls
```

### Backend (Go + Iris)

```
pkg/
├── handlers/
│   ├── auth.go                    # POST /auth/login, /auth/refresh
│   └── attendance.go              # Attendance CRUD handlers
├── services/
│   ├── auth.go                    # Login, token generation
│   └── attendance.go              # Check-in/out business logic
├── middleware/
│   └── middleware.go              # JWT auth, CORS, rate limit
├── models/
│   ├── employee.go                # Employee struct
│   └── attendance.go              # Attendance record struct
├── database/
│   └── postgres.go                # Database connection
└── utils/
    ├── jwt.go                     # JWT utilities
    └── password.go                # Bcrypt utilities
```

## Data Flow

### Authentication Flow

```
1. User enters credentials
   │
   ▼
2. Frontend sends POST /api/v1/auth/login
   │
   ▼
3. Backend validates credentials (bcrypt)
   │
   ▼
4. Backend generates JWT tokens (access + refresh)
   │
   ▼
5. Frontend stores tokens (localStorage/memory)
   │
   ▼
6. Frontend redirects to /attendance
```

### Check-In Flow

```
1. User clicks "Check In" button
   │
   ▼
2. Frontend sends POST /api/v1/attendance/check-in
   with Authorization header (JWT)
   │
   ▼
3. JWT Middleware validates token
   │
   ▼
4. Handler extracts employee_id from token
   │
   ▼
5. Service checks for active check-in (status='CHECKED_IN')
   │
   ├─ If exists from PREVIOUS DAY:
   │  - Auto-close old record with status='AUTO_CLOSED'
   │  - Create new check-in for today
   │  - Return new record + info about auto-closed record
   │
   ├─ If exists from TODAY:
   │  - Return error: "Already checked in today"
   │
   └─ If not exists:
      - Create new record with status='CHECKED_IN'
   │
   ▼
6. Frontend updates UI (disable check-in, enable check-out)
   Optional: Show notification if previous check-in was auto-closed
```

### Check-Out Flow

```
1. User clicks "Check Out" button
   │
   ▼
2. Frontend sends POST /api/v1/attendance/check-out
   with Authorization header (JWT)
   │
   ▼
3. JWT Middleware validates token
   │
   ▼
4. Service finds active check-in record
   │
   ├─ If not found: Return error
   │
   └─ If found: Update check_out_time and status='CHECKED_OUT'
   │
   ▼
5. Frontend updates UI and refreshes attendance table
```

### View Records Flow

```
1. User selects month (or default to current month)
   │
   ▼
2. Frontend sends GET /api/v1/attendance/records?year=2026&month=1
   with Authorization header (JWT)
   │
   ▼
3. Service queries attendance_records table
   - WHERE employee_id = <from JWT>
   - AND check_in_time >= '2026-01-01'
   - AND check_in_time < '2026-02-01'
   - AND deleted_at IS NULL
   - ORDER BY check_in_time DESC
   │
   ▼
4. Frontend displays records in table with formatting
```

## Database Schema

### employees

| Column        | Type                | Description                  |
|---------------|---------------------|------------------------------|
| id            | SERIAL PRIMARY KEY  | Unique employee ID           |
| username      | VARCHAR(50) UNIQUE  | Login username               |
| name          | VARCHAR(100)        | Full name                    |
| email         | VARCHAR(100) UNIQUE | Email address                |
| phone         | VARCHAR(20)         | Phone number                 |
| password_hash | VARCHAR(255)        | Bcrypt hashed password       |
| role          | employee_role       | 'STAFF' or 'ADMIN'           |
| is_active     | BOOLEAN             | Account status               |
| created_at    | TIMESTAMPTZ         | Record creation timestamp    |
| updated_at    | TIMESTAMPTZ         | Last update timestamp        |
| deleted_at    | TIMESTAMPTZ         | Soft delete timestamp (NULL) |

### attendance_records

| Column         | Type                | Description                    |
|----------------|---------------------|--------------------------------|
| id             | SERIAL PRIMARY KEY  | Unique record ID               |
| employee_id    | INTEGER FK          | References employees(id)       |
| check_in_time  | TIMESTAMPTZ         | When employee checked in       |
| check_out_time | TIMESTAMPTZ         | When employee checked out      |
| status         | attendance_status   | 'CHECKED_IN', 'CHECKED_OUT', or 'AUTO_CLOSED'  |
| check_in_note  | TEXT                | Optional check-in note         |
| check_out_note | TEXT                | Optional check-out note        |
| created_at     | TIMESTAMPTZ         | Record creation timestamp      |
| updated_at     | TIMESTAMPTZ         | Last update timestamp          |
| deleted_at     | TIMESTAMPTZ         | Soft delete timestamp (NULL)   |

## Security Architecture

### Authentication & Authorization

1. **Password Storage**
   - Bcrypt hashing with cost factor 10
   - Passwords never stored in plaintext
   - Salt generated automatically by bcrypt

2. **JWT Tokens (Intranet Environment)**
   - Access token: Extended expiration (30 days)
   - Refresh token: Extended expiration (30 days)
   - Tokens contain: employee_id, username, role, exp, iat
   - Signed with HMAC-SHA256
   - Long expiration reduces login friction in trusted corporate network
   - Users remain authenticated for up to 30 days

3. **Token Flow**
   ```
   Access Token Expired
   │
   ▼
   Frontend detects 401 response
   │
   ▼
   Send refresh token to /auth/refresh
   │
   ▼
   Receive new access + refresh tokens
   │
   ▼
   Retry original request
   ```

4. **Middleware Protection**
   - All `/api/v1/attendance/*` routes protected by JWT middleware
   - Middleware validates token signature and expiration
   - Injects employee info into request context
   - Returns 401 Unauthorized if invalid

### API Security

1. **CORS**
   - Whitelist only frontend origin
   - Allow credentials (cookies, authorization headers)
   - Specific HTTP methods only

2. **Rate Limiting**
   - General API: 100 requests/minute per IP
   - Login endpoint: 10 requests/minute per IP
   - Token bucket algorithm

3. **Input Validation**
   - Struct validation with `go-playground/validator`
   - SQL injection prevention via parameterized queries (sqlx)
   - XSS prevention via proper content types

4. **Security Headers**
   - X-Content-Type-Options: nosniff
   - X-Frame-Options: DENY
   - X-XSS-Protection: 1; mode=block
   - Content-Security-Policy (to be configured)

## Deployment Architecture

### Development Environment

```
┌─────────────────────────────────────────┐
│         Developer Machine (localhost)    │
│                                          │
│  ┌────────────┐  ┌──────────┐          │
│  │  Frontend  │  │  Backend │          │
│  │  :3000     │  │  :8080   │          │
│  └──────┬─────┘  └────┬─────┘          │
│         │             │                 │
│         └─────────┬───┘                 │
│                   │                     │
│           ┌───────▼────────┐            │
│           │   PostgreSQL   │            │
│           │     :5433      │            │
│           └────────────────┘            │
└─────────────────────────────────────────┘
```

### Staging/Production Environment

```
┌──────────────────────────────────────────────────────┐
│           Server (e.g., 192.168.0.77)                │
│                                                       │
│  ┌──────────────────────────────────────────────┐   │
│  │  Nginx (:8002 staging / :8001 production)    │   │
│  └────────┬─────────────────────────┬───────────┘   │
│           │                         │                │
│  ┌────────▼──────┐        ┌─────────▼─────────┐    │
│  │   Frontend    │        │     Backend       │    │
│  │  (container)  │        │   (container)     │    │
│  │   :3000       │        │     :8080         │    │
│  └───────────────┘        └─────────┬─────────┘    │
│                                     │               │
│           ┌─────────────────────────▼────────┐     │
│           │  PostgreSQL (container)          │     │
│           │  :5432 (internal)                │     │
│           │  :5434 staging / :5435 prod      │     │
│           └──────────────────────────────────┘     │
│                                                      │
│  Docker Networks:                                   │
│  - clock_internal (DB only)                        │
│  - clock_web (Frontend, Backend, Nginx)            │
└──────────────────────────────────────────────────────┘
```

## Scalability Considerations

### Current Design (Phase 1)
- Single backend instance
- Single database instance
- Suitable for up to 100 concurrent users
- Stateless backend (horizontal scaling ready)

### Future Enhancements (Phase 2+)
- **Load Balancing**: Multiple backend instances behind Nginx
- **Database Replication**: Read replicas for query performance
- **Caching Layer**: Redis for session management and hot data
- **CDN**: Static asset delivery
- **Message Queue**: For async tasks (email notifications, reports)

## Monitoring & Observability

### Health Checks
- Database: `pg_isready` check in Docker health check
- Backend: `/health` endpoint
- Frontend: Next.js built-in health checks

### Logging Strategy
- Backend: Structured logging with zap
  - Log levels: DEBUG, INFO, WARN, ERROR
  - JSON format for easy parsing
- Frontend: Browser console (dev), error tracking service (prod)
- Nginx: Access logs and error logs

### Metrics (Future)
- Prometheus for metrics collection
- Grafana for visualization
- Metrics to track:
  - API response times
  - Error rates
  - Database query performance
  - Active users
  - Check-in/check-out frequency

## Development Workflow

```
1. Developer writes code locally
   │
   ▼
2. Run tests (go test, yarn test)
   │
   ▼
3. Commit to feature branch
   │
   ▼
4. Create pull request
   │
   ▼
5. Code review + CI checks
   │
   ▼
6. Merge to main branch
   │
   ▼
7. Deploy to staging
   │
   ▼
8. QA testing in staging
   │
   ▼
9. Deploy to production
   │
   ▼
10. Monitor logs and metrics
```

## Key Design Decisions

1. **Why Iris instead of Gin/Echo?**
   - Following the somilk project pattern
   - Excellent performance and feature set
   - Built-in support for versioning and dependency injection

2. **Why Material-UI?**
   - Professional, polished components out of the box
   - Used in somilk project for consistency
   - Excellent documentation and community support

3. **Why Next.js instead of Create React App?**
   - Better performance with SSR/SSG capabilities
   - Built-in routing
   - Easy API route creation (if needed)
   - Production-ready optimizations

4. **Why Soft Delete?**
   - Audit trail requirements
   - Data recovery capability
   - Compliance and legal requirements

5. **Why JWT instead of Sessions?**
   - Stateless authentication (easier to scale horizontally)
   - Works well with Docker containers
   - No need for session storage
   - Mobile app ready (future)

6. **Why PostgreSQL instead of MySQL?**
   - Superior support for complex queries
   - Better JSON/JSONB support (future needs)
   - ENUM types for better data integrity
   - Excellent performance and reliability

## Future Architecture Enhancements

### Phase 2: Admin Features
- Admin dashboard with analytics
- User management interface
- Attendance reports and exports

### Phase 3: Scale & Performance
- Redis caching layer
- Read replicas for database
- CDN for static assets
- Load balancer with multiple backend instances

### Phase 4: Advanced Features
- Mobile app (React Native)
- Real-time notifications (WebSockets)
- Biometric authentication
- Geofencing for location-based check-in
- Integration with payroll systems

---

For detailed implementation plans, see [PROJECT_PLAN.md](./PROJECT_PLAN.md).
