package handlers

import (
	"strconv"
	"time"

	"github.com/kataras/iris/v12"
	"go.uber.org/zap"

	customErrors "github.com/jim/clock-backend/pkg/errors"
	"github.com/jim/clock-backend/pkg/middleware"
	"github.com/jim/clock-backend/pkg/models"
	"github.com/jim/clock-backend/pkg/reqres"
)

// GetAdminAttendanceSummary returns attendance summary for all employees
func (h *Handler) GetAdminAttendanceSummary(ctx iris.Context) {
	// Parse query parameters
	var startDate, endDate *time.Time
	var employeeID *int

	if startStr := ctx.URLParam("start_date"); startStr != "" {
		if t, err := time.Parse("2006-01-02", startStr); err == nil {
			startDate = &t
		}
	}

	if endStr := ctx.URLParam("end_date"); endStr != "" {
		if t, err := time.Parse("2006-01-02", endStr); err == nil {
			endDate = &t
		}
	}

	if empIDStr := ctx.URLParam("employee_id"); empIDStr != "" {
		if id, err := strconv.Atoi(empIDStr); err == nil {
			employeeID = &id
		}
	}

	// Get summaries
	summaries, err := h.adminAttendanceService.GetAllEmployeesAttendanceSummary(startDate, endDate, employeeID)
	if err != nil {
		h.logger.Error("Failed to get admin attendance summary", zap.Error(err))
		h.respondWithError(ctx, iris.StatusInternalServerError, "Internal server error")
		return
	}

	// Build response
	summaryResponses := make([]*models.EmployeeAttendanceSummaryResponse, len(summaries))
	for i, summary := range summaries {
		summaryResponses[i] = summary.ToResponse()
	}

	response := reqres.AdminAttendanceSummaryResponse{
		Summaries: summaryResponses,
		Total:     len(summaryResponses),
	}

	h.respondWithJSON(ctx, iris.StatusOK, response)
}

// GetAdminAttendanceRecords returns all attendance records with pagination
func (h *Handler) GetAdminAttendanceRecords(ctx iris.Context) {
	// Parse query parameters
	var startDate, endDate *time.Time
	var employeeID *int
	page := 1
	perPage := 50

	if startStr := ctx.URLParam("start_date"); startStr != "" {
		if t, err := time.Parse("2006-01-02", startStr); err == nil {
			startDate = &t
		}
	}

	if endStr := ctx.URLParam("end_date"); endStr != "" {
		if t, err := time.Parse("2006-01-02", endStr); err == nil {
			endDate = &t
		}
	}

	if empIDStr := ctx.URLParam("employee_id"); empIDStr != "" {
		if id, err := strconv.Atoi(empIDStr); err == nil {
			employeeID = &id
		}
	}

	if pageStr := ctx.URLParam("page"); pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}

	if perPageStr := ctx.URLParam("per_page"); perPageStr != "" {
		if pp, err := strconv.Atoi(perPageStr); err == nil && pp > 0 && pp <= 100 {
			perPage = pp
		}
	}

	offset := (page - 1) * perPage

	// Get records
	records, total, err := h.adminAttendanceService.GetAllAttendanceRecords(
		startDate, endDate, employeeID, perPage, offset,
	)
	if err != nil {
		h.logger.Error("Failed to get admin attendance records", zap.Error(err))
		h.respondWithError(ctx, iris.StatusInternalServerError, "Internal server error")
		return
	}

	response := reqres.AdminAttendanceRecordsResponse{
		Records: records,
		Total:   total,
		Page:    page,
		PerPage: perPage,
	}

	h.respondWithJSON(ctx, iris.StatusOK, response)
}

