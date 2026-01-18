package services

import (
	"database/sql"
	"fmt"
	"strings"
	"time"

	"go.uber.org/zap"

	"github.com/jim/clock-backend/config"
	"github.com/jim/clock-backend/pkg/database"
	customErrors "github.com/jim/clock-backend/pkg/errors"
	"github.com/jim/clock-backend/pkg/models"
)

type AdminLeaveService struct {
	db     *database.Database
	cfg    *config.Config
	logger *zap.Logger
}

func NewAdminLeaveService(db *database.Database, cfg *config.Config, logger *zap.Logger) *AdminLeaveService {
	return &AdminLeaveService{
		db:     db,
		cfg:    cfg,
		logger: logger,
	}
}

// GetAllLeaves retrieves all leave records with employee info (admin only)
func (s *AdminLeaveService) GetAllLeaves(
	startDate, endDate *time.Time,
	employeeID *int,
	limit, offset int,
) ([]*models.LeaveWithEmployee, int, error) {

	// Build count query
	countQuery := `
		SELECT COUNT(*)
		FROM leaves l
		INNER JOIN employees e ON l.employee_id = e.id
		WHERE l.deleted_at IS NULL AND e.deleted_at IS NULL
	`

	// Build main query
	query := `
		SELECT
			l.id, l.employee_id, l.start_date, l.end_date, l.note,
			l.created_at, l.updated_at,
			e.name as employee_name, e.username as employee_username
		FROM leaves l
		INNER JOIN employees e ON l.employee_id = e.id
		WHERE l.deleted_at IS NULL AND e.deleted_at IS NULL
	`

	args := []any{}
	argCount := 0

	// Add filters
	if startDate != nil {
		argCount++
		filter := fmt.Sprintf(" AND l.start_date >= $%d", argCount)
		query += filter
		countQuery += filter
		args = append(args, startDate)
	}

	if endDate != nil {
		argCount++
		filter := fmt.Sprintf(" AND l.end_date <= $%d", argCount)
		query += filter
		countQuery += filter
		args = append(args, endDate)
	}

	if employeeID != nil {
		argCount++
		filter := fmt.Sprintf(" AND l.employee_id = $%d", argCount)
		query += filter
		countQuery += filter
		args = append(args, employeeID)
	}

	// Get total count
	var total int
	err := s.db.Get(&total, countQuery, args...)
	if err != nil {
		s.logger.Error("Failed to count leave records", zap.Error(err))
		return nil, 0, err
	}

	// Add ordering and pagination
	query += " ORDER BY l.start_date DESC"

	if limit > 0 {
		argCount++
		query += fmt.Sprintf(" LIMIT $%d", argCount)
		args = append(args, limit)
	}

	if offset > 0 {
		argCount++
		query += fmt.Sprintf(" OFFSET $%d", argCount)
		args = append(args, offset)
	}

	var leaves []*models.LeaveWithEmployee
	err = s.db.Select(&leaves, query, args...)
	if err != nil {
		s.logger.Error("Failed to get leave records", zap.Error(err))
		return nil, 0, err
	}

	return leaves, total, nil
}

// UpdateLeave updates an existing leave record (admin only)
func (s *AdminLeaveService) UpdateLeave(
	leaveID int,
	startDate, endDate *time.Time,
	note *string,
	adminID int,
) (*models.Leave, error) {

	// First, get the current leave to check for overlap validation
	var currentLeave models.Leave
	getQuery := `
		SELECT id, employee_id, start_date, end_date, note, created_at, updated_at, deleted_at
		FROM leaves WHERE id = $1 AND deleted_at IS NULL
	`
	err := s.db.Get(&currentLeave, getQuery, leaveID)
	if err == sql.ErrNoRows {
		return nil, customErrors.ErrRecordNotFound
	}
	if err != nil {
		return nil, err
	}

	// Determine the final dates for overlap check
	finalStartDate := currentLeave.StartDate
	finalEndDate := currentLeave.EndDate
	if startDate != nil {
		finalStartDate = *startDate
	}
	if endDate != nil {
		finalEndDate = *endDate
	}

	// Validate date range
	if finalEndDate.Before(finalStartDate) {
		return nil, customErrors.ErrInvalidDateRange
	}

	// Check for overlapping leaves (excluding current record)
	hasOverlap, err := s.checkOverlappingLeave(currentLeave.EmployeeID, finalStartDate, finalEndDate, &leaveID)
	if err != nil {
		return nil, err
	}
	if hasOverlap {
		return nil, customErrors.ErrLeaveOverlap
	}

	// Build dynamic update query
	updates := []string{"updated_at = NOW()"}
	args := []any{}
	argCount := 0

	if startDate != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("start_date = $%d", argCount))
		args = append(args, startDate)
	}

	if endDate != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("end_date = $%d", argCount))
		args = append(args, endDate)
	}

	if note != nil {
		argCount++
		if *note == "" {
			updates = append(updates, "note = NULL")
		} else {
			updates = append(updates, fmt.Sprintf("note = $%d", argCount))
			args = append(args, *note)
		}
	}

	// Add leave ID to args
	argCount++
	args = append(args, leaveID)

	query := fmt.Sprintf(`
		UPDATE leaves
		SET %s
		WHERE id = $%d AND deleted_at IS NULL
		RETURNING id, employee_id, start_date, end_date, note, created_at, updated_at, deleted_at
	`, strings.Join(updates, ", "), argCount)

	var leave models.Leave
	err = s.db.QueryRowx(query, args...).StructScan(&leave)
	if err == sql.ErrNoRows {
		return nil, customErrors.ErrRecordNotFound
	}
	if err != nil {
		s.logger.Error("Failed to update leave record", zap.Error(err), zap.Int("leave_id", leaveID))
		return nil, err
	}

	s.logger.Info("Admin updated leave record",
		zap.Int("leave_id", leaveID),
		zap.Int("admin_id", adminID))

	return &leave, nil
}

// DeleteLeave soft deletes a leave record (admin only)
func (s *AdminLeaveService) DeleteLeave(leaveID, adminID int) error {
	query := `
		UPDATE leaves
		SET deleted_at = NOW(), updated_at = NOW()
		WHERE id = $1 AND deleted_at IS NULL
	`

	result, err := s.db.Exec(query, leaveID)
	if err != nil {
		s.logger.Error("Failed to delete leave record", zap.Error(err), zap.Int("leave_id", leaveID))
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return customErrors.ErrRecordNotFound
	}

	s.logger.Info("Admin deleted leave record",
		zap.Int("leave_id", leaveID),
		zap.Int("admin_id", adminID))

	return nil
}

// checkOverlappingLeave checks if there's an overlapping leave for the employee
func (s *AdminLeaveService) checkOverlappingLeave(employeeID int, startDate, endDate time.Time, excludeLeaveID *int) (bool, error) {
	query := `
		SELECT COUNT(*) FROM leaves
		WHERE employee_id = $1
		  AND deleted_at IS NULL
		  AND start_date <= $2
		  AND end_date >= $3
	`
	args := []any{employeeID, endDate, startDate}

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
