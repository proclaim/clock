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

type AdminAttendanceService struct {
	db     *database.Database
	cfg    *config.Config
	logger *zap.Logger
}

func NewAdminAttendanceService(db *database.Database, cfg *config.Config, logger *zap.Logger) *AdminAttendanceService {
	return &AdminAttendanceService{
		db:     db,
		cfg:    cfg,
		logger: logger,
	}
}

// GetAllEmployeesAttendanceSummary retrieves attendance summary for all employees
// with optional filtering by date range and employee
func (s *AdminAttendanceService) GetAllEmployeesAttendanceSummary(
	startDate, endDate *time.Time,
	employeeID *int,
) ([]*models.EmployeeAttendanceSummary, error) {

	query := `
		SELECT
			e.id as employee_id,
			e.name as employee_name,
			e.username,
			COALESCE(COUNT(ar.id), 0) as total_records,
			COALESCE(SUM(
				CASE
					WHEN ar.check_out_time IS NOT NULL
					THEN EXTRACT(EPOCH FROM (DATE_TRUNC('minute', ar.check_out_time) - DATE_TRUNC('minute', ar.check_in_time))) / 60
					ELSE 0
				END
			), 0) as total_minutes
		FROM employees e
		LEFT JOIN attendance_records ar ON e.id = ar.employee_id AND ar.deleted_at IS NULL
		WHERE e.deleted_at IS NULL AND e.is_active = true
	`

	args := []interface{}{}
	argCount := 0

	// Add date range filter
	if startDate != nil {
		argCount++
		query += fmt.Sprintf(" AND ar.check_in_time >= $%d", argCount)
		args = append(args, startDate)
	}

	if endDate != nil {
		argCount++
		query += fmt.Sprintf(" AND ar.check_in_time < $%d", argCount)
		args = append(args, endDate)
	}

	// Add employee filter
	if employeeID != nil {
		argCount++
		query += fmt.Sprintf(" AND e.id = $%d", argCount)
		args = append(args, employeeID)
	}

	query += `
		GROUP BY e.id, e.name, e.username
		ORDER BY e.name ASC
	`

	var summaries []*models.EmployeeAttendanceSummary
	err := s.db.Select(&summaries, query, args...)
	if err != nil {
		s.logger.Error("Failed to get employee attendance summaries", zap.Error(err))
		return nil, err
	}

	return summaries, nil
}

// GetAllAttendanceRecords retrieves all attendance records with employee info
func (s *AdminAttendanceService) GetAllAttendanceRecords(
	startDate, endDate *time.Time,
	employeeID *int,
	limit, offset int,
) ([]*models.AttendanceRecordWithEmployee, int, error) {

	// Build count query
	countQuery := `
		SELECT COUNT(*)
		FROM attendance_records ar
		INNER JOIN employees e ON ar.employee_id = e.id
		WHERE ar.deleted_at IS NULL AND e.deleted_at IS NULL
	`

	// Build main query
	query := `
		SELECT
			ar.id, ar.employee_id, ar.check_in_time, ar.check_out_time,
			ar.actual_check_in_time, ar.actual_check_out_time,
			ar.status, ar.check_in_note, ar.check_out_note,
			ar.created_at, ar.updated_at, ar.edited_by, ar.edited_at, ar.edit_reason,
			e.name as employee_name, e.username as employee_username
		FROM attendance_records ar
		INNER JOIN employees e ON ar.employee_id = e.id
		WHERE ar.deleted_at IS NULL AND e.deleted_at IS NULL
	`

	args := []interface{}{}
	argCount := 0

	// Add filters
	if startDate != nil {
		argCount++
		filter := fmt.Sprintf(" AND ar.check_in_time >= $%d", argCount)
		query += filter
		countQuery += filter
		args = append(args, startDate)
	}

	if endDate != nil {
		argCount++
		filter := fmt.Sprintf(" AND ar.check_in_time < $%d", argCount)
		query += filter
		countQuery += filter
		args = append(args, endDate)
	}

	if employeeID != nil {
		argCount++
		filter := fmt.Sprintf(" AND ar.employee_id = $%d", argCount)
		query += filter
		countQuery += filter
		args = append(args, employeeID)
	}

	// Get total count
	var total int
	err := s.db.Get(&total, countQuery, args...)
	if err != nil {
		s.logger.Error("Failed to count attendance records", zap.Error(err))
		return nil, 0, err
	}

	// Add ordering and pagination
	query += " ORDER BY ar.check_in_time DESC"

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

	var records []*models.AttendanceRecordWithEmployee
	err = s.db.Select(&records, query, args...)
	if err != nil {
		s.logger.Error("Failed to get attendance records", zap.Error(err))
		return nil, 0, err
	}

	return records, total, nil
}

