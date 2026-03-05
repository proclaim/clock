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

type AttendanceService struct {
	db     *database.Database
	cfg    *config.Config
	logger *zap.Logger
}

func NewAttendanceService(db *database.Database, cfg *config.Config, logger *zap.Logger) *AttendanceService {
	return &AttendanceService{
		db:     db,
		cfg:    cfg,
		logger: logger,
	}
}

// CheckIn creates a new check-in record
func (s *AttendanceService) CheckIn(employeeID int, note string) (*models.AttendanceRecord, *models.AttendanceRecord, error) {
	now := time.Now()
	taipeiLoc, _ := time.LoadLocation("Asia/Taipei")
	nowLocal := now.In(taipeiLoc)
	today := time.Date(nowLocal.Year(), nowLocal.Month(), nowLocal.Day(), 0, 0, 0, 0, taipeiLoc)

	// Check for active check-in
	activeRecord, err := s.getActiveCheckIn(employeeID)
	if err != nil && err != customErrors.ErrNoActiveCheckIn {
		return nil, nil, err
	}

	var autoClosedRecord *models.AttendanceRecord

	if activeRecord != nil {
		// Check if the active check-in is from today (in Taipei time)
		activeCheckInLocal := activeRecord.CheckInTime.In(taipeiLoc)
		activeCheckInDay := time.Date(activeCheckInLocal.Year(), activeCheckInLocal.Month(), activeCheckInLocal.Day(), 0, 0, 0, 0, taipeiLoc)

		if activeCheckInDay.Equal(today) {
			// Already checked in today
			s.logger.Warn("Check-in attempt while already checked in today",
				zap.Int("employee_id", employeeID),
				zap.Time("existing_check_in", activeRecord.CheckInTime))
			return nil, nil, customErrors.ErrAlreadyCheckedIn
		}

		// Auto-close the previous day's check-in
		autoClosedRecord, err = s.autoClosePreviousCheckIn(activeRecord)
		if err != nil {
			s.logger.Error("Failed to auto-close previous check-in",
				zap.Error(err),
				zap.Int("record_id", activeRecord.ID))
			return nil, nil, err
		}

		s.logger.Info("Auto-closed previous check-in",
			zap.Int("employee_id", employeeID),
			zap.Int("record_id", activeRecord.ID))
	}

	// Create new check-in record
	var noteValue sql.NullString
	if note != "" {
		noteValue = sql.NullString{String: note, Valid: true}
	}

	query := `
		INSERT INTO attendance_records (employee_id, check_in_time, status, check_in_note, created_at, updated_at)
		VALUES ($1, $2, $3, $4, NOW(), NOW())
		RETURNING id, employee_id, check_in_time, check_out_time, status, check_in_note, check_out_note, created_at, updated_at, deleted_at
	`

	var newRecord models.AttendanceRecord
	err = s.db.QueryRowx(query, employeeID, now, models.StatusCheckedIn, noteValue).StructScan(&newRecord)
	if err != nil {
		s.logger.Error("Failed to create check-in record", zap.Error(err), zap.Int("employee_id", employeeID))
		return nil, nil, err
	}

	s.logger.Info("Check-in successful",
		zap.Int("employee_id", employeeID),
		zap.Int("record_id", newRecord.ID),
		zap.Bool("auto_closed_previous", autoClosedRecord != nil))

	return &newRecord, autoClosedRecord, nil
}

// CheckOut updates the check-out time for the active check-in record
func (s *AttendanceService) CheckOut(employeeID int, note string) (*models.AttendanceRecord, error) {
	// Find active check-in
	activeRecord, err := s.getActiveCheckIn(employeeID)
	if err != nil {
		if err == customErrors.ErrNoActiveCheckIn {
			s.logger.Warn("Check-out attempt without active check-in", zap.Int("employee_id", employeeID))
		}
		return nil, err
	}

	// Update check-out time and status
	now := time.Now()
	var noteValue sql.NullString
	if note != "" {
		noteValue = sql.NullString{String: note, Valid: true}
	}

	query := `
		UPDATE attendance_records
		SET check_out_time = $1, status = $2, check_out_note = $3, updated_at = NOW()
		WHERE id = $4 AND deleted_at IS NULL
		RETURNING id, employee_id, check_in_time, check_out_time, status, check_in_note, check_out_note, created_at, updated_at, deleted_at
	`

	var updatedRecord models.AttendanceRecord
	err = s.db.QueryRowx(query, now, models.StatusCheckedOut, noteValue, activeRecord.ID).StructScan(&updatedRecord)
	if err != nil {
		s.logger.Error("Failed to update check-out", zap.Error(err), zap.Int("record_id", activeRecord.ID))
		return nil, err
	}

	s.logger.Info("Check-out successful",
		zap.Int("employee_id", employeeID),
		zap.Int("record_id", updatedRecord.ID))

	return &updatedRecord, nil
}

