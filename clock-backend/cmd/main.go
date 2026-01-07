package main

import (
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"github.com/kataras/iris/v12"
	"go.uber.org/zap"

	"github.com/jim/clock-backend/config"
	"github.com/jim/clock-backend/pkg/database"
	"github.com/jim/clock-backend/pkg/handlers"
	"github.com/jim/clock-backend/pkg/services"
	"github.com/jim/clock-backend/pkg/utils"
	"github.com/jim/clock-backend/router"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		fmt.Printf("Failed to load configuration: %v\n", err)
		os.Exit(1)
	}

	// Initialize logger
	logger, err := utils.NewLogger(cfg.Server.ENV, cfg.Server.LogLevel)
	if err != nil {
		fmt.Printf("Failed to initialize logger: %v\n", err)
		os.Exit(1)
	}
	defer logger.Sync()

	logger.Info("Starting Clock Backend",
		zap.String("env", cfg.Server.ENV),
		zap.String("port", cfg.Server.Port),
	)

	// Connect to database
	db, err := database.Connect(&cfg.Database, logger)
	if err != nil {
		logger.Fatal("Failed to connect to database", zap.Error(err))
	}
	defer db.Close()

	// Initialize services
	authService := services.NewAuthService(db, cfg, logger)
	attendanceService := services.NewAttendanceService(db, cfg, logger)

	// Initialize handlers
	handler := handlers.NewHandler(authService, attendanceService, cfg, logger)

	// Create Iris app
	app := iris.New()

	// Disable startup log banner in production
	if cfg.Server.ENV == "production" || cfg.Server.ENV == "staging" {
		app.Configure(iris.WithoutStartupLog)
	}

	// Setup routes
	router.Setup(app, handler, cfg, logger)

	// Graceful shutdown
	go func() {
		sigChan := make(chan os.Signal, 1)
		signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)
		<-sigChan

		logger.Info("Shutting down server...")
		app.Shutdown(nil)
	}()

	// Start server
	addr := fmt.Sprintf(":%s", cfg.Server.Port)
	logger.Info("Server listening", zap.String("address", addr))

	if err := app.Listen(addr); err != nil {
		logger.Fatal("Server failed to start", zap.Error(err))
	}
}
