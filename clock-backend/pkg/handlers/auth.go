package handlers

import (
	"github.com/kataras/iris/v12"
	"go.uber.org/zap"

	customErrors "github.com/jim/clock-backend/pkg/errors"
	"github.com/jim/clock-backend/pkg/middleware"
	"github.com/jim/clock-backend/pkg/reqres"
)

// Login handles user login
func (h *Handler) Login(ctx iris.Context) {
	var req reqres.LoginRequest

	if err := ctx.ReadJSON(&req); err != nil {
		h.logger.Warn("Invalid login request", zap.Error(err))
		h.respondWithError(ctx, iris.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate request
	if err := h.validate.Struct(req); err != nil {
		h.logger.Warn("Login validation failed", zap.Error(err))
		h.respondWithError(ctx, iris.StatusBadRequest, "Username and password are required")
		return
	}

	// Authenticate user
	employee, accessToken, refreshToken, err := h.authService.Login(req.Username, req.Password)
	if err != nil {
		if err == customErrors.ErrInvalidCredentials || err == customErrors.ErrEmployeeNotActive {
			h.respondWithError(ctx, iris.StatusUnauthorized, err.Error())
			return
		}
		h.logger.Error("Login error", zap.Error(err))
		h.respondWithError(ctx, iris.StatusInternalServerError, "Internal server error")
		return
	}

	// Return response
	response := reqres.LoginResponse{
		Token:        accessToken,
		RefreshToken: refreshToken,
		Employee:     employee.ToResponse(),
	}

	h.respondWithJSON(ctx, iris.StatusOK, response)
}

// RefreshToken handles token refresh
func (h *Handler) RefreshToken(ctx iris.Context) {
	var req reqres.RefreshTokenRequest

	if err := ctx.ReadJSON(&req); err != nil {
		h.logger.Warn("Invalid refresh token request", zap.Error(err))
		h.respondWithError(ctx, iris.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate request
	if err := h.validate.Struct(req); err != nil {
		h.respondWithError(ctx, iris.StatusBadRequest, "Refresh token is required")
		return
	}

	// Refresh tokens
	accessToken, refreshToken, err := h.authService.RefreshToken(req.RefreshToken)
	if err != nil {
		if err == customErrors.ErrInvalidToken || err == customErrors.ErrEmployeeNotActive {
			h.respondWithError(ctx, iris.StatusUnauthorized, err.Error())
			return
		}
		h.logger.Error("Token refresh error", zap.Error(err))
		h.respondWithError(ctx, iris.StatusInternalServerError, "Internal server error")
		return
	}

	// Return response
	response := reqres.RefreshTokenResponse{
		Token:        accessToken,
		RefreshToken: refreshToken,
	}

	h.respondWithJSON(ctx, iris.StatusOK, response)
}

// ChangePassword handles password change
func (h *Handler) ChangePassword(ctx iris.Context) {
	employeeID := middleware.GetEmployeeID(ctx)

	var req reqres.ChangePasswordRequest

	if err := ctx.ReadJSON(&req); err != nil {
		h.logger.Warn("Invalid change password request", zap.Error(err))
		h.respondWithError(ctx, iris.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate request
	if err := h.validate.Struct(req); err != nil {
		h.respondWithError(ctx, iris.StatusBadRequest, "Current password and new password are required")
		return
	}

	// Change password
	err := h.authService.ChangePassword(employeeID, req.CurrentPassword, req.NewPassword)
	if err != nil {
		if err == customErrors.ErrInvalidPassword || err == customErrors.ErrPasswordTooShort {
			h.respondWithError(ctx, iris.StatusBadRequest, err.Error())
			return
		}
		h.logger.Error("Password change error", zap.Error(err), zap.Int("employee_id", employeeID))
		h.respondWithError(ctx, iris.StatusInternalServerError, "Internal server error")
		return
	}

	// Return response
	response := reqres.MessageResponse{
		Message: "Password changed successfully",
	}

	h.respondWithJSON(ctx, iris.StatusOK, response)
}

// Logout handles user logout
func (h *Handler) Logout(ctx iris.Context) {
	// For JWT-based auth, logout is mainly handled on the client side
	// Server-side logout would require token blacklisting (future enhancement)

	response := reqres.MessageResponse{
		Message: "Logged out successfully",
	}

	h.respondWithJSON(ctx, iris.StatusOK, response)
}