// UpdateAttendanceRecord updates an existing attendance record (admin only)
func (s *AdminAttendanceService) UpdateAttendanceRecord(
	recordID int,
	checkInTime, checkOutTime *time.Time,
	status *models.AttendanceStatus,
	checkInNote, checkOutNote, editReason *string,
	adminID int,
) (*models.AttendanceRecord, error) {

	// Fetch existing record to validate time ordering
	var existing struct {
		CheckInTime  time.Time    `db:"check_in_time"`
		CheckOutTime sql.NullTime `db:"check_out_time"`
	}
	if err := s.db.Get(&existing,
		"SELECT check_in_time, check_out_time FROM attendance_records WHERE id = $1 AND deleted_at IS NULL",
		recordID,
	); err != nil {
		if err == sql.ErrNoRows {
			return nil, customErrors.ErrRecordNotFound
		}
		return nil, err
	}

	effectiveCheckIn := existing.CheckInTime
	if checkInTime != nil {
		effectiveCheckIn = *checkInTime
	}
	var effectiveCheckOut *time.Time
	if checkOutTime != nil {
		effectiveCheckOut = checkOutTime
	} else if existing.CheckOutTime.Valid {
		t := existing.CheckOutTime.Time
		effectiveCheckOut = &t
	}
	if effectiveCheckOut != nil && !effectiveCheckOut.After(effectiveCheckIn) {
		return nil, customErrors.ErrCheckOutBeforeCheckIn
	}

	// Build dynamic update query
	updates := []string{"updated_at = NOW()", "edited_at = NOW()"}
	args := []interface{}{}
	argCount := 0

	// Add edited_by
	argCount++
	updates = append(updates, fmt.Sprintf("edited_by = $%d", argCount))
	args = append(args, adminID)

	// Add edit_reason
	if editReason != nil && *editReason != "" {
		argCount++
		updates = append(updates, fmt.Sprintf("edit_reason = $%d", argCount))
		args = append(args, *editReason)
	}

	// Update fields
	if checkInTime != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("check_in_time = $%d", argCount))
		args = append(args, checkInTime)
	}

	if checkOutTime != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("check_out_time = $%d", argCount))
		args = append(args, checkOutTime)

		// Auto-update status to CHECKED_OUT if check_out_time is set and status wasn't explicitly provided
		if status == nil {
			argCount++
			updates = append(updates, fmt.Sprintf("status = $%d", argCount))
			args = append(args, models.StatusCheckedOut)
		}
	}

	if status != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("status = $%d", argCount))
		args = append(args, *status)
	}

	if checkInNote != nil {
		argCount++
		if *checkInNote == "" {
			updates = append(updates, "check_in_note = NULL")
		} else {
			updates = append(updates, fmt.Sprintf("check_in_note = $%d", argCount))
			args = append(args, *checkInNote)
		}
	}

	if checkOutNote != nil {
		argCount++
		if *checkOutNote == "" {
			updates = append(updates, "check_out_note = NULL")
		} else {
			updates = append(updates, fmt.Sprintf("check_out_note = $%d", argCount))
			args = append(args, *checkOutNote)
		}
	}

	// Add record ID to args
	argCount++
	args = append(args, recordID)

	query := fmt.Sprintf(`
		UPDATE attendance_records
		SET %s
		WHERE id = $%d AND deleted_at IS NULL
		RETURNING id, employee_id, check_in_time, check_out_time, status,
		          check_in_note, check_out_note, created_at, updated_at, deleted_at,
		          edited_by, edited_at, edit_reason
	`, strings.Join(updates, ", "), argCount)

	var record models.AttendanceRecord
	err := s.db.QueryRowx(query, args...).StructScan(&record)
	if err == sql.ErrNoRows {
		return nil, customErrors.ErrRecordNotFound
	}
	if err != nil {
		s.logger.Error("Failed to update attendance record", zap.Error(err), zap.Int("record_id", recordID))
		return nil, err
	}

	s.logger.Info("Admin updated attendance record",
		zap.Int("record_id", recordID),
		zap.Int("admin_id", adminID))

	return &record, nil
}

