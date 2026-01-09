# Changelog: Remove All john.* Accounts and Fix CORS

## Date: 2026-01-09

## Changes Made

### 1. Database - john.* Account Removal

#### Local Database ✅
- **Status**: Completed
- Removed all john.* accounts (john.doe) and associated attendance records from local database
- Verified remaining accounts: admin and jane.smith

#### Production Database ⚠️
- **Status**: Requires Action
- Migration file created: `migrations/20260109000001-remove-john-doe.sql`
  - Uses pattern matching `LIKE 'john%'` to remove ALL john.* accounts
- Script created: `scripts/remove-john-doe-production.sh`
  - Removes ALL accounts with username starting with "john"
- **Action Required**: Run the script on production server:
  ```bash
  ./scripts/remove-john-doe-production.sh
  ```

### 2. UI Changes ✅

#### Frontend - Login Form
- **File**: `clock-frontend/components/auth/LoginForm.tsx`
- Removed all john.* credentials from the demo accounts display
- Now shows only:
  - admin / admin123
  - jane.smith / staff123

### 3. CORS Configuration Fix ✅

#### Backend Changes
Updated to support production URL `http://time.tcode.tw`:

1. **Config Structure** (`clock-backend/config/config.go`)
   - Added `FrontendURL` field to `ServerConfig`
   - Reads from `FRONTEND_URL` environment variable
   - Default: `http://localhost:3000`

2. **CORS Middleware** (`clock-backend/pkg/middleware/middleware.go`)
   - Updated `SetupCORS()` to accept config parameter
   - Dynamically adds configured frontend URL to allowed origins
   - Supports both development and production URLs

3. **Router** (`clock-backend/router/router.go`)
   - Updated to pass config to `SetupCORS()`

4. **Environment Variables**
   - Added `FRONTEND_URL=http://localhost:3000` to `.env`
   - Production already configured in `docker-compose.prod.yml` with `FRONTEND_URL=http://time.tcode.tw`

#### How CORS Now Works
The backend will automatically allow requests from:
- `http://localhost:3000` (development)
- `http://127.0.0.1:3000` (development)
- `http://localhost:8002` (development)
- `http://192.168.0.77:8002` (LAN access)
- **`http://time.tcode.tw` (production)** ← This fixes the CORS error!

### 4. Documentation Updates ✅

- Updated `clock-backend/README.md`:
  - Removed john.doe from test credentials
  - Added `FRONTEND_URL` to environment variables section

## Production Deployment Steps

### Step 1: Remove All john.* from Production Database
```bash
# On production server, run:
./scripts/remove-john-doe-production.sh

# Or manually via docker:
docker exec -i clock_postgres_prod psql -U clock_user -d clock <<EOF
DELETE FROM attendance_records WHERE employee_id IN (SELECT id FROM employees WHERE username LIKE 'john%');
DELETE FROM employees WHERE username LIKE 'john%';
EOF
```

### Step 2: Deploy Updated Code
```bash
# Build and deploy new backend image with CORS fix
docker-compose -f docker-compose.prod.yml build clock_backend_prod
docker-compose -f docker-compose.prod.yml build clock_frontend_prod

# Restart services
docker-compose -f docker-compose.prod.yml up -d
```

### Step 3: Verify
1. Check that all john.* accounts are removed:
   ```bash
   docker exec clock_postgres_prod psql -U clock_user -d clock -c "SELECT username, name FROM employees WHERE username LIKE 'john%';"
   # Should return 0 rows

   docker exec clock_postgres_prod psql -U clock_user -d clock -c "SELECT username, name FROM employees;"
   # Should show only admin and jane.smith
   ```

2. Test CORS by accessing `http://time.tcode.tw` and checking:
   - Login works without CORS errors in browser console
   - API calls succeed

## Files Changed

### Modified Files
- `clock-frontend/components/auth/LoginForm.tsx` - Removed john.doe from UI
- `clock-backend/config/config.go` - Added FrontendURL config
- `clock-backend/pkg/middleware/middleware.go` - Updated CORS to use config
- `clock-backend/router/router.go` - Pass config to CORS setup
- `clock-backend/.env` - Added FRONTEND_URL variable
- `clock-backend/README.md` - Updated documentation

### New Files
- `migrations/20260109000001-remove-john-doe.sql` - Migration to remove john.doe
- `clock-backend/migrations/20260109000001-remove-john-doe.sql` - Same migration for backend dir
- `scripts/remove-john-doe-production.sh` - Production cleanup script
- `CHANGELOG_john-removal.md` - This file

## Summary

✅ **Local Changes**: All complete
- All john.* accounts removed from local database (found and removed: john.doe)
- All john.* credentials removed from UI
- CORS fixed to support production URL (http://time.tcode.tw)
- Backend compiled successfully

⚠️ **Production Changes Required**:
1. Run `scripts/remove-john-doe-production.sh` to remove ALL john.* accounts
2. Rebuild and redeploy services to apply CORS fix

The CORS error in production will be resolved once the updated backend is deployed, as it will now allow requests from `http://time.tcode.tw`.

## Notes
- Migration and script use pattern matching `LIKE 'john%'` to catch all john.* accounts
- Only john.doe was found in the local database and codebase
- The pattern matching approach ensures any other john.* accounts in production will also be removed