// UpdateAdminAttendanceRecord updates an attendance record
func (h *Handler) UpdateAdminAttendanceRecord(ctx iris.Context) {
	adminID := middleware.GetEmployeeID(ctx)

	recordIDStr := ctx.Params().Get("id")
	recordID, err := strconv.Atoi(recordIDStr)
	if err != nil {
		h.respondWithError(ctx, iris.StatusBadRequest, "Invalid record ID")
		return
	}

	var req reqres.UpdateAttendanceRecordRequest
	if err := ctx.ReadJSON(&req); err != nil {
		h.respondWithError(ctx, iris.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate request
	if err := h.validate.Struct(req); err != nil {
		h.respondWithError(ctx, iris.StatusBadRequest, "Edit reason is required (minimum 3 characters)")
		return
	}

	// Parse times if provided
	var checkInTime, checkOutTime *time.Time
	var status *models.AttendanceStatus

	if req.CheckInTime != nil {
		if t, err := time.Parse(time.RFC3339, *req.CheckInTime); err == nil {
			checkInTime = &t
		} else {
			h.respondWithError(ctx, iris.StatusBadRequest, "Invalid check-in time format")
			return
		}
	}

	if req.CheckOutTime != nil {
		if t, err := time.Parse(time.RFC3339, *req.CheckOutTime); err == nil {
			checkOutTime = &t
		} else {
			h.respondWithError(ctx, iris.StatusBadRequest, "Invalid check-out time format")
			return
		}
	}

	if req.Status != nil {
		s := models.AttendanceStatus(*req.Status)
		status = &s
	}

	// Update record
	record, err := h.adminAttendanceService.UpdateAttendanceRecord(
		recordID, checkInTime, checkOutTime, status,
		req.CheckInNote, req.CheckOutNote, &req.EditReason,
		adminID,
	)

	if err != nil {
		if err == customErrors.ErrRecordNotFound {
			h.respondWithError(ctx, iris.StatusNotFound, "Record not found")
			return
		}
		h.logger.Error("Failed to update attendance record", zap.Error(err), zap.Int("record_id", recordID))
		h.respondWithError(ctx, iris.StatusInternalServerError, "Internal server error")
		return
	}

	h.respondWithJSON(ctx, iris.StatusOK, record.ToResponse())
}

// CreateAdminAttendanceRecord creates a new attendance record
func (h *Handler) CreateAdminAttendanceRecord(ctx iris.Context) {
	adminID := middleware.GetEmployeeID(ctx)

	var req reqres.CreateAttendanceRecordRequest
	if err := ctx.ReadJSON(&req); err != nil {
		h.respondWithError(ctx, iris.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate request
	if err := h.validate.Struct(req); err != nil {
		h.respondWithError(ctx, iris.StatusBadRequest, "Invalid request data")
		return
	}

	// Parse times
	checkInTime, err := time.Parse(time.RFC3339, req.CheckInTime)
	if err != nil {
		h.respondWithError(ctx, iris.StatusBadRequest, "Invalid check-in time format")
		return
	}

	var checkOutTime *time.Time
	if req.CheckOutTime != nil {
		if t, err := time.Parse(time.RFC3339, *req.CheckOutTime); err == nil {
			checkOutTime = &t
		} else {
			h.respondWithError(ctx, iris.StatusBadRequest, "Invalid check-out time format")
			return
		}
	}

	status := models.AttendanceStatus(req.Status)

	// Create record
	record, err := h.adminAttendanceService.CreateAttendanceRecord(
		req.EmployeeID, checkInTime, checkOutTime, status,
		req.CheckInNote, req.CheckOutNote, &req.EditReason,
		adminID,
	)

	if err != nil {
		h.logger.Error("Failed to create attendance record", zap.Error(err))
		h.respondWithError(ctx, iris.StatusInternalServerError, "Internal server error")
		return
	}

	h.respondWithJSON(ctx, iris.StatusCreated, record.ToResponse())
}

// DeleteAdminAttendanceRecord soft deletes an attendance record
func (h *Handler) DeleteAdminAttendanceRecord(ctx iris.Context) {
	adminID := middleware.GetEmployeeID(ctx)

	recordIDStr := ctx.Params().Get("id")
	recordID, err := strconv.Atoi(recordIDStr)
	if err != nil {
		h.respondWithError(ctx, iris.StatusBadRequest, "Invalid record ID")
		return
	}

	err = h.adminAttendanceService.DeleteAttendanceRecord(recordID, adminID)
	if err != nil {
		if err == customErrors.ErrRecordNotFound {
			h.respondWithError(ctx, iris.StatusNotFound, "Record not found")
			return
		}
		h.logger.Error("Failed to delete attendance record", zap.Error(err), zap.Int("record_id", recordID))
		h.respondWithError(ctx, iris.StatusInternalServerError, "Internal server error")
		return
	}

	h.respondWithJSON(ctx, iris.StatusOK, reqres.MessageResponse{
		Message: "Record deleted successfully",
	})
}

// GetAllEmployees returns list of all employees (for dropdowns)
func (h *Handler) GetAllEmployees(ctx iris.Context) {
	employees, err := h.adminAttendanceService.GetAllEmployees()
	if err != nil {
		h.logger.Error("Failed to get employees", zap.Error(err))
		h.respondWithError(ctx, iris.StatusInternalServerError, "Internal server error")
		return
	}

	employeeResponses := make([]*models.EmployeeResponse, len(employees))
	for i, emp := range employees {
		employeeResponses[i] = emp.ToResponse()
	}

	response := reqres.EmployeeListResponse{
		Employees: employeeResponses,
		Total:     len(employeeResponses),
	}

	h.respondWithJSON(ctx, iris.StatusOK, response)
}

// ResetEmployeePassword handles admin password reset for an employee
func (h *Handler) ResetEmployeePassword(ctx iris.Context) {
	// adminID := middleware.GetEmployeeID(ctx) // Could be used for audit logs if we extended them to employee changes

	targetEmployeeIDStr := ctx.Params().Get("id")
	targetEmployeeID, err := strconv.Atoi(targetEmployeeIDStr)
	if err != nil {
		h.respondWithError(ctx, iris.StatusBadRequest, "Invalid employee ID")
		return
	}

	var req reqres.ResetPasswordRequest
	if err := ctx.ReadJSON(&req); err != nil {
		h.logger.Warn("Invalid reset password request", zap.Error(err))
		h.respondWithError(ctx, iris.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate request
	if err := h.validate.Struct(req); err != nil {
		h.respondWithError(ctx, iris.StatusBadRequest, "New password is required (minimum 6 characters)")
		return
	}

	// Reset password
	err = h.authService.ResetPassword(targetEmployeeID, req.NewPassword)
	if err != nil {
		if err == customErrors.ErrPasswordTooShort {
			h.respondWithError(ctx, iris.StatusBadRequest, err.Error())
			return
		}
		if err == customErrors.ErrEmployeeNotFound {
			h.respondWithError(ctx, iris.StatusNotFound, "Employee not found")
			return
		}
		h.logger.Error("Password reset error", zap.Error(err), zap.Int("target_employee_id", targetEmployeeID))
		h.respondWithError(ctx, iris.StatusInternalServerError, "Internal server error")
		return
	}

	h.respondWithJSON(ctx, iris.StatusOK, reqres.MessageResponse{
		Message: "Password reset successfully",
	})
}

// CreateEmployee handles creation of a new employee
func (h *Handler) CreateEmployee(ctx iris.Context) {
	var req reqres.CreateEmployeeRequest
	if err := ctx.ReadJSON(&req); err != nil {
		h.respondWithError(ctx, iris.StatusBadRequest, "Invalid request body")
		return
	}

	if err := h.validate.Struct(req); err != nil {
		h.respondWithError(ctx, iris.StatusBadRequest, "Invalid request data: "+err.Error())
		return
	}

	role := models.RoleStaff
	if req.Role == "ADMIN" {
		role = models.RoleAdmin
	}

	employee, err := h.authService.CreateEmployee(req.Username, req.Name, req.Password, role)
	if err != nil {
		if err == customErrors.ErrUsernameTaken {
			h.respondWithError(ctx, iris.StatusBadRequest, err.Error())
			return
		}
		if err == customErrors.ErrPasswordTooShort {
			h.respondWithError(ctx, iris.StatusBadRequest, err.Error())
			return
		}
		h.logger.Error("Failed to create employee", zap.Error(err))
		h.respondWithError(ctx, iris.StatusInternalServerError, "Internal server error")
		return
	}

	h.respondWithJSON(ctx, iris.StatusCreated, employee.ToResponse())
}

// UpdateEmployeeStatus handles updating an employee's status
func (h *Handler) UpdateEmployeeStatus(ctx iris.Context) {
	idStr := ctx.Params().Get("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		h.respondWithError(ctx, iris.StatusBadRequest, "Invalid employee ID")
		return
	}

	var req reqres.UpdateEmployeeStatusRequest
	if err := ctx.ReadJSON(&req); err != nil {
		h.respondWithError(ctx, iris.StatusBadRequest, "Invalid request body")
		return
	}

	err = h.authService.UpdateEmployeeStatus(id, req.IsActive)
	if err != nil {
		if err == customErrors.ErrEmployeeNotFound {
			h.respondWithError(ctx, iris.StatusNotFound, "Employee not found")
			return
		}
		h.logger.Error("Failed to update employee status", zap.Error(err))
		h.respondWithError(ctx, iris.StatusInternalServerError, "Internal server error")
		return
	}

	h.respondWithJSON(ctx, iris.StatusOK, reqres.MessageResponse{
		Message: "Employee status updated successfully",
	})
}