// CreateAttendanceRecord creates a new attendance record (admin only)
func (s *AdminAttendanceService) CreateAttendanceRecord(
	employeeID int,
	checkInTime time.Time,
	checkOutTime *time.Time,
	status models.AttendanceStatus,
	checkInNote, checkOutNote, editReason *string,
	adminID int,
) (*models.AttendanceRecord, error) {

	if checkOutTime != nil && !checkOutTime.After(checkInTime) {
		return nil, customErrors.ErrCheckOutBeforeCheckIn
	}

	var checkInNoteValue, checkOutNoteValue, editReasonValue sql.NullString

	if checkInNote != nil && *checkInNote != "" {
		checkInNoteValue = sql.NullString{String: *checkInNote, Valid: true}
	}

	if checkOutNote != nil && *checkOutNote != "" {
		checkOutNoteValue = sql.NullString{String: *checkOutNote, Valid: true}
	}

	if editReason != nil && *editReason != "" {
		editReasonValue = sql.NullString{String: *editReason, Valid: true}
	}

	query := `
		INSERT INTO attendance_records (
			employee_id, check_in_time, check_out_time, status,
			check_in_note, check_out_note, edited_by, edited_at, edit_reason,
			created_at, updated_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, NOW(), NOW())
		RETURNING id, employee_id, check_in_time, check_out_time, status,
		          check_in_note, check_out_note, created_at, updated_at, deleted_at,
		          edited_by, edited_at, edit_reason
	`

	var record models.AttendanceRecord
	err := s.db.QueryRowx(
		query,
		employeeID, checkInTime, checkOutTime, status,
		checkInNoteValue, checkOutNoteValue, adminID, editReasonValue,
	).StructScan(&record)

	if err != nil {
		s.logger.Error("Failed to create attendance record",
			zap.Error(err),
			zap.Int("employee_id", employeeID),
			zap.Int("admin_id", adminID))
		return nil, err
	}

	s.logger.Info("Admin created attendance record",
		zap.Int("record_id", record.ID),
		zap.Int("employee_id", employeeID),
		zap.Int("admin_id", adminID))

	return &record, nil
}

// DeleteAttendanceRecord soft deletes an attendance record (admin only)
func (s *AdminAttendanceService) DeleteAttendanceRecord(recordID, adminID int) error {
	query := `
		UPDATE attendance_records
		SET deleted_at = NOW(), updated_at = NOW(), edited_by = $1
		WHERE id = $2 AND deleted_at IS NULL
	`

	result, err := s.db.Exec(query, adminID, recordID)
	if err != nil {
		s.logger.Error("Failed to delete attendance record", zap.Error(err), zap.Int("record_id", recordID))
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return customErrors.ErrRecordNotFound
	}

	s.logger.Info("Admin deleted attendance record",
		zap.Int("record_id", recordID),
		zap.Int("admin_id", adminID))

	return nil
}

// GetAllEmployees retrieves all active employees (for dropdowns)
func (s *AdminAttendanceService) GetAllEmployees() ([]*models.Employee, error) {
	query := `
		SELECT id, username, name, email, phone, role, is_active, hourly_rate, created_at, updated_at
		FROM employees
		WHERE deleted_at IS NULL AND is_active = true
		ORDER BY name ASC
	`

	var employees []*models.Employee
	err := s.db.Select(&employees, query)
	if err != nil {
		s.logger.Error("Failed to get employees", zap.Error(err))
		return nil, err
	}

	return employees, nil
}