// GetCurrentStatus returns the current check-in status for an employee
func (s *AttendanceService) GetCurrentStatus(employeeID int) (*models.AttendanceRecord, bool, error) {
	activeRecord, err := s.getActiveCheckIn(employeeID)
	if err != nil {
		if err == customErrors.ErrNoActiveCheckIn {
			return nil, false, nil
		}
		return nil, false, err
	}

	return activeRecord, true, nil
}

// GetRecords retrieves attendance records for an employee with optional filters
func (s *AttendanceService) GetRecords(employeeID int, year, month *int) ([]*models.AttendanceRecord, error) {
	query := `
		SELECT id, employee_id, check_in_time, check_out_time, status, check_in_note, check_out_note,
		       created_at, updated_at, deleted_at
		FROM attendance_records
		WHERE employee_id = $1 AND deleted_at IS NULL
	`
	args := []interface{}{employeeID}
	argCount := 1

	// Add year and month filters if provided
	if year != nil && month != nil {
		taipeiLoc, _ := time.LoadLocation("Asia/Taipei")
		startDate := time.Date(*year, time.Month(*month), 1, 0, 0, 0, 0, taipeiLoc)
		endDate := startDate.AddDate(0, 1, 0)

		argCount++
		query += fmt.Sprintf(" AND check_in_time >= $%d", argCount)
		args = append(args, startDate)

		argCount++
		query += fmt.Sprintf(" AND check_in_time < $%d", argCount)
		args = append(args, endDate)
	}

	query += " ORDER BY check_in_time DESC"

	var records []*models.AttendanceRecord
	err := s.db.Select(&records, query, args...)
	if err != nil {
		s.logger.Error("Failed to get attendance records",
			zap.Error(err),
			zap.Int("employee_id", employeeID))
		return nil, err
	}

	return records, nil
}

// getActiveCheckIn finds the current active check-in for an employee
func (s *AttendanceService) getActiveCheckIn(employeeID int) (*models.AttendanceRecord, error) {
	query := `
		SELECT id, employee_id, check_in_time, check_out_time, status, check_in_note, check_out_note,
		       created_at, updated_at, deleted_at
		FROM attendance_records
		WHERE employee_id = $1 AND status = $2 AND deleted_at IS NULL
		ORDER BY check_in_time DESC
		LIMIT 1
	`

	var record models.AttendanceRecord
	err := s.db.Get(&record, query, employeeID, models.StatusCheckedIn)
	if err == sql.ErrNoRows {
		return nil, customErrors.ErrNoActiveCheckIn
	}
	if err != nil {
		s.logger.Error("Database error getting active check-in", zap.Error(err), zap.Int("employee_id", employeeID))
		return nil, err
	}

	return &record, nil
}

// autoClosePreviousCheckIn auto-closes a previous check-in record
func (s *AttendanceService) autoClosePreviousCheckIn(record *models.AttendanceRecord) (*models.AttendanceRecord, error) {
	query := `
		UPDATE attendance_records
		SET status = $1, updated_at = NOW()
		WHERE id = $2 AND deleted_at IS NULL
		RETURNING id, employee_id, check_in_time, check_out_time, status, check_in_note, check_out_note, created_at, updated_at, deleted_at
	`

	var updatedRecord models.AttendanceRecord
	err := s.db.QueryRowx(query, models.StatusAutoClosed, record.ID).StructScan(&updatedRecord)
	if err != nil {
		return nil, err
	}

	return &updatedRecord, nil
}
