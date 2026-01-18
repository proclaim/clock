package services

import (
	"database/sql"
	"fmt"
	"time"

	"go.uber.org/zap"

	"github.com/jim/clock-backend/config"
	"github.com/jim/clock-backend/pkg/database"
	customErrors "github.com/jim/clock-backend/pkg/errors"
	"github.com/jim/clock-backend/pkg/models"
)

type LeaveService struct {
	db     *database.Database
	cfg    *config.Config
	logger *zap.Logger
}

func NewLeaveService(db *database.Database, cfg *config.Config, logger *zap.Logger) *LeaveService {
	return &LeaveService{
		db:     db,
		cfg:    cfg,
		logger: logger,
	}
}

// CreateLeave creates a new leave record
func (s *LeaveService) CreateLeave(employeeID int, startDate, endDate time.Time, note string) (*models.Leave, error) {
	// Validate date range
	if endDate.Before(startDate) {
		return nil, customErrors.ErrInvalidDateRange
	}

	// Check for overlapping leaves
	hasOverlap, err := s.checkOverlappingLeave(employeeID, startDate, endDate, nil)
	if err != nil {
		return nil, err
	}
	if hasOverlap {
		return nil, customErrors.ErrLeaveOverlap
	}

	var noteValue sql.NullString
	if note != "" {
		noteValue = sql.NullString{String: note, Valid: true}
	}

	query := `
		INSERT INTO leaves (employee_id, start_date, end_date, note, created_at, updated_at)
		VALUES ($1, $2, $3, $4, NOW(), NOW())
		RETURNING id, employee_id, start_date, end_date, note, created_at, updated_at, deleted_at
	`

	var leave models.Leave
	err = s.db.QueryRowx(query, employeeID, startDate, endDate, noteValue).StructScan(&leave)
	if err != nil {
		s.logger.Error("Failed to create leave record", zap.Error(err), zap.Int("employee_id", employeeID))
		return nil, err
	}

	s.logger.Info("Leave created successfully",
		zap.Int("employee_id", employeeID),
		zap.Int("leave_id", leave.ID))

	return &leave, nil
}

// GetLeaves retrieves leave records for an employee with optional filters
func (s *LeaveService) GetLeaves(employeeID int, year, month *int) ([]*models.Leave, error) {
	query := `
		SELECT id, employee_id, start_date, end_date, note, created_at, updated_at, deleted_at
		FROM leaves
		WHERE employee_id = $1 AND deleted_at IS NULL
	`
	args := []interface{}{employeeID}
	argCount := 1

	if year != nil && month != nil {
		startOfMonth := time.Date(*year, time.Month(*month), 1, 0, 0, 0, 0, time.UTC)
		endOfMonth := startOfMonth.AddDate(0, 1, 0).Add(-24 * time.Hour)

		// Find leaves that overlap with the month
		argCount++
		query += fmt.Sprintf(" AND start_date <= $%d", argCount)
		args = append(args, endOfMonth)

		argCount++
		query += fmt.Sprintf(" AND end_date >= $%d", argCount)
		args = append(args, startOfMonth)
	}

	query += " ORDER BY start_date DESC"

	var leaves []*models.Leave
	err := s.db.Select(&leaves, query, args...)
	if err != nil {
		s.logger.Error("Failed to get leave records", zap.Error(err), zap.Int("employee_id", employeeID))
		return nil, err
	}

	return leaves, nil
}

// GetLeaveByID retrieves a specific leave record
func (s *LeaveService) GetLeaveByID(leaveID, employeeID int) (*models.Leave, error) {
	query := `
		SELECT id, employee_id, start_date, end_date, note, created_at, updated_at, deleted_at
		FROM leaves
		WHERE id = $1 AND employee_id = $2 AND deleted_at IS NULL
	`

	var leave models.Leave
	err := s.db.Get(&leave, query, leaveID, employeeID)
	if err == sql.ErrNoRows {
		return nil, customErrors.ErrRecordNotFound
	}
	if err != nil {
		return nil, err
	}

	return &leave, nil
}

// checkOverlappingLeave checks if there's an overlapping leave for the employee
func (s *LeaveService) checkOverlappingLeave(employeeID int, startDate, endDate time.Time, excludeLeaveID *int) (bool, error) {
	query := `
		SELECT COUNT(*) FROM leaves
		WHERE employee_id = $1
		  AND deleted_at IS NULL
		  AND start_date <= $2
		  AND end_date >= $3
	`
	args := []interface{}{employeeID, endDate, startDate}

	if excludeLeaveID != nil {
		query += " AND id != $4"
		args = append(args, *excludeLeaveID)
	}

	var count int
	err := s.db.Get(&count, query, args...)
	if err != nil {
		return false, err
	}

	return count > 0, nil
}
