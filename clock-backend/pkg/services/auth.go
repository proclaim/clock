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
		WHERE username = $1 AND deleted_at IS NULL
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
	// Validate new password
	if len(newPassword) < 6 {
		return customErrors.ErrPasswordTooShort
	}

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
