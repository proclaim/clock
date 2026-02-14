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

type EditRequestService struct {
	db     *database.Database
	cfg    *config.Config
	logger *zap.Logger
}

func NewEditRequestService(db *database.Database, cfg *config.Config, logger *zap.Logger) *EditRequestService {
	return &EditRequestService{
		db:     db,
		cfg:    cfg,
		logger: logger,
	}
}

// SubmitEditRequest creates a new edit request for an employee's own attendance record
func (s *EditRequestService) SubmitEditRequest(
	employeeID int,
	attendanceRecordID int,
	checkInTime, checkOutTime *time.Time,
	note string,
) (*models.EditRequest, error) {
	// Verify the attendance record belongs to this employee
	var recordEmployeeID int
	err := s.db.Get(&recordEmployeeID,
		"SELECT employee_id FROM attendance_records WHERE id = $1 AND deleted_at IS NULL",
		attendanceRecordID,
	)
	if err == sql.ErrNoRows {
		return nil, customErrors.ErrRecordNotFound
	}
	if err != nil {
		s.logger.Error("Failed to verify attendance record ownership", zap.Error(err))
		return nil, err
	}

	if recordEmployeeID != employeeID {
		return nil, customErrors.ErrUnauthorized
	}

	// Check if there's already a pending edit request for this record
	var existingCount int
	err = s.db.Get(&existingCount,
		"SELECT COUNT(*) FROM edit_requests WHERE attendance_record_id = $1 AND status = 'PENDING'",
		attendanceRecordID,
	)
	if err != nil {
		s.logger.Error("Failed to check existing edit requests", zap.Error(err))
		return nil, err
	}
	if existingCount > 0 {
		return nil, customErrors.ErrEditRequestAlreadyPending
	}

	var checkInTimeValue, checkOutTimeValue sql.NullTime
	if checkInTime != nil {
		checkInTimeValue = sql.NullTime{Time: *checkInTime, Valid: true}
	}
	if checkOutTime != nil {
		checkOutTimeValue = sql.NullTime{Time: *checkOutTime, Valid: true}
	}

	var noteValue sql.NullString
	if note != "" {
		noteValue = sql.NullString{String: note, Valid: true}
	}

	query := `
		INSERT INTO edit_requests (
			attendance_record_id, employee_id, request_type,
			requested_check_in_time, requested_check_out_time,
			note, status, created_at, updated_at
		)
		VALUES ($1, $2, 'EDIT', $3, $4, $5, 'PENDING', NOW(), NOW())
		RETURNING id, attendance_record_id, employee_id, request_type,
		          requested_check_in_time, requested_check_out_time,
		          note, status, reviewed_by, reviewed_at, review_note,
		          created_at, updated_at
	`

	var editRequest models.EditRequest
	err = s.db.QueryRowx(query,
		attendanceRecordID, employeeID,
		checkInTimeValue, checkOutTimeValue,
		noteValue,
	).StructScan(&editRequest)

	if err != nil {
		s.logger.Error("Failed to create edit request", zap.Error(err),
			zap.Int("employee_id", employeeID),
			zap.Int("attendance_record_id", attendanceRecordID))
		return nil, err
	}

	s.logger.Info("Edit request submitted",
		zap.Int("edit_request_id", editRequest.ID),
		zap.Int("employee_id", employeeID),
		zap.Int("attendance_record_id", attendanceRecordID))

	return &editRequest, nil
}

// GetEmployeeEditRequests returns edit requests for a specific employee
func (s *EditRequestService) GetEmployeeEditRequests(employeeID int) ([]*models.EditRequest, error) {
	query := `
		SELECT id, attendance_record_id, employee_id, request_type,
		       requested_check_in_time, requested_check_out_time,
		       note, status, reviewed_by, reviewed_at, review_note,
		       created_at, updated_at
		FROM edit_requests
		WHERE employee_id = $1
		ORDER BY created_at DESC
	`

	var requests []*models.EditRequest
	err := s.db.Select(&requests, query, employeeID)
	if err != nil {
		s.logger.Error("Failed to get employee edit requests", zap.Error(err),
			zap.Int("employee_id", employeeID))
		return nil, err
	}

	return requests, nil
}

