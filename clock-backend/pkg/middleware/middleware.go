package middleware

import (
	"slices"
	"strings"
	"time"

	"github.com/iris-contrib/middleware/cors"
	"github.com/kataras/iris/v12"
	"go.uber.org/zap"

	"github.com/jim/clock-backend/config"
	customErrors "github.com/jim/clock-backend/pkg/errors"
	"github.com/jim/clock-backend/pkg/reqres"
	"github.com/jim/clock-backend/pkg/utils"
)

const (
	EmployeeIDKey = "employee_id"
	UsernameKey   = "username"
	RoleKey       = "role"
)

// JWTAuthMiddleware validates JWT tokens and injects employee info into context
func JWTAuthMiddleware(cfg *config.Config, logger *zap.Logger) iris.Handler {
	return func(ctx iris.Context) {
		authHeader := ctx.GetHeader("Authorization")
		if authHeader == "" {
			logger.Warn("Missing Authorization header")
			ctx.StatusCode(iris.StatusUnauthorized)
			ctx.JSON(reqres.ErrorResponse{
				Error: customErrors.ErrUnauthorized.Error(),
			})
			return
		}

		// Extract token from "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			logger.Warn("Invalid Authorization header format")
			ctx.StatusCode(iris.StatusUnauthorized)
			ctx.JSON(reqres.ErrorResponse{
				Error: customErrors.ErrUnauthorized.Error(),
			})
			return
		}

		token := parts[1]

		// Validate token
		claims, err := utils.ValidateAccessToken(token, &cfg.JWT)
		if err != nil {
			logger.Warn("Invalid token", zap.Error(err))
			ctx.StatusCode(iris.StatusUnauthorized)
			ctx.JSON(reqres.ErrorResponse{
				Error: customErrors.ErrInvalidToken.Error(),
			})
			return
		}

		// Inject claims into context
		ctx.Values().Set(EmployeeIDKey, claims.EmployeeID)
		ctx.Values().Set(UsernameKey, claims.Username)
		ctx.Values().Set(RoleKey, claims.Role)

		ctx.Next()
	}
}

// SetupCORS configures CORS middleware using iris-contrib/cors
func SetupCORS(app *iris.Application, cfg *config.Config) {
	// Allow specific origins (frontend URLs)
	allowedOrigins := []string{
		"http://localhost:3000",
		"http://127.0.0.1:3000",
		"http://localhost:8002",
		"http://192.168.0.77:8002",
		"http://192.168.0.77",
		"https://192.168.0.77",
		"http://time.tcode.tw",
		"https://time.tcode.tw",
	}

	// Add configured frontend URL if different from defaults
	if cfg.Server.FrontendURL != "" && !slices.Contains(allowedOrigins, cfg.Server.FrontendURL) {
		allowedOrigins = append(allowedOrigins, cfg.Server.FrontendURL)
		// Also add HTTPS version
		httpsURL := "https" + cfg.Server.FrontendURL[4:]
		if !slices.Contains(allowedOrigins, httpsURL) {
			allowedOrigins = append(allowedOrigins, httpsURL)
		}
	}

	crs := cors.New(cors.Options{
		AllowedOrigins:   allowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization", "Accept"},
		AllowCredentials: true,
		MaxAge:           86400,
		Debug:            false,
	})

	app.UseRouter(crs)
	app.AllowMethods(iris.MethodOptions)
}

// SecurityHeadersMiddleware adds security headers
func SecurityHeadersMiddleware() iris.Handler {
	return func(ctx iris.Context) {
		ctx.Header("X-Content-Type-Options", "nosniff")
		ctx.Header("X-Frame-Options", "DENY")
		ctx.Header("X-XSS-Protection", "1; mode=block")
		ctx.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains")

		ctx.Next()
	}
}

// LoggingMiddleware logs HTTP requests
func LoggingMiddleware(logger *zap.Logger) iris.Handler {
	return func(ctx iris.Context) {
		start := time.Now()

		ctx.Next()

		duration := time.Since(start)
		statusCode := ctx.GetStatusCode()

		logger.Info("HTTP Request",
			zap.String("method", ctx.Method()),
			zap.String("path", ctx.Path()),
			zap.Int("status", statusCode),
			zap.Duration("duration", duration),
			zap.String("ip", ctx.RemoteAddr()),
		)
	}
}

// RateLimitMiddleware implements basic rate limiting (simplified version)
// For production, consider using a more robust solution like Redis-based rate limiting
func RateLimitMiddleware() iris.Handler {
	// This is a simplified version
	// In production, use a proper rate limiting library with Redis
	return func(ctx iris.Context) {
		// TODO: Implement proper rate limiting
		// For now, just pass through
		ctx.Next()
	}
}

// GetEmployeeID retrieves the employee ID from the context
func GetEmployeeID(ctx iris.Context) int {
	if id, ok := ctx.Values().Get(EmployeeIDKey).(int); ok {
		return id
	}
	return 0
}

// GetUsername retrieves the username from the context
func GetUsername(ctx iris.Context) string {
	if username, ok := ctx.Values().Get(UsernameKey).(string); ok {
		return username
	}
	return ""
}
