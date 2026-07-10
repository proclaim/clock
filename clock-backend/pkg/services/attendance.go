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

// CheckIn creates a new check-in record. If chosenTime is provided it becomes
// the official check_in_time (must be on today's date in Taipei); the actual
// button-press time is always recorded server-side for audit.
func (s *AttendanceService) CheckIn(employeeID int, note string, chosenTime *time.Time) (*models.AttendanceRecord, *models.AttendanceRecord, error) {
	now := time.Now()
	taipeiLoc, _ := time.LoadLocation("Asia/Taipei")
	nowLocal := now.In(taipeiLoc)
	today := time.Date(nowLocal.Year(), nowLocal.Month(), nowLocal.Day(), 0, 0, 0, 0, taipeiLoc)

	officialTime := now
	if chosenTime != nil {
		chosenLocal := chosenTime.In(taipeiLoc)
		if chosenLocal.Year() != nowLocal.Year() || chosenLocal.Month() != nowLocal.Month() || chosenLocal.Day() != nowLocal.Day() {
			return nil, nil, customErrors.ErrChosenTimeNotToday
		}
		officialTime = *chosenTime
	}

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
		INSERT INTO attendance_records (employee_id, check_in_time, actual_check_in_time, status, check_in_note, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
		RETURNING id, employee_id, check_in_time, check_out_time, actual_check_in_time, actual_check_out_time, status, check_in_note, check_out_note, created_at, updated_at, deleted_at
	`

	var newRecord models.AttendanceRecord
	err = s.db.QueryRowx(query, employeeID, officialTime, now, models.StatusCheckedIn, noteValue).StructScan(&newRecord)
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

// CheckOut updates the check-out time for the active check-in record. If
// chosenTime is provided it becomes the official check_out_time (must be on
// today's date in Taipei and after the check-in time); the actual button-press
// time is always recorded server-side for audit.
func (s *AttendanceService) CheckOut(employeeID int, note string, chosenTime *time.Time) (*models.AttendanceRecord, error) {
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
	taipeiLoc, _ := time.LoadLocation("Asia/Taipei")
	nowLocal := now.In(taipeiLoc)

	officialTime := now
	if chosenTime != nil {
		chosenLocal := chosenTime.In(taipeiLoc)
		if chosenLocal.Year() != nowLocal.Year() || chosenLocal.Month() != nowLocal.Month() || chosenLocal.Day() != nowLocal.Day() {
			return nil, customErrors.ErrChosenTimeNotToday
		}
		if !chosenTime.After(activeRecord.CheckInTime) {
			return nil, customErrors.ErrCheckOutBeforeCheckIn
		}
		officialTime = *chosenTime
	}

	var noteValue sql.NullString
	if note != "" {
		noteValue = sql.NullString{String: note, Valid: true}
	}

	query := `
		UPDATE attendance_records
		SET check_out_time = $1, actual_check_out_time = $2, status = $3, check_out_note = $4, updated_at = NOW()
		WHERE id = $5 AND deleted_at IS NULL
		RETURNING id, employee_id, check_in_time, check_out_time, actual_check_in_time, actual_check_out_time, status, check_in_note, check_out_note, created_at, updated_at, deleted_at
	`

	var updatedRecord models.AttendanceRecord
	err = s.db.QueryRowx(query, officialTime, now, models.StatusCheckedOut, noteValue, activeRecord.ID).StructScan(&updatedRecord)
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
		SELECT id, employee_id, check_in_time, check_out_time, actual_check_in_time, actual_check_out_time,
		       status, check_in_note, check_out_note, created_at, updated_at, deleted_at
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
		SELECT id, employee_id, check_in_time, check_out_time, actual_check_in_time, actual_check_out_time,
		       status, check_in_note, check_out_note, created_at, updated_at, deleted_at
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

// GetSuggestedTime derives the employee's "usual" check-in or check-out time
// from their attendance history: the most common 15-minute time-of-day bucket
// (Asia/Taipei) over the last 60 days. Returns (nil, sampleCount, nil) when
// there is not enough history (fewer than 5 qualifying records).
func (s *AttendanceService) GetSuggestedTime(employeeID int, action string) (*time.Time, int, error) {
	const (
		lookbackDays  = 60
		minSampleSize = 5
	)

	timeColumn := "check_in_time"
	statusFilter := ""
	if action == "check_out" {
		timeColumn = "check_out_time"
		statusFilter = "AND status = 'CHECKED_OUT' AND check_out_time IS NOT NULL"
	}

	query := fmt.Sprintf(`
		WITH history AS (
			SELECT (ROUND((EXTRACT(HOUR   FROM (%[1]s AT TIME ZONE 'Asia/Taipei')) * 60
			             + EXTRACT(MINUTE FROM (%[1]s AT TIME ZONE 'Asia/Taipei'))) / 15.0)::int * 15) %% 1440
			       AS bucket_minutes
			FROM attendance_records
			WHERE employee_id = $1 AND deleted_at IS NULL AND %[1]s >= $2 %[2]s
		)
		SELECT bucket_minutes, COUNT(*) AS bucket_count, SUM(COUNT(*)) OVER() AS total_count
		FROM history
		GROUP BY bucket_minutes
		ORDER BY bucket_count DESC, bucket_minutes ASC
		LIMIT 1
	`, timeColumn, statusFilter)

	since := time.Now().AddDate(0, 0, -lookbackDays)

	var result struct {
		BucketMinutes int `db:"bucket_minutes"`
		BucketCount   int `db:"bucket_count"`
		TotalCount    int `db:"total_count"`
	}
	err := s.db.Get(&result, query, employeeID, since)
	if err == sql.ErrNoRows {
		return nil, 0, nil
	}
	if err != nil {
		s.logger.Error("Failed to get suggested time",
			zap.Error(err),
			zap.Int("employee_id", employeeID),
			zap.String("action", action))
		return nil, 0, err
	}

	if result.TotalCount < minSampleSize {
		return nil, result.TotalCount, nil
	}

	taipeiLoc, _ := time.LoadLocation("Asia/Taipei")
	nowLocal := time.Now().In(taipeiLoc)
	suggested := time.Date(nowLocal.Year(), nowLocal.Month(), nowLocal.Day(),
		result.BucketMinutes/60, result.BucketMinutes%60, 0, 0, taipeiLoc)

	return &suggested, result.TotalCount, nil
}

// autoClosePreviousCheckIn auto-closes a previous check-in record
func (s *AttendanceService) autoClosePreviousCheckIn(record *models.AttendanceRecord) (*models.AttendanceRecord, error) {
	query := `
		UPDATE attendance_records
		SET status = $1, updated_at = NOW()
		WHERE id = $2 AND deleted_at IS NULL
		RETURNING id, employee_id, check_in_time, check_out_time, actual_check_in_time, actual_check_out_time, status, check_in_note, check_out_note, created_at, updated_at, deleted_at
	`

	var updatedRecord models.AttendanceRecord
	err := s.db.QueryRowx(query, models.StatusAutoClosed, record.ID).StructScan(&updatedRecord)
	if err != nil {
		return nil, err
	}

	return &updatedRecord, nil
}
