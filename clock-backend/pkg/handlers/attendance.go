package handlers

import (
	"errors"
	"io"
	"strconv"
	"time"

	"github.com/kataras/iris/v12"
	"go.uber.org/zap"

	customErrors "github.com/jim/clock-backend/pkg/errors"
	"github.com/jim/clock-backend/pkg/middleware"
	"github.com/jim/clock-backend/pkg/models"
	"github.com/jim/clock-backend/pkg/reqres"
)

// parseChosenTime parses an optional RFC3339 chosen clock time from a request
// payload. Returns nil when the field is empty.
func parseChosenTime(value string) (*time.Time, error) {
	if value == "" {
		return nil, nil
	}
	t, err := time.Parse(time.RFC3339, value)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

// CheckIn handles check-in requests
func (h *Handler) CheckIn(ctx iris.Context) {
	employeeID := middleware.GetEmployeeID(ctx)

	var req reqres.CheckInRequest

	if err := ctx.ReadJSON(&req); err != nil {
		// Allow empty body, but reject malformed JSON so a bad chosen time is
		// not silently recorded as "now"
		if !errors.Is(err, io.EOF) {
			h.respondWithError(ctx, iris.StatusBadRequest, "invalid request body")
			return
		}
		req = reqres.CheckInRequest{}
	}

	chosenTime, err := parseChosenTime(req.CheckInTime)
	if err != nil {
		h.respondWithError(ctx, iris.StatusBadRequest, "check_in_time must be a valid RFC3339 timestamp")
		return
	}

	// Perform check-in
	newRecord, autoClosedRecord, err := h.attendanceService.CheckIn(employeeID, req.Note, chosenTime)
	if err != nil {
		if err == customErrors.ErrAlreadyCheckedIn || err == customErrors.ErrChosenTimeNotToday {
			h.respondWithError(ctx, iris.StatusBadRequest, err.Error())
			return
		}
		h.logger.Error("Check-in error", zap.Error(err), zap.Int("employee_id", employeeID))
		h.respondWithError(ctx, iris.StatusInternalServerError, "Internal server error")
		return
	}

	// Build response
	response := reqres.CheckInResponse{
		ID:                      newRecord.ID,
		EmployeeID:              newRecord.EmployeeID,
		CheckInTime:             newRecord.CheckInTime.Format("2006-01-02T15:04:05Z07:00"),
		Status:                  newRecord.Status,
		PreviousRecordAutoClosed: autoClosedRecord != nil,
	}

	if newRecord.CheckInNote.Valid {
		response.Note = newRecord.CheckInNote.String
	}

	if autoClosedRecord != nil {
		response.AutoClosedRecord = autoClosedRecord.ToResponse()
	}

	h.respondWithJSON(ctx, iris.StatusCreated, response)
}

// CheckOut handles check-out requests
func (h *Handler) CheckOut(ctx iris.Context) {
	employeeID := middleware.GetEmployeeID(ctx)

	var req reqres.CheckOutRequest

	if err := ctx.ReadJSON(&req); err != nil {
		// Allow empty body, but reject malformed JSON so a bad chosen time is
		// not silently recorded as "now"
		if !errors.Is(err, io.EOF) {
			h.respondWithError(ctx, iris.StatusBadRequest, "invalid request body")
			return
		}
		req = reqres.CheckOutRequest{}
	}

	chosenTime, err := parseChosenTime(req.CheckOutTime)
	if err != nil {
		h.respondWithError(ctx, iris.StatusBadRequest, "check_out_time must be a valid RFC3339 timestamp")
		return
	}

	// Perform check-out
	record, err := h.attendanceService.CheckOut(employeeID, req.Note, chosenTime)
	if err != nil {
		if err == customErrors.ErrNoActiveCheckIn || err == customErrors.ErrChosenTimeNotToday || err == customErrors.ErrCheckOutBeforeCheckIn {
			h.respondWithError(ctx, iris.StatusBadRequest, err.Error())
			return
		}
		h.logger.Error("Check-out error", zap.Error(err), zap.Int("employee_id", employeeID))
		h.respondWithError(ctx, iris.StatusInternalServerError, "Internal server error")
		return
	}

	// Build response
	response := reqres.CheckOutResponse{
		ID:          record.ID,
		EmployeeID:  record.EmployeeID,
		CheckInTime: record.CheckInTime.Format("2006-01-02T15:04:05Z07:00"),
		Status:      record.Status,
	}

	if record.CheckOutTime.Valid {
		response.CheckOutTime = record.CheckOutTime.Time.Format("2006-01-02T15:04:05Z07:00")
	}

	if record.CheckInNote.Valid {
		response.CheckInNote = record.CheckInNote.String
	}

	if record.CheckOutNote.Valid {
		response.CheckOutNote = record.CheckOutNote.String
	}

	h.respondWithJSON(ctx, iris.StatusOK, response)
}

// GetStatus handles current status requests
func (h *Handler) GetStatus(ctx iris.Context) {
	employeeID := middleware.GetEmployeeID(ctx)

	// Get current status
	record, isCheckedIn, err := h.attendanceService.GetCurrentStatus(employeeID)
	if err != nil {
		h.logger.Error("Get status error", zap.Error(err), zap.Int("employee_id", employeeID))
		h.respondWithError(ctx, iris.StatusInternalServerError, "Internal server error")
		return
	}

	// Build response
	response := reqres.AttendanceStatusResponse{
		IsCheckedIn: isCheckedIn,
	}

	if isCheckedIn && record != nil {
		response.CurrentRecord = record.ToResponse()
	}

	h.respondWithJSON(ctx, iris.StatusOK, response)
}

// GetSuggestedTime handles requests for the usual clock time suggestion
func (h *Handler) GetSuggestedTime(ctx iris.Context) {
	employeeID := middleware.GetEmployeeID(ctx)

	action := ctx.URLParam("action")
	if action != "check_in" && action != "check_out" {
		h.respondWithError(ctx, iris.StatusBadRequest, "action must be 'check_in' or 'check_out'")
		return
	}

	suggested, sampleCount, err := h.attendanceService.GetSuggestedTime(employeeID, action)
	if err != nil {
		h.logger.Error("Get suggested time error", zap.Error(err), zap.Int("employee_id", employeeID))
		h.respondWithError(ctx, iris.StatusInternalServerError, "Internal server error")
		return
	}

	response := reqres.SuggestedTimeResponse{
		Action:        action,
		HasSuggestion: suggested != nil,
		SampleCount:   sampleCount,
	}

	if suggested != nil {
		response.SuggestedTime = suggested.Format("2006-01-02T15:04:05Z07:00")
	}

	h.respondWithJSON(ctx, iris.StatusOK, response)
}

// GetRecords handles attendance records retrieval
func (h *Handler) GetRecords(ctx iris.Context) {
	employeeID := middleware.GetEmployeeID(ctx)

	// Parse query parameters
	var year, month *int

	if yearStr := ctx.URLParam("year"); yearStr != "" {
		if y, err := strconv.Atoi(yearStr); err == nil {
			year = &y
		}
	}

	if monthStr := ctx.URLParam("month"); monthStr != "" {
		if m, err := strconv.Atoi(monthStr); err == nil && m >= 1 && m <= 12 {
			month = &m
		}
	}

	// Get records
	records, err := h.attendanceService.GetRecords(employeeID, year, month)
	if err != nil {
		h.logger.Error("Get records error", zap.Error(err), zap.Int("employee_id", employeeID))
		h.respondWithError(ctx, iris.StatusInternalServerError, "Internal server error")
		return
	}

	// Build response
	recordResponses := make([]*models.AttendanceRecordResponse, len(records))
	for i, record := range records {
		recordResponses[i] = record.ToResponse()
	}

	response := reqres.AttendanceRecordsResponse{
		Records: recordResponses,
		Total:   len(recordResponses),
	}

	h.respondWithJSON(ctx, iris.StatusOK, response)
}
