package store

import (
	"context"
	"fmt"
	"log"
	"strconv"
	"time"

	"github.com/redis/go-redis/v9"
)

const (
	leaderboardKey     = "cppstudy:leaderboard:xp"
	leaderboardProfile = "cppstudy:leaderboard:profile:%s"
	submissionHashKey  = "cppstudy:submission:%s"
	submissionPending  = "cppstudy:submission:pending"
	submissionEventLog = "cppstudy:submission:events"
	submissionSeenKey  = "cppstudy:submission:queued:%s"
	submissionCacheTTL = 7 * 24 * time.Hour
)

func (s *Store) ConnectRedis(ctx context.Context, addr string) error {
	client := redis.NewClient(&redis.Options{
		Addr: addr,
	})

	pingCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	if err := client.Ping(pingCtx).Err(); err != nil {
		_ = client.Close()
		return err
	}

	s.redis = client
	if err := s.seedLeaderboardCache(ctx); err != nil {
		_ = client.Close()
		s.redis = nil
		return err
	}

	return nil
}

func (s *Store) UsingRedis() bool {
	return s.redis != nil
}

func (s *Store) QueueDepth() int64 {
	if s.redis == nil {
		return 0
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	count, err := s.redis.ZCard(ctx, submissionPending).Result()
	if err != nil {
		log.Printf("redis queue depth read failed: %v", err)
		return 0
	}

	return count
}

func (s *Store) seedLeaderboardCache(ctx context.Context) error {
	if s.redis == nil {
		return nil
	}

	size, err := s.redis.ZCard(ctx, leaderboardKey).Result()
	if err != nil {
		return err
	}
	if size > 0 {
		return nil
	}

	members := make([]redis.Z, 0, len(s.leaderboard))
	pipe := s.redis.TxPipeline()

	for _, entry := range s.leaderboard {
		members = append(members, redis.Z{
			Score:  float64(entry.XP),
			Member: entry.Name,
		})
		pipe.HSet(ctx, fmt.Sprintf(leaderboardProfile, entry.Name), map[string]any{
			"name":   entry.Name,
			"title":  entry.Title,
			"streak": entry.Streak,
		})
	}

	if len(members) > 0 {
		pipe.ZAdd(ctx, leaderboardKey, members...)
	}

	_, err = pipe.Exec(ctx)
	return err
}

func (s *Store) loadLeaderboardCache() ([]LeaderboardEntry, bool) {
	if s.redis == nil {
		return nil, false
	}

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	result, err := s.redis.ZRevRangeWithScores(ctx, leaderboardKey, 0, 9).Result()
	if err != nil {
		log.Printf("redis leaderboard read failed: %v", err)
		return nil, false
	}
	if len(result) == 0 {
		return nil, false
	}

	entries := make([]LeaderboardEntry, 0, len(result))
	for index, item := range result {
		name, ok := item.Member.(string)
		if !ok {
			continue
		}

		fields, err := s.redis.HGetAll(ctx, fmt.Sprintf(leaderboardProfile, name)).Result()
		if err != nil {
			log.Printf("redis leaderboard profile read failed for %s: %v", name, err)
			continue
		}

		streak, _ := strconv.Atoi(fields["streak"])
		entry := LeaderboardEntry{
			Rank:   index + 1,
			Name:   fields["name"],
			XP:     int(item.Score),
			Streak: streak,
			Title:  fields["title"],
		}
		if entry.Name == "" {
			entry.Name = name
		}
		entries = append(entries, entry)
	}

	return entries, len(entries) > 0
}

func (s *Store) cacheSubmission(record SubmissionRecord) bool {
	if s.redis == nil {
		return false
	}

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	pipe := s.redis.TxPipeline()
	hashKey := fmt.Sprintf(submissionHashKey, record.ID)
	payload := map[string]any{
		"id":             record.ID,
		"problem_slug":   record.ProblemSlug,
		"user_id":        record.UserID,
		"submit_type":    record.SubmitType,
		"language":       record.Language,
		"status":         record.Status,
		"result":         record.Result,
		"judge0_token":   record.Judge0Token,
		"source_code":    record.SourceCode,
		"stdin":          record.Input,
		"stdout":         record.Stdout,
		"compile_output": record.CompileOutput,
		"created_at":     record.CreatedAt.Format(time.RFC3339Nano),
		"updated_at":     record.UpdatedAt.Format(time.RFC3339Nano),
	}
	if record.FinishedAt != nil {
		payload["finished_at"] = record.FinishedAt.Format(time.RFC3339Nano)
	} else {
		payload["finished_at"] = ""
	}

	pipe.HSet(ctx, hashKey, payload)
	pipe.Expire(ctx, hashKey, submissionCacheTTL)
	pipe.LPush(ctx, submissionEventLog, fmt.Sprintf(
		`{"id":"%s","problem":"%s","status":"%s","result":"%s","updatedAt":"%s"}`,
		record.ID,
		record.ProblemSlug,
		record.Status,
		record.Result,
		record.UpdatedAt.Format(time.RFC3339Nano),
	))
	pipe.LTrim(ctx, submissionEventLog, 0, 499)

	switch record.Status {
	case "QUEUED", "RUNNING":
		pipe.ZAdd(ctx, submissionPending, redis.Z{
			Score:  float64(record.CreatedAt.Unix()),
			Member: record.ID,
		})
		if record.Status == "QUEUED" {
			pipe.SetNX(ctx, fmt.Sprintf(submissionSeenKey, record.ID), "1", submissionCacheTTL)
		}
	default:
		pipe.ZRem(ctx, submissionPending, record.ID)
	}

	if _, err := pipe.Exec(ctx); err != nil {
		log.Printf("redis submission cache failed for %s: %v", record.ID, err)
		return false
	}

	return true
}

func (s *Store) loadSubmissionCache(id string) (SubmissionRecord, bool) {
	if s.redis == nil {
		return SubmissionRecord{}, false
	}

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	fields, err := s.redis.HGetAll(ctx, fmt.Sprintf(submissionHashKey, id)).Result()
	if err != nil {
		log.Printf("redis submission read failed for %s: %v", id, err)
		return SubmissionRecord{}, false
	}
	if len(fields) == 0 {
		return SubmissionRecord{}, false
	}

	createdAt, err := time.Parse(time.RFC3339Nano, fields["created_at"])
	if err != nil {
		return SubmissionRecord{}, false
	}
	updatedAt, err := time.Parse(time.RFC3339Nano, fields["updated_at"])
	if err != nil {
		return SubmissionRecord{}, false
	}

	record := SubmissionRecord{
		ID:            fields["id"],
		ProblemSlug:   fields["problem_slug"],
		UserID:        fields["user_id"],
		SubmitType:    fields["submit_type"],
		Language:      fields["language"],
		Status:        fields["status"],
		Result:        fields["result"],
		Judge0Token:   fields["judge0_token"],
		SourceCode:    fields["source_code"],
		Input:         fields["stdin"],
		Stdout:        fields["stdout"],
		CompileOutput: fields["compile_output"],
		CreatedAt:     createdAt,
		UpdatedAt:     updatedAt,
	}
	if finished := fields["finished_at"]; finished != "" {
		if parsed, parseErr := time.Parse(time.RFC3339Nano, finished); parseErr == nil {
			record.FinishedAt = &parsed
		}
	}

	return record, true
}
