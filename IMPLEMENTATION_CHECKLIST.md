# Clock System - Implementation Checklist

This checklist provides a step-by-step guide to implement the Clock check-in/check-out system from scratch.

## Phase 1: Core Functionality (MVP)

### 1. Project Setup

#### 1.1 Repository Setup
- [ ] Initialize git repository
- [ ] Create project directory structure
- [ ] Copy planning documents (already done)
- [ ] Create `.gitignore` file (already done)
- [ ] Create `.env.example` files (already done)
- [ ] Initial commit

#### 1.2 Backend Project Setup
- [ ] Create `clock-backend` directory
- [ ] Initialize Go module: `go mod init github.com/yourusername/clock-backend`
- [ ] Install dependencies:
  ```bash
  go get github.com/kataras/iris/v12
  go get github.com/lib/pq
  go get github.com/jmoiron/sqlx
  go get github.com/golang-jwt/jwt/v5
  go get golang.org/x/crypto/bcrypt
  go get github.com/go-playground/validator/v10
  go get go.uber.org/zap
  go get github.com/rubenv/sql-migrate/...
  ```
- [ ] Create directory structure (pkg/, cmd/, migrations/)
- [ ] Copy `.env.example` to `.env` and configure

#### 1.3 Frontend Project Setup
- [ ] Create `clock-frontend` directory
- [ ] Initialize Next.js with TypeScript:
  ```bash
  npx create-next-app@14 clock-frontend --typescript --tailwind --app --no-src-dir
  ```
- [ ] Install Material-UI dependencies:
  ```bash
  yarn add @mui/material @emotion/react @emotion/styled @mui/icons-material
  yarn add @mui/x-date-pickers date-fns
  ```
- [ ] Install other dependencies:
  ```bash
  yarn add axios formik yup
  yarn add -D @types/node
  ```
- [ ] Copy `.env.example` to `.env.local` and configure

---

### 2. Database Setup

#### 2.1 PostgreSQL Setup
- [ ] Create `docker-compose.yml` for local development
- [ ] Start PostgreSQL container
- [ ] Verify database connection

#### 2.2 Migrations
- [ ] Copy initial migration file to `clock-backend/migrations/`
- [ ] Generate actual bcrypt hashes for seed users
  ```bash
  go run scripts/generate_password.go admin123
  go run scripts/generate_password.go staff123
  ```
- [ ] Update migration file with real password hashes
- [ ] Test migration:
  ```bash
  sql-migrate up
  ```
- [ ] Verify tables created:
  ```sql
  \dt
  SELECT * FROM employees;
  ```

---

### 3. Backend Development

#### 3.1 Project Structure
- [ ] Create `cmd/main.go` (application entry point)
- [ ] Create `pkg/database/postgres.go` (database connection)
- [ ] Create `pkg/utils/logger.go` (structured logging setup)
- [ ] Test application starts and connects to database

#### 3.2 Models
- [ ] Create `pkg/models/employee.go`
  - [ ] Employee struct with json tags
  - [ ] Custom types for role
- [ ] Create `pkg/models/attendance.go`
  - [ ] AttendanceRecord struct
  - [ ] Custom types for status

#### 3.3 Configuration
- [ ] Create `pkg/config/config.go`
- [ ] Load environment variables
- [ ] Validate required config

#### 3.4 Utils
- [ ] Create `pkg/utils/jwt.go`
  - [ ] GenerateAccessToken()
  - [ ] GenerateRefreshToken()
  - [ ] ValidateToken()
  - [ ] ExtractClaims()
- [ ] Create `pkg/utils/password.go`
  - [ ] HashPassword()
  - [ ] ComparePassword()
- [ ] Write unit tests for utils

#### 3.5 Request/Response DTOs
- [ ] Create `pkg/reqres/auth.go`
  - [ ] LoginRequest
  - [ ] LoginResponse
  - [ ] RefreshTokenRequest
- [ ] Create `pkg/reqres/attendance.go`
  - [ ] CheckInRequest
  - [ ] CheckOutRequest
  - [ ] AttendanceResponse
  - [ ] AttendanceListResponse