// GetPendingEditRequests returns all pending edit requests with details (admin)
func (s *EditRequestService) GetPendingEditRequests() ([]*models.EditRequestWithDetails, error) {
	query := `
		SELECT er.id, er.attendance_record_id, er.employee_id, er.request_type,
		       e.name as employee_name, e.username as employee_username,
		       er.requested_check_in_time, er.requested_check_out_time,
		       er.note, er.status, er.reviewed_by, er.reviewed_at, er.review_note,
		       er.created_at, er.updated_at,
		       ar.check_in_time as original_check_in_time,
		       ar.check_out_time as original_check_out_time,
		       ar.status as original_status
		FROM edit_requests er
		INNER JOIN employees e ON er.employee_id = e.id
		LEFT JOIN attendance_records ar ON er.attendance_record_id = ar.id
		WHERE er.status = 'PENDING'
		ORDER BY er.created_at ASC
	`

	var requests []*models.EditRequestWithDetails
	err := s.db.Select(&requests, query)
	if err != nil {
		s.logger.Error("Failed to get pending edit requests", zap.Error(err))
		return nil, err
	}

	return requests, nil
}

// SubmitAddRequest creates a new ADD request for an employee to request a new attendance record
func (s *EditRequestService) SubmitAddRequest(
	employeeID int,
	checkInTime time.Time,
	checkOutTime *time.Time,
	note string,
) (*models.EditRequest, error) {
	checkInTimeValue := sql.NullTime{Time: checkInTime, Valid: true}

	var checkOutTimeValue sql.NullTime
	if checkOutTime != nil {
		checkOutTimeValue = sql.NullTime{Time: *checkOutTime, Valid: true}
	}

	var noteValue sql.NullString
	if note != "" {
		noteValue = sql.NullString{String: note, Valid: true}
	}

	query := `
		INSERT INTO edit_requests (
			employee_id, request_type,
			requested_check_in_time, requested_check_out_time,
			note, status, created_at, updated_at
		)
		VALUES ($1, 'ADD', $2, $3, $4, 'PENDING', NOW(), NOW())
		RETURNING id, attendance_record_id, employee_id, request_type,
		          requested_check_in_time, requested_check_out_time,
		          note, status, reviewed_by, reviewed_at, review_note,
		          created_at, updated_at
	`

	var editRequest models.EditRequest
	err := s.db.QueryRowx(query,
		employeeID,
		checkInTimeValue, checkOutTimeValue,
		noteValue,
	).StructScan(&editRequest)

	if err != nil {
		s.logger.Error("Failed to create add request", zap.Error(err),
			zap.Int("employee_id", employeeID))
		return nil, err
	}

	s.logger.Info("Add request submitted",
		zap.Int("edit_request_id", editRequest.ID),
		zap.Int("employee_id", employeeID))

	return &editRequest, nil
}

