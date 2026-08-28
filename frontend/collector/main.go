package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"
)

func main() {
	logger := log.New(os.Stdout, "[collector] ", log.LstdFlags|log.LUTC)

	cfg := loadConfig(logger)

	storage := NewFileStorage(cfg.JSONLPath)

	var notifier Notifier
	if cfg.TelegramBotToken != "" && cfg.TelegramChatID != "" {
		notifier = NewTelegramNotifier(cfg.TelegramBotToken, cfg.TelegramChatID)
	} else {
		logger.Println("telegram credentials missing — notifications disabled")
		notifier = NoopNotifier{}
	}

	limiter := NewWindowLimiter(cfg.RateLimitPerHour, time.Hour, time.Now)

	h := NewHandler(Deps{
		Storage:  storage,
		Notifier: notifier,
		Limiter:  limiter,
		Logger:   logger,
	})

	mux := http.NewServeMux()
	mux.Handle("POST /contact", h)
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})

	srv := &http.Server{
		Addr:              cfg.Addr,
		Handler:           mux,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       30 * time.Second,
	}

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	go func() {
		logger.Printf("listening on %s, jsonl=%s", cfg.Addr, cfg.JSONLPath)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.Fatalf("server: %v", err)
		}
	}()

	<-ctx.Done()
	logger.Println("shutting down")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		logger.Printf("shutdown: %v", err)
	}
}

type config struct {
	Addr             string
	JSONLPath        string
	TelegramBotToken string
	TelegramChatID   string
	RateLimitPerHour int
}

func loadConfig(logger *log.Logger) config {
	c := config{
		Addr:             envOr("ADDR", ":8081"),
		JSONLPath:        envOr("JSONL_PATH", "/data/contacts.jsonl"),
		TelegramBotToken: os.Getenv("TELEGRAM_BOT_TOKEN"),
		TelegramChatID:   os.Getenv("TELEGRAM_CHAT_ID"),
		RateLimitPerHour: 10,
	}
	if v := os.Getenv("RATE_LIMIT_PER_IP_PER_HOUR"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			c.RateLimitPerHour = n
		} else {
			logger.Printf("invalid RATE_LIMIT_PER_IP_PER_HOUR=%q, using %d", v, c.RateLimitPerHour)
		}
	}
	return c
}

func envOr(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
