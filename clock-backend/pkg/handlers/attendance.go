package handlers

import (
	"strconv"

	"github.com/kataras/iris/v12"
	"go.uber.org/zap"

	customErrors "github.com/jim/clock-backend/pkg/errors"
	"github.com/jim/clock-backend/pkg/middleware"
	"github.com/jim/clock-backend/pkg/models"
	"github.com/jim/clock-backend/pkg/reqres"
)

// CheckIn handles check-in requests
func (h *Handler) CheckIn(ctx iris.Context) {
	employeeID := middleware.GetEmployeeID(ctx)

	var req reqres.CheckInRequest

	if err := ctx.ReadJSON(&req); err != nil {
		// Allow empty body
		req = reqres.CheckInRequest{}
	}

	// Perform check-in
	newRecord, autoClosedRecord, err := h.attendanceService.CheckIn(employeeID, req.Note)
	if err != nil {
		if err == customErrors.ErrAlreadyCheckedIn {
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
		// Allow empty body
		req = reqres.CheckOutRequest{}
	}

	// Perform check-out
	record, err := h.attendanceService.CheckOut(employeeID, req.Note)
	if err != nil {
		if err == customErrors.ErrNoActiveCheckIn {
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