#### 3.6 Services (Business Logic)
- [ ] Create `pkg/services/auth.go`
  - [ ] Login(username, password) (Employee, tokens, error)
  - [ ] RefreshToken(refreshToken) (tokens, error)
  - [ ] GetEmployeeByID(id) (Employee, error)
  - [ ] Write unit tests
- [ ] Create `pkg/services/attendance.go`
  - [ ] CheckIn(employeeID, note) (AttendanceRecord, error)
  - [ ] CheckOut(employeeID, note) (AttendanceRecord, error)
  - [ ] GetCurrentStatus(employeeID) (AttendanceRecord, error)
  - [ ] GetRecords(employeeID, year, month) ([]AttendanceRecord, error)
  - [ ] Write unit tests

#### 3.7 Middleware
- [ ] Create `pkg/middleware/middleware.go`
  - [ ] JWTAuthMiddleware() - Token validation
  - [ ] CORSMiddleware() - CORS headers
  - [ ] RateLimitMiddleware() - Rate limiting
  - [ ] SecurityHeadersMiddleware() - Security headers
  - [ ] LoggingMiddleware() - Request logging

#### 3.8 Handlers (HTTP Layer)
- [ ] Create `pkg/handlers/handler.go` (base handler with validator)
- [ ] Create `pkg/handlers/auth.go`
  - [ ] POST /auth/login - Login handler
  - [ ] POST /auth/refresh - Refresh token handler
- [ ] Create `pkg/handlers/attendance.go`
  - [ ] POST /attendance/check-in - Check-in handler
  - [ ] POST /attendance/check-out - Check-out handler
  - [ ] GET /attendance/status - Current status handler
  - [ ] GET /attendance/records - List records handler
- [ ] Write integration tests for handlers

#### 3.9 Router Setup
- [ ] Create `router/router.go`
- [ ] Setup Iris app with versioning
- [ ] Register middleware
- [ ] Register public routes (auth)
- [ ] Register protected routes (attendance)
- [ ] Add health check endpoint

#### 3.10 Main Application
- [ ] Complete `cmd/main.go`
  - [ ] Initialize database connection
  - [ ] Initialize logger
  - [ ] Setup router
  - [ ] Start HTTP server
  - [ ] Graceful shutdown handling
- [ ] Test backend locally: `go run cmd/main.go`

#### 3.11 Docker Setup for Backend
- [ ] Create `Dockerfile` for backend
- [ ] Create `docker-entrypoint.sh` script
- [ ] Make entrypoint script executable
- [ ] Test Docker build: `docker build -t clock-backend .`

---

### 4. Frontend Development

#### 4.1 Project Setup
- [ ] Configure Next.js `next.config.js` if needed
- [ ] Setup Material-UI theme in `src/app/layout.tsx`
- [ ] Create `globals.css` with base styles

#### 4.2 Types
- [ ] Create `src/types/auth.ts`
  - [ ] Employee interface
  - [ ] LoginRequest interface
  - [ ] LoginResponse interface
  - [ ] AuthContextType interface
- [ ] Create `src/types/attendance.ts`
  - [ ] AttendanceRecord interface
  - [ ] AttendanceStatus interface
  - [ ] CheckInRequest interface
  - [ ] CheckOutRequest interface

#### 4.3 API Service
- [ ] Create `src/services/api.ts`
  - [ ] Create Axios instance with base URL
  - [ ] Add request interceptor (attach JWT token)
  - [ ] Add response interceptor (handle 401, refresh token)
- [ ] Create `src/services/authService.ts`
  - [ ] login(username, password)
  - [ ] refreshToken()
  - [ ] logout()
- [ ] Create `src/services/attendanceService.ts`
  - [ ] checkIn(note?)
  - [ ] checkOut(note?)
  - [ ] getCurrentStatus()
  - [ ] getRecords(year?, month?)

#### 4.4 Context
- [ ] Create `src/context/AuthContext.tsx`
  - [ ] AuthProvider component
  - [ ] useAuth hook
  - [ ] Store user and token state
  - [ ] Implement login, logout functions
  - [ ] Load user from localStorage on mount

#### 4.5 Utilities
- [ ] Create `src/utils/dateUtils.ts`
  - [ ] formatDate()
  - [ ] formatTime()
  - [ ] calculateDuration()
  - [ ] formatDuration()
