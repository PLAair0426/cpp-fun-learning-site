package runtime

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	"cpp-fun-learning-site/worker/internal/config"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

type Service struct {
	cfg        config.Config
	db         *pgxpool.Pool
	redis      *redis.Client
	httpClient *http.Client

	mu       sync.RWMutex
	lastTick time.Time
	queueIDs []string
	lastErr  string
}

type HealthResponse struct {
	Service         string   `json:"service"`
	AppEnv          string   `json:"appEnv"`
	Status          string   `json:"status"`
	Postgres        bool     `json:"postgres"`
	Redis           bool     `json:"redis"`
	EnableMockJudge bool     `json:"enableMockJudge"`
	PollInterval    string   `json:"pollInterval"`
	LastTick        string   `json:"lastTick,omitempty"`
	QueueDepth      int      `json:"queueDepth"`
	PendingIDs      []string `json:"pendingIds"`
	LastError       string   `json:"lastError,omitempty"`
}

func New(cfg config.Config) *Service {
	return &Service{
		cfg: cfg,
		httpClient: &http.Client{
			Timeout: cfg.HTTPTimeout,
		},
	}
}

func (s *Service) Run(ctx context.Context) error {
	if s.cfg.PostgresDSN != "" {
		s.connectPostgresWithRetry(ctx, s.cfg.PostgresDSN)
	}
	if s.cfg.RedisAddr != "" {
		s.connectRedisWithRetry(ctx, s.cfg.RedisAddr)
	}

	go s.pollLoop(ctx)

	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", s.handleHealth)

	server := &http.Server{
		Addr:              ":" + s.cfg.Port,
		Handler:           mux,
		ReadHeaderTimeout: 5 * time.Second,
	}

	go func() {
		<-ctx.Done()
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = server.Shutdown(shutdownCtx)
	}()

	log.Printf("cpp learning worker listening on :%s (%s)", s.cfg.Port, s.cfg.AppEnv)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		return err
	}

	return nil
}

func (s *Service) Close() {
	if s.redis != nil {
		_ = s.redis.Close()
	}
	if s.db != nil {
		s.db.Close()
	}
}

func (s *Service) handleHealth(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	_ = json.NewEncoder(w).Encode(s.healthSnapshot())
}

func (s *Service) healthSnapshot() HealthResponse {
	s.mu.RLock()
	defer s.mu.RUnlock()

	response := HealthResponse{
		Service:         "cpp-learning-worker",
		AppEnv:          s.cfg.AppEnv,
		Status:          "ok",
		Postgres:        s.db != nil,
		Redis:           s.redis != nil,
		EnableMockJudge: s.cfg.EnableMockJudge,
		PollInterval:    s.cfg.PollInterval.String(),
		QueueDepth:      len(s.queueIDs),
		PendingIDs:      append([]string(nil), s.queueIDs...),
		LastError:       s.lastErr,
	}

	if !s.lastTick.IsZero() {
		response.LastTick = s.lastTick.Format(time.RFC3339)
	}
	if s.lastErr != "" {
		response.Status = "degraded"
	}

	return response
}

func (s *Service) pollLoop(ctx context.Context) {
	ticker := time.NewTicker(s.cfg.PollInterval)
	defer ticker.Stop()

	s.pollOnce(ctx)

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			s.pollOnce(ctx)
		}
	}
}

func (s *Service) pollOnce(ctx context.Context) {
	queueIDs, _, err := s.readPendingQueue(ctx)
	if err != nil {
		s.setSnapshot(time.Now(), nil, err)
		log.Printf("worker queue scan failed: %v", err)
		return
	}

	processErr := s.processPendingSubmissions(ctx, queueIDs)

	queueIDs, queueDepth, err := s.readPendingQueue(ctx)
	if err != nil {
		s.setSnapshot(time.Now(), nil, err)
		log.Printf("worker queue refresh failed: %v", err)
		return
	}

	if err := s.writeHeartbeat(ctx, queueDepth); err != nil {
		s.setSnapshot(time.Now(), queueIDs, err)
		log.Printf("worker heartbeat update failed: %v", err)
		return
	}

	s.setSnapshot(time.Now(), queueIDs, processErr)
	if processErr != nil {
		log.Printf("worker processed queue with partial failures: %v", processErr)
		return
	}
	log.Printf("worker heartbeat refreshed; pending submissions=%d", queueDepth)
}

func (s *Service) readPendingQueue(ctx context.Context) ([]string, int, error) {
	if s.redis == nil {
		return nil, 0, nil
	}

	scanCtx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()

	ids, err := s.redis.ZRange(scanCtx, submissionPendingKey, 0, 4).Result()
	if err != nil {
		return nil, 0, err
	}

	count, err := s.redis.ZCard(scanCtx, submissionPendingKey).Result()
	if err != nil {
		return nil, 0, err
	}

	return ids, int(count), nil
}

func (s *Service) writeHeartbeat(ctx context.Context, queueDepth int) error {
	if s.redis == nil {
		return nil
	}

	heartbeatCtx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()

	if err := s.redis.HSet(
		heartbeatCtx,
		s.cfg.HeartbeatKey,
		"service", "cpp-learning-worker",
		"pid", os.Getpid(),
		"queueDepth", queueDepth,
		"mockJudge", s.cfg.EnableMockJudge,
		"judge0URL", s.cfg.Judge0URL,
		"timestamp", time.Now().Format(time.RFC3339Nano),
		"pollInterval", s.cfg.PollInterval.String(),
	).Err(); err != nil {
		return err
	}

	return s.redis.Expire(heartbeatCtx, s.cfg.HeartbeatKey, s.cfg.HeartbeatTTL).Err()
}

func (s *Service) setSnapshot(tickAt time.Time, queueIDs []string, err error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.lastTick = tickAt
	s.queueIDs = append([]string(nil), queueIDs...)
	if err != nil {
		s.lastErr = err.Error()
		return
	}
	s.lastErr = ""
}

func (s *Service) connectPostgresWithRetry(ctx context.Context, dsn string) {
	var lastErr error

	for attempt := 1; attempt <= 5; attempt++ {
		connectCtx, cancel := context.WithTimeout(ctx, 8*time.Second)
		db, err := pgxpool.New(connectCtx, dsn)
		if err == nil {
			err = db.Ping(connectCtx)
		}
		cancel()

		if err == nil {
			s.db = db
			log.Printf("worker postgres enabled on attempt %d", attempt)
			return
		}

		lastErr = err
		log.Printf("worker postgres unavailable on attempt %d, retrying: %v", attempt, err)
		time.Sleep(2 * time.Second)
	}

	s.setSnapshot(time.Now(), nil, fmt.Errorf("postgres unavailable: %w", lastErr))
}

func (s *Service) connectRedisWithRetry(ctx context.Context, addr string) {
	var lastErr error

	for attempt := 1; attempt <= 5; attempt++ {
		client := redis.NewClient(&redis.Options{Addr: addr})

		connectCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
		err := client.Ping(connectCtx).Err()
		cancel()

		if err == nil {
			s.redis = client
			log.Printf("worker redis enabled on attempt %d", attempt)
			return
		}

		lastErr = err
		_ = client.Close()
		log.Printf("worker redis unavailable on attempt %d, retrying: %v", attempt, err)
		time.Sleep(2 * time.Second)
	}

	s.setSnapshot(time.Now(), nil, fmt.Errorf("redis unavailable: %w", lastErr))
}
