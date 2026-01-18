package services

import (
	"database/sql"

	"go.uber.org/zap"

	"github.com/jim/clock-backend/config"
	"github.com/jim/clock-backend/pkg/database"
	customErrors "github.com/jim/clock-backend/pkg/errors"
	"github.com/jim/clock-backend/pkg/models"
	"github.com/jim/clock-backend/pkg/utils"
)

type AuthService struct {
	db     *database.Database
	cfg    *config.Config
	logger *zap.Logger
}

func NewAuthService(db *database.Database, cfg *config.Config, logger *zap.Logger) *AuthService {
	return &AuthService{
		db:     db,
		cfg:    cfg,
		logger: logger,
	}
}

// Login authenticates a user and returns the employee and tokens
func (s *AuthService) Login(username, password string) (*models.Employee, string, string, error) {
	// Get employee by username
	var employee models.Employee
	query := `
		SELECT id, username, name, email, phone, password_hash, role, is_active,
		       created_at, updated_at, deleted_at
		FROM employees
		WHERE LOWER(username) = LOWER($1) AND deleted_at IS NULL
	`

	err := s.db.Get(&employee, query, username)
	if err == sql.ErrNoRows {
		s.logger.Warn("Login failed: user not found", zap.String("username", username))
		return nil, "", "", customErrors.ErrInvalidCredentials
	}
	if err != nil {
		s.logger.Error("Database error during login", zap.Error(err))
		return nil, "", "", err
	}

	// Check if employee is active
	if !employee.IsActive {
		s.logger.Warn("Login failed: employee not active", zap.String("username", username))
		return nil, "", "", customErrors.ErrEmployeeNotActive
	}

	// Compare passwords
	if err := utils.ComparePassword(employee.PasswordHash, password); err != nil {
		s.logger.Warn("Login failed: invalid password", zap.String("username", username))
		return nil, "", "", customErrors.ErrInvalidCredentials
	}

	// Generate tokens
	accessToken, err := utils.GenerateAccessToken(&employee, &s.cfg.JWT)
	if err != nil {
		s.logger.Error("Failed to generate access token", zap.Error(err))
		return nil, "", "", err
	}

	refreshToken, err := utils.GenerateRefreshToken(&employee, &s.cfg.JWT)
	if err != nil {
		s.logger.Error("Failed to generate refresh token", zap.Error(err))
		return nil, "", "", err
	}

	s.logger.Info("User logged in successfully", zap.String("username", username))

	return &employee, accessToken, refreshToken, nil
}

// RefreshToken generates new access and refresh tokens using a refresh token
func (s *AuthService) RefreshToken(refreshToken string) (string, string, error) {
	// Validate refresh token
	claims, err := utils.ValidateRefreshToken(refreshToken, &s.cfg.JWT)
	if err != nil {
		s.logger.Warn("Invalid refresh token", zap.Error(err))
		return "", "", customErrors.ErrInvalidToken
	}

	// Get employee by ID
	employee, err := s.GetEmployeeByID(claims.EmployeeID)
	if err != nil {
		return "", "", err
	}

	// Check if employee is still active
	if !employee.IsActive {
		return "", "", customErrors.ErrEmployeeNotActive
	}

	// Generate new tokens
	newAccessToken, err := utils.GenerateAccessToken(employee, &s.cfg.JWT)
	if err != nil {
		s.logger.Error("Failed to generate access token", zap.Error(err))
		return "", "", err
	}

	newRefreshToken, err := utils.GenerateRefreshToken(employee, &s.cfg.JWT)
	if err != nil {
		s.logger.Error("Failed to generate refresh token", zap.Error(err))
		return "", "", err
	}

	s.logger.Info("Token refreshed successfully", zap.Int("employee_id", employee.ID))

	return newAccessToken, newRefreshToken, nil
}

// GetEmployeeByID retrieves an employee by ID
func (s *AuthService) GetEmployeeByID(id int) (*models.Employee, error) {
	var employee models.Employee
	query := `
		SELECT id, username, name, email, phone, password_hash, role, is_active,
		       created_at, updated_at, deleted_at
		FROM employees
		WHERE id = $1 AND deleted_at IS NULL
	`

	err := s.db.Get(&employee, query, id)
	if err == sql.ErrNoRows {
		return nil, customErrors.ErrEmployeeNotFound
	}
	if err != nil {
		s.logger.Error("Database error getting employee", zap.Error(err), zap.Int("id", id))
		return nil, err
	}

	return &employee, nil
}

