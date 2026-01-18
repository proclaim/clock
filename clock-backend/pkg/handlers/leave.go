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

// CreateLeave handles creating a new leave record
func (h *Handler) CreateLeave(ctx iris.Context) {
	employeeID := middleware.GetEmployeeID(ctx)

	var req reqres.CreateLeaveRequest
	if err := ctx.ReadJSON(&req); err != nil {
		h.respondWithError(ctx, iris.StatusBadRequest, "Invalid request body")
		return
	}

	if err := h.validate.Struct(req); err != nil {
		h.respondWithError(ctx, iris.StatusBadRequest, "Start date and end date are required")
		return
	}

	// Parse dates
	startDate, err := time.Parse("2006-01-02", req.StartDate)
	if err != nil {
		h.respondWithError(ctx, iris.StatusBadRequest, "Invalid start date format (use YYYY-MM-DD)")
		return
	}

	endDate, err := time.Parse("2006-01-02", req.EndDate)
	if err != nil {
		h.respondWithError(ctx, iris.StatusBadRequest, "Invalid end date format (use YYYY-MM-DD)")
		return
	}

	leave, err := h.leaveService.CreateLeave(employeeID, startDate, endDate, req.Note)
	if err != nil {
		if err == customErrors.ErrInvalidDateRange {
			h.respondWithError(ctx, iris.StatusBadRequest, "End date must be on or after start date")
			return
		}
		if err == customErrors.ErrLeaveOverlap {
			h.respondWithError(ctx, iris.StatusBadRequest, err.Error())
			return
		}
		h.logger.Error("Failed to create leave", zap.Error(err), zap.Int("employee_id", employeeID))
		h.respondWithError(ctx, iris.StatusInternalServerError, "Internal server error")
		return
	}

	h.respondWithJSON(ctx, iris.StatusCreated, reqres.LeaveResponse{Leave: leave.ToResponse()})
}

// GetLeaves handles retrieving leave records for the current employee
func (h *Handler) GetLeaves(ctx iris.Context) {
	employeeID := middleware.GetEmployeeID(ctx)

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

	leaves, err := h.leaveService.GetLeaves(employeeID, year, month)
	if err != nil {
		h.logger.Error("Failed to get leaves", zap.Error(err), zap.Int("employee_id", employeeID))
		h.respondWithError(ctx, iris.StatusInternalServerError, "Internal server error")
		return
	}

	leaveResponses := make([]*models.LeaveResponse, len(leaves))
	for i, leave := range leaves {
		leaveResponses[i] = leave.ToResponse()
	}

	h.respondWithJSON(ctx, iris.StatusOK, reqres.LeavesResponse{
		Leaves: leaveResponses,
		Total:  len(leaveResponses),
	})
}