- [ ] Create `src/utils/tokenUtils.ts`
  - [ ] saveToken()
  - [ ] getToken()
  - [ ] removeToken()
  - [ ] isTokenExpired()

#### 4.6 Shared Components
- [ ] Create `src/components/shared/Loading.tsx`
- [ ] Create `src/components/shared/ErrorMessage.tsx`

#### 4.7 Layout Components
- [ ] Create `src/components/layout/Header.tsx`
  - [ ] Show user name
  - [ ] Logout button
  - [ ] Material-UI AppBar
- [ ] Create `src/app/(dashboard)/layout.tsx`
  - [ ] Use Header component
  - [ ] Add basic layout structure

#### 4.8 Auth Components
- [ ] Create `src/components/auth/LoginForm.tsx`
  - [ ] Formik form with username and password
  - [ ] Yup validation schema
  - [ ] Material-UI TextField, Button
  - [ ] Error display
  - [ ] Loading state
- [ ] Create `src/app/(auth)/login/page.tsx`
  - [ ] Use LoginForm component
  - [ ] Redirect if already authenticated

#### 4.9 Attendance Components
- [ ] Create `src/components/attendance/AttendanceStatus.tsx`
  - [ ] Display current status (checked in/out)
  - [ ] Show check-in time if active
- [ ] Create `src/components/attendance/CheckInButton.tsx`
  - [ ] Material-UI Button
  - [ ] Call checkIn API
  - [ ] Handle success/error
  - [ ] Disabled state based on status
- [ ] Create `src/components/attendance/CheckOutButton.tsx`
  - [ ] Material-UI Button
  - [ ] Call checkOut API
  - [ ] Handle success/error
  - [ ] Disabled state based on status
- [ ] Create `src/components/attendance/MonthSelector.tsx`
  - [ ] Material-UI DatePicker (month view)
  - [ ] Emit selected month to parent
- [ ] Create `src/components/attendance/AttendanceTable.tsx`
  - [ ] Material-UI Table or DataGrid
  - [ ] Columns: Date, Check-In, Check-Out, Duration
  - [ ] Format timestamps
  - [ ] Calculate duration
  - [ ] Handle empty state

#### 4.10 Attendance Page
- [ ] Create `src/app/(dashboard)/attendance/page.tsx`
  - [ ] Fetch current status on mount
  - [ ] Render AttendanceStatus
  - [ ] Render CheckInButton and CheckOutButton
  - [ ] Render MonthSelector
  - [ ] Render AttendanceTable
  - [ ] Handle month change
  - [ ] Auto-refresh status every 30 seconds
  - [ ] Handle loading and error states

#### 4.11 Root Pages
- [ ] Create `src/app/page.tsx`
  - [ ] Redirect to /attendance if authenticated
  - [ ] Redirect to /login if not authenticated
- [ ] Update `src/app/layout.tsx`
  - [ ] Wrap app with AuthProvider
  - [ ] Setup Material-UI ThemeProvider

#### 4.12 Route Protection
- [ ] Add authentication check in dashboard layout
- [ ] Redirect to login if not authenticated
- [ ] Prevent access to login page if authenticated

#### 4.13 Docker Setup for Frontend
- [ ] Create `Dockerfile` for frontend (production)
- [ ] Create `Dockerfile.dev` for development (optional)
- [ ] Test Docker build: `docker build -t clock-frontend .`

---

### 5. Integration & Docker Compose

#### 5.1 Development Environment
- [ ] Update `docker-compose.yml` with all three services
  - [ ] postgres
  - [ ] backend (depends on postgres)
  - [ ] frontend (depends on backend)
- [ ] Create network configuration
- [ ] Configure environment variables
- [ ] Test full stack: `docker-compose up -d`
- [ ] Verify all services are running: `docker-compose ps`

#### 5.2 Staging Environment
- [ ] Create `docker-compose.staging.yml`
- [ ] Add all services with staging configuration
- [ ] Create Nginx service
- [ ] Create `nginx/nginx.staging.conf`
- [ ] Test staging setup locally