// ApproveEditRequest approves an edit request and applies changes to the attendance record
func (s *EditRequestService) ApproveEditRequest(editRequestID, adminID int, reviewNote string) error {
	// Get the edit request
	var editRequest models.EditRequest
	err := s.db.Get(&editRequest, `
		SELECT id, attendance_record_id, employee_id, request_type,
		       requested_check_in_time, requested_check_out_time,
		       note, status, reviewed_by, reviewed_at, review_note,
		       created_at, updated_at
		FROM edit_requests WHERE id = $1
	`, editRequestID)

	if err == sql.ErrNoRows {
		return customErrors.ErrRecordNotFound
	}
	if err != nil {
		s.logger.Error("Failed to get edit request", zap.Error(err))
		return err
	}

	if editRequest.Status != models.EditRequestPending {
		return customErrors.ErrEditRequestAlreadyReviewed
	}

	// Begin transaction
	tx, err := s.db.Beginx()
	if err != nil {
		s.logger.Error("Failed to begin transaction", zap.Error(err))
		return err
	}
	defer tx.Rollback()

	if editRequest.RequestType == models.EditRequestTypeAdd {
		// For ADD requests: create a new attendance record
		status := models.StatusCheckedIn
		if editRequest.RequestedCheckOutTime.Valid {
			status = models.StatusCheckedOut
		}

		reason := "Approved add request"
		if editRequest.Note.Valid {
			reason = editRequest.Note.String
		}

		_, err = tx.Exec(`
			INSERT INTO attendance_records (
				employee_id, check_in_time, check_out_time, status,
				edited_by, edited_at, edit_reason,
				created_at, updated_at
			)
			VALUES ($1, $2, $3, $4, $5, NOW(), $6, NOW(), NOW())
		`, editRequest.EmployeeID,
			editRequest.RequestedCheckInTime.Time,
			editRequest.RequestedCheckOutTime,
			status,
			adminID,
			reason,
		)
		if err != nil {
			s.logger.Error("Failed to create attendance record from add request", zap.Error(err),
				zap.Int("edit_request_id", editRequestID))
			return err
		}
	} else {
		// For EDIT requests: update existing attendance record
		updates := []string{"updated_at = NOW()", "edited_at = NOW()"}
		args := []interface{}{}
		argCount := 0

		argCount++
		updates = append(updates, fmt.Sprintf("edited_by = $%d", argCount))
		args = append(args, adminID)

		reason := "Approved edit request"
		if editRequest.Note.Valid {
			reason = editRequest.Note.String
		}
		argCount++
		updates = append(updates, fmt.Sprintf("edit_reason = $%d", argCount))
		args = append(args, reason)

		if editRequest.RequestedCheckInTime.Valid {
			argCount++
			updates = append(updates, fmt.Sprintf("check_in_time = $%d", argCount))
			args = append(args, editRequest.RequestedCheckInTime.Time)
		}

		if editRequest.RequestedCheckOutTime.Valid {
			argCount++
			updates = append(updates, fmt.Sprintf("check_out_time = $%d", argCount))
			args = append(args, editRequest.RequestedCheckOutTime.Time)

			// Auto-update status to CHECKED_OUT
			argCount++
			updates = append(updates, fmt.Sprintf("status = $%d", argCount))
			args = append(args, models.StatusCheckedOut)
		}

		argCount++
		args = append(args, editRequest.AttendanceRecordID.Int64)

		updateQuery := fmt.Sprintf(`
			UPDATE attendance_records SET %s WHERE id = $%d AND deleted_at IS NULL
		`, strings.Join(updates, ", "), argCount)

		_, err = tx.Exec(updateQuery, args...)
		if err != nil {
			s.logger.Error("Failed to apply edit request changes", zap.Error(err),
				zap.Int("edit_request_id", editRequestID))
			return err
		}
	}

	// Update edit request status
	var reviewNoteValue sql.NullString
	if reviewNote != "" {
		reviewNoteValue = sql.NullString{String: reviewNote, Valid: true}
	}

	_, err = tx.Exec(`
		UPDATE edit_requests
		SET status = 'APPROVED', reviewed_by = $1, reviewed_at = NOW(), review_note = $2, updated_at = NOW()
		WHERE id = $3
	`, adminID, reviewNoteValue, editRequestID)

	if err != nil {
		s.logger.Error("Failed to update edit request status", zap.Error(err))
		return err
	}

	if err = tx.Commit(); err != nil {
		s.logger.Error("Failed to commit transaction", zap.Error(err))
		return err
	}

	s.logger.Info("Edit request approved",
		zap.Int("edit_request_id", editRequestID),
		zap.Int("admin_id", adminID))

	return nil
}

// RejectEditRequest rejects an edit request
func (s *EditRequestService) RejectEditRequest(editRequestID, adminID int, reviewNote string) error {
	var status models.EditRequestStatus
	err := s.db.Get(&status, "SELECT status FROM edit_requests WHERE id = $1", editRequestID)
	if err == sql.ErrNoRows {
		return customErrors.ErrRecordNotFound
	}
	if err != nil {
		return err
	}

	if status != models.EditRequestPending {
		return customErrors.ErrEditRequestAlreadyReviewed
	}

	var reviewNoteValue sql.NullString
	if reviewNote != "" {
		reviewNoteValue = sql.NullString{String: reviewNote, Valid: true}
	}

	_, err = s.db.Exec(`
		UPDATE edit_requests
		SET status = 'REJECTED', reviewed_by = $1, reviewed_at = NOW(), review_note = $2, updated_at = NOW()
		WHERE id = $3
	`, adminID, reviewNoteValue, editRequestID)

	if err != nil {
		s.logger.Error("Failed to reject edit request", zap.Error(err),
			zap.Int("edit_request_id", editRequestID))
		return err
	}

	s.logger.Info("Edit request rejected",
		zap.Int("edit_request_id", editRequestID),
		zap.Int("admin_id", adminID))

	return nil
}
