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

// GetAdminLeaves returns all leave records with pagination (admin only)
func (h *Handler) GetAdminLeaves(ctx iris.Context) {
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
	leaves, total, err := h.adminLeaveService.GetAllLeaves(
		startDate, endDate, employeeID, perPage, offset,
	)
	if err != nil {
		h.logger.Error("Failed to get admin leave records", zap.Error(err))
		h.respondWithError(ctx, iris.StatusInternalServerError, "Internal server error")
		return
	}

	// Build response
	leaveResponses := make([]*models.LeaveWithEmployeeResponse, len(leaves))
	for i, leave := range leaves {
		leaveResponses[i] = leave.ToResponse()
	}

	response := reqres.AdminLeavesResponse{
		Leaves:  leaveResponses,
		Total:   total,
		Page:    page,
		PerPage: perPage,
	}

	h.respondWithJSON(ctx, iris.StatusOK, response)
}

// UpdateAdminLeave updates a leave record (admin only)
func (h *Handler) UpdateAdminLeave(ctx iris.Context) {
	adminID := middleware.GetEmployeeID(ctx)

	leaveIDStr := ctx.Params().Get("id")
	leaveID, err := strconv.Atoi(leaveIDStr)
	if err != nil {
		h.respondWithError(ctx, iris.StatusBadRequest, "Invalid leave ID")
		return
	}

	var req reqres.UpdateLeaveRequest
	if err := ctx.ReadJSON(&req); err != nil {
		h.respondWithError(ctx, iris.StatusBadRequest, "Invalid request body")
		return
	}

	// Parse dates if provided
	var startDate, endDate *time.Time

	if req.StartDate != nil {
		if t, err := time.Parse("2006-01-02", *req.StartDate); err == nil {
			startDate = &t
		} else {
			h.respondWithError(ctx, iris.StatusBadRequest, "Invalid start date format (use YYYY-MM-DD)")
			return
		}
	}

	if req.EndDate != nil {
		if t, err := time.Parse("2006-01-02", *req.EndDate); err == nil {
			endDate = &t
		} else {
			h.respondWithError(ctx, iris.StatusBadRequest, "Invalid end date format (use YYYY-MM-DD)")
			return
		}
	}

	// Update leave
	leave, err := h.adminLeaveService.UpdateLeave(leaveID, startDate, endDate, req.Note, adminID)
	if err != nil {
		if err == customErrors.ErrRecordNotFound {
			h.respondWithError(ctx, iris.StatusNotFound, "Leave not found")
			return
		}
		if err == customErrors.ErrInvalidDateRange {
			h.respondWithError(ctx, iris.StatusBadRequest, "End date must be on or after start date")
			return
		}
		if err == customErrors.ErrLeaveOverlap {
			h.respondWithError(ctx, iris.StatusBadRequest, err.Error())
			return
		}
		h.logger.Error("Failed to update leave", zap.Error(err), zap.Int("leave_id", leaveID))
		h.respondWithError(ctx, iris.StatusInternalServerError, "Internal server error")
		return
	}

	h.respondWithJSON(ctx, iris.StatusOK, reqres.LeaveResponse{Leave: leave.ToResponse()})
}

// DeleteAdminLeave soft deletes a leave record (admin only)
func (h *Handler) DeleteAdminLeave(ctx iris.Context) {
	adminID := middleware.GetEmployeeID(ctx)

	leaveIDStr := ctx.Params().Get("id")
	leaveID, err := strconv.Atoi(leaveIDStr)
	if err != nil {
		h.respondWithError(ctx, iris.StatusBadRequest, "Invalid leave ID")
		return
	}

	err = h.adminLeaveService.DeleteLeave(leaveID, adminID)
	if err != nil {
		if err == customErrors.ErrRecordNotFound {
			h.respondWithError(ctx, iris.StatusNotFound, "Leave not found")
			return
		}
		h.logger.Error("Failed to delete leave", zap.Error(err), zap.Int("leave_id", leaveID))
		h.respondWithError(ctx, iris.StatusInternalServerError, "Internal server error")
		return
	}

	h.respondWithJSON(ctx, iris.StatusOK, reqres.MessageResponse{
		Message: "Leave deleted successfully",
	})
}