// ChangePassword changes an employee's password
func (s *AuthService) ChangePassword(employeeID int, currentPassword, newPassword string) error {
	// Get employee
	employee, err := s.GetEmployeeByID(employeeID)
	if err != nil {
		return err
	}

	// Verify current password
	if err := utils.ComparePassword(employee.PasswordHash, currentPassword); err != nil {
		s.logger.Warn("Password change failed: invalid current password", zap.Int("employee_id", employeeID))
		return customErrors.ErrInvalidPassword
	}

	// Hash new password
	newHash, err := utils.HashPassword(newPassword)
	if err != nil {
		s.logger.Error("Failed to hash new password", zap.Error(err))
		return err
	}

	// Update password in database
	query := `
		UPDATE employees
		SET password_hash = $1, updated_at = NOW()
		WHERE id = $2 AND deleted_at IS NULL
	`

	_, err = s.db.Exec(query, newHash, employeeID)
	if err != nil {
		s.logger.Error("Database error changing password", zap.Error(err), zap.Int("employee_id", employeeID))
		return err
	}

	s.logger.Info("Password changed successfully", zap.Int("employee_id", employeeID))

	return nil
}

// ResetPassword resets an employee's password (admin function, no current password required)
func (s *AuthService) ResetPassword(employeeID int, newPassword string) error {
	// Get employee to ensure they exist
	_, err := s.GetEmployeeByID(employeeID)
	if err != nil {
		return err
	}

	// Hash new password
	newHash, err := utils.HashPassword(newPassword)
	if err != nil {
		s.logger.Error("Failed to hash new password", zap.Error(err))
		return err
	}

	// Update password in database
	query := `
		UPDATE employees
		SET password_hash = $1, updated_at = NOW()
		WHERE id = $2 AND deleted_at IS NULL
	`

	_, err = s.db.Exec(query, newHash, employeeID)
	if err != nil {
		s.logger.Error("Database error resetting password", zap.Error(err), zap.Int("employee_id", employeeID))
		return err
	}

	s.logger.Info("Password reset successfully by admin", zap.Int("target_employee_id", employeeID))

	return nil
}

// CreateEmployee creates a new employee
func (s *AuthService) CreateEmployee(username, name, password string, role models.EmployeeRole) (*models.Employee, error) {
	// Hash password
	hash, err := utils.HashPassword(password)
	if err != nil {
		s.logger.Error("Failed to hash password", zap.Error(err))
		return nil, err
	}

	// Check if username already exists (case-insensitive)
	var count int
	checkQuery := `SELECT count(*) FROM employees WHERE LOWER(username) = LOWER($1) AND deleted_at IS NULL`
	err = s.db.Get(&count, checkQuery, username)
	if err != nil {
		s.logger.Error("Database error checking username", zap.Error(err))
		return nil, err
	}
	if count > 0 {
		return nil, customErrors.ErrUsernameTaken
	}

	// Create employee
	query := `
		INSERT INTO employees (username, name, password_hash, role, is_active)
		VALUES ($1, $2, $3, $4, true)
		RETURNING id, username, name, email, phone, role, is_active, created_at, updated_at
	`

	var employee models.Employee
	// Using QueryRow as sqlx Get/Select usually works for SELECT statements, but RETURNING works too with Get/StructScan depending on driver.
	// However, basic QueryRow and Scan is safest here without testing sqlx specifics on INSERT RETURNING.
	// Actually, sqlx Get usually works for INSERT RETURNING in Postgres. But let's stick to standard database/sql Scan for safety or sqlx.Get if confident.
	// db.QueryRowx is part of sqlx.
	err = s.db.QueryRowx(query, username, name, hash, role).StructScan(&employee)

	if err != nil {
		s.logger.Error("Database error creating employee", zap.Error(err))
		return nil, err
	}

	s.logger.Info("Employee created successfully", zap.String("username", username))

	return &employee, nil
}

// UpdateEmployeeStatus updates an employee's active status
func (s *AuthService) UpdateEmployeeStatus(id int, isActive bool) error {
	query := `
		UPDATE employees
		SET is_active = $1, updated_at = NOW()
		WHERE id = $2 AND deleted_at IS NULL
	`

	result, err := s.db.Exec(query, isActive, id)
	if err != nil {
		s.logger.Error("Database error updating employee status", zap.Error(err), zap.Int("employee_id", id))
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return customErrors.ErrEmployeeNotFound
	}

	s.logger.Info("Employee status updated", zap.Int("employee_id", id), zap.Bool("is_active", isActive))

	return nil
}
