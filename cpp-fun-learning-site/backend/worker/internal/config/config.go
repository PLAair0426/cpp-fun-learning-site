package config

import (
	"os"
	"strconv"
	"time"
)

type Config struct {
	AppEnv           string
	Port             string
	PostgresDSN      string
	RedisAddr        string
	Judge0URL        string
	Judge0AuthToken  string
	Judge0AuthHeader string
	CppLanguageID    int
	CLanguageID      int
	EnableMockJudge  bool
	PollInterval     time.Duration
	HeartbeatKey     string
	HeartbeatTTL     time.Duration
	HTTPTimeout      time.Duration
}

func Load() Config {
	return Config{
		AppEnv:          envOr("APP_ENV", "development"),
		Port:            envOr("WORKER_PORT", "8081"),
		PostgresDSN:     envOr("POSTGRES_DSN", ""),
		RedisAddr:       envOr("REDIS_ADDR", ""),
		Judge0URL:       envOr("JUDGE0_URL", ""),
		Judge0AuthToken: envOr("JUDGE0_AUTH_TOKEN", ""),
		Judge0AuthHeader: envOr("JUDGE0_AUTH_HEADER", "X-Auth-Token"),
		CppLanguageID:   intEnvOr("JUDGE0_CPP_LANGUAGE_ID", 54),
		CLanguageID:     intEnvOr("JUDGE0_C_LANGUAGE_ID", 50),
		EnableMockJudge: envOr("ENABLE_MOCK_JUDGE", "true") != "false",
		PollInterval:    durationEnvOr("WORKER_POLL_INTERVAL", 5*time.Second),
		HeartbeatKey:    envOr("WORKER_HEARTBEAT_KEY", "cppstudy:worker:heartbeat"),
		HeartbeatTTL:    durationEnvOr("WORKER_HEARTBEAT_TTL", 20*time.Second),
		HTTPTimeout:     durationEnvOr("WORKER_HTTP_TIMEOUT", 15*time.Second),
	}
}

func envOr(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}

func durationEnvOr(key string, fallback time.Duration) time.Duration {
	raw := os.Getenv(key)
	if raw == "" {
		return fallback
	}

	parsed, err := time.ParseDuration(raw)
	if err != nil {
		return fallback
	}

	return parsed
}

func intEnvOr(key string, fallback int) int {
	raw := os.Getenv(key)
	if raw == "" {
		return fallback
	}

	parsed, err := strconv.Atoi(raw)
	if err != nil {
		return fallback
	}

	return parsed
}