#### 5.3 Build Scripts
- [ ] Make `scripts/deploy.sh` executable
- [ ] Test deploy script locally
- [ ] Create `scripts/rollback.sh` (optional)

---

### 6. Testing

#### 6.1 Backend Tests
- [ ] Run unit tests: `go test ./pkg/...`
- [ ] Fix any failing tests
- [ ] Aim for >70% code coverage

#### 6.2 Frontend Tests
- [ ] Setup React Testing Library
- [ ] Write component tests for:
  - [ ] LoginForm
  - [ ] CheckInButton
  - [ ] CheckOutButton
  - [ ] AttendanceTable
- [ ] Run tests: `yarn test`

#### 6.3 Integration Tests
- [ ] Test login flow end-to-end
- [ ] Test check-in flow
- [ ] Test check-out flow
- [ ] Test month selection and filtering
- [ ] Test token refresh
- [ ] Test logout

#### 6.4 Manual Testing Checklist
- [ ] User can log in with valid credentials
- [ ] User cannot log in with invalid credentials
- [ ] User can check in successfully
- [ ] User cannot check in twice (button disabled)
- [ ] User can check out after checking in
- [ ] User cannot check out without checking in (button disabled)
- [ ] User can view attendance records for current month
- [ ] User can switch month and view historical records
- [ ] User can log out successfully
- [ ] Token refresh works automatically
- [ ] Expired token returns 401 and triggers refresh
- [ ] Page refresh maintains login state

---

### 7. Documentation

#### 7.1 Code Documentation
- [ ] Add comments to complex functions
- [ ] Add package documentation (Go)
- [ ] Add JSDoc comments for TypeScript functions

#### 7.2 API Documentation
- [ ] Consider adding Swagger/OpenAPI spec (optional)
- [ ] Update README with API endpoints

#### 7.3 Deployment Documentation
- [ ] Document staging deployment process
- [ ] Document production deployment process
- [ ] Create troubleshooting guide

---

### 8. Deployment

#### 8.1 Staging Deployment
- [ ] Push code to git repository
- [ ] SSH to staging server
- [ ] Clone repository
- [ ] Create `.env` files with production values
- [ ] Run deployment script: `./scripts/deploy.sh staging`
- [ ] Verify deployment successful
- [ ] Test all features in staging

#### 8.2 Production Deployment
- [ ] Create production server
- [ ] Configure DNS (if needed)
- [ ] Setup SSL certificates (Let's Encrypt)
- [ ] Create `.env.production` with secure values
- [ ] Deploy: `./scripts/deploy.sh production`
- [ ] Monitor logs for errors
- [ ] Verify production is accessible
- [ ] Perform smoke tests

---

## Phase 2: Admin Features (Future)

### 9. Admin Dashboard

#### 9.1 Backend
- [ ] Create admin middleware (role check)
- [ ] Create admin handlers
  - [ ] GET /admin/employees - List all employees
  - [ ] POST /admin/employees - Create employee
  - [ ] PUT /admin/employees/:id - Update employee
  - [ ] DELETE /admin/employees/:id - Soft delete employee
  - [ ] GET /admin/attendance/records - View all records
  - [ ] GET /admin/reports/monthly - Monthly summary
- [ ] Create admin services

#### 9.2 Frontend
- [ ] Create admin layout
- [ ] Create employee management pages
- [ ] Create attendance records management
- [ ] Create reports page
- [ ] Add export functionality (CSV/Excel)

---

## Progress Tracking

**Phase 1 Status:** Planning Complete ✅
**Current Step:** Ready to begin implementation

**Completed:**
- [x] Project planning and documentation
- [x] Architecture design
- [x] Database schema design
- [x] API design
- [x] Docker configuration planning
- [x] Security considerations
- [x] Migration file creation

**Next Steps:**
1. Initialize backend project structure
2. Initialize frontend project structure
3. Setup local development database
4. Begin backend implementation

---

## Notes

- Focus on completing Phase 1 MVP before moving to Phase 2
- Test each component thoroughly before moving to the next
- Keep commits small and focused
- Write tests as you go, not after
- Document any deviations from the plan
- Update this checklist as you progress

---

**Last Updated:** 2026-01-05
**Version:** 1.0.0
