package runtime

import (
	"context"
	"errors"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/redis/go-redis/v9"
)

const (
	submissionHashKey  = "cppstudy:submission:%s"
	submissionPendingKey = "cppstudy:submission:pending"
	submissionEventLog = "cppstudy:submission:events"
	submissionSeenKey  = "cppstudy:submission:queued:%s"
	submissionCacheTTL = 7 * 24 * time.Hour
	queueDelay         = 2 * time.Second
	runningDelay       = 2 * time.Second
)

type SubmissionRecord struct {
	ID            string
	ProblemSlug   string
	UserID        string
	SubmitType    string
	Language      string
	Status        string
	Result        string
	Judge0Token   string
	SourceCode    string
	Input         string
	Stdout        string
	CompileOutput string
	CreatedAt     time.Time
	UpdatedAt     time.Time
	FinishedAt    *time.Time
}

func (s *Service) processPendingSubmissions(ctx context.Context, ids []string) error {
	var firstErr error

	for _, id := range ids {
		if err := s.processSubmission(ctx, id); err != nil {
			if firstErr == nil {
				firstErr = err
			}
			log.Printf("worker submission process failed for %s: %v", id, err)
		}
	}

	return firstErr
}

func (s *Service) processSubmission(ctx context.Context, submissionID string) error {
	record, err := s.loadSubmission(ctx, submissionID)
	if err != nil {
		return err
	}

	now := time.Now()

	if s.useRealJudge0() {
		updated, changed, err := s.advanceJudge0Submission(ctx, record, now)
		if err != nil {
			return err
		}
		if !changed {
			return nil
		}

		return s.persistSubmission(ctx, updated)
	}

	updated, changed := advanceMockSubmission(record, now)
	if !changed {
		return nil
	}

	return s.persistSubmission(ctx, updated)
}

func (s *Service) loadSubmission(ctx context.Context, submissionID string) (SubmissionRecord, error) {
	if s.redis != nil {
		record, ok, err := s.loadSubmissionFromRedis(ctx, submissionID)
		if err != nil {
			log.Printf("worker redis submission read failed for %s: %v", submissionID, err)
		} else if ok {
			return record, nil
		}
	}

	if s.db != nil {
		record, ok, err := s.loadSubmissionFromPostgres(ctx, submissionID)
		if err != nil {
			return SubmissionRecord{}, err
		}
		if ok {
			return record, nil
		}
	}

	return SubmissionRecord{}, fmt.Errorf("submission %s not found", submissionID)
}

func (s *Service) persistSubmission(ctx context.Context, record SubmissionRecord) error {
	var persisted bool
	var errs []error

	if s.db != nil {
		if err := s.saveSubmissionToPostgres(ctx, record); err != nil {
			errs = append(errs, err)
		} else {
			persisted = true
		}
	}

	if s.redis != nil {
		if err := s.saveSubmissionToRedis(ctx, record); err != nil {
			errs = append(errs, err)
		} else {
			persisted = true
		}
	}

	if persisted {
		return nil
	}
	if len(errs) == 0 {
		return errors.New("no persistence backend available for worker")
	}

	return errors.Join(errs...)
}

func (s *Service) loadSubmissionFromRedis(ctx context.Context, submissionID string) (SubmissionRecord, bool, error) {
	readCtx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()

	fields, err := s.redis.HGetAll(readCtx, fmt.Sprintf(submissionHashKey, submissionID)).Result()
	if err != nil {
		return SubmissionRecord{}, false, err
	}
	if len(fields) == 0 {
		return SubmissionRecord{}, false, nil
	}

	createdAt, err := time.Parse(time.RFC3339Nano, fields["created_at"])
	if err != nil {
		return SubmissionRecord{}, false, err
	}
	updatedAt, err := time.Parse(time.RFC3339Nano, fields["updated_at"])
	if err != nil {
		return SubmissionRecord{}, false, err
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
		parsed, parseErr := time.Parse(time.RFC3339Nano, finished)
		if parseErr != nil {
			return SubmissionRecord{}, false, parseErr
		}
		record.FinishedAt = &parsed
	}

	return record, true, nil
}

func (s *Service) loadSubmissionFromPostgres(ctx context.Context, submissionID string) (SubmissionRecord, bool, error) {
	readCtx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()

	var record SubmissionRecord
	err := s.db.QueryRow(
		readCtx,
		`select
			id,
			problem_slug,
			coalesce(user_id, ''),
			submit_type,
			language,
			status,
			coalesce(result, ''),
			coalesce(judge0_token, ''),
			source_code,
			stdin,
			stdout,
			compile_output,
			created_at,
			updated_at,
			finished_at
		from submissions
		where id = $1`,
		submissionID,
	).Scan(
		&record.ID,
		&record.ProblemSlug,
		&record.UserID,
		&record.SubmitType,
		&record.Language,
		&record.Status,
		&record.Result,
		&record.Judge0Token,
		&record.SourceCode,
		&record.Input,
		&record.Stdout,
		&record.CompileOutput,
		&record.CreatedAt,
		&record.UpdatedAt,
		&record.FinishedAt,
	)
	if err == nil {
		return record, true, nil
	}
	if err == pgx.ErrNoRows {
		return SubmissionRecord{}, false, nil
	}
	return SubmissionRecord{}, false, err
}

func (s *Service) saveSubmissionToPostgres(ctx context.Context, record SubmissionRecord) error {
	writeCtx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()

	_, err := s.db.Exec(
		writeCtx,
		`insert into submissions
			(id, problem_slug, user_id, submit_type, language, status, result, judge0_token, source_code, stdin, stdout, compile_output, created_at, updated_at, finished_at)
		 values
			($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
		 on conflict (id)
		 do update set
			status = excluded.status,
			result = excluded.result,
			judge0_token = excluded.judge0_token,
			stdout = excluded.stdout,
			compile_output = excluded.compile_output,
			updated_at = excluded.updated_at,
			finished_at = excluded.finished_at`,
		record.ID,
		record.ProblemSlug,
		nullableString(record.UserID),
		defaultString(record.SubmitType, "submit"),
		record.Language,
		record.Status,
		record.Result,
		nullableString(record.Judge0Token),
		record.SourceCode,
		record.Input,
		record.Stdout,
		record.CompileOutput,
		record.CreatedAt,
		record.UpdatedAt,
		record.FinishedAt,
	)

	return err
}

func (s *Service) saveSubmissionToRedis(ctx context.Context, record SubmissionRecord) error {
	writeCtx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()

	hashKey := fmt.Sprintf(submissionHashKey, record.ID)
	finishedAt := ""
	if record.FinishedAt != nil {
		finishedAt = record.FinishedAt.Format(time.RFC3339Nano)
	}

	if err := s.redis.HSet(
		writeCtx,
		hashKey,
		"id", record.ID,
		"problem_slug", record.ProblemSlug,
		"user_id", record.UserID,
		"submit_type", record.SubmitType,
		"language", record.Language,
		"status", record.Status,
		"result", record.Result,
		"judge0_token", record.Judge0Token,
		"source_code", record.SourceCode,
		"stdin", record.Input,
		"stdout", record.Stdout,
		"compile_output", record.CompileOutput,
		"created_at", record.CreatedAt.Format(time.RFC3339Nano),
		"updated_at", record.UpdatedAt.Format(time.RFC3339Nano),
		"finished_at", finishedAt,
	).Err(); err != nil {
		return err
	}
	if err := s.redis.Expire(writeCtx, hashKey, submissionCacheTTL).Err(); err != nil {
		return err
	}
	if err := s.redis.LPush(writeCtx, submissionEventLog, fmt.Sprintf(
		`{"id":"%s","problem":"%s","status":"%s","result":"%s","updatedAt":"%s"}`,
		record.ID,
		record.ProblemSlug,
		record.Status,
		record.Result,
		record.UpdatedAt.Format(time.RFC3339Nano),
	)).Err(); err != nil {
		return err
	}
	if err := s.redis.LTrim(writeCtx, submissionEventLog, 0, 499).Err(); err != nil {
		return err
	}

	switch record.Status {
	case "QUEUED", "RUNNING":
		if err := s.redis.ZAdd(writeCtx, submissionPendingKey, redis.Z{
			Score:  float64(record.CreatedAt.Unix()),
			Member: record.ID,
		}).Err(); err != nil {
			return err
		}
		if record.Status == "QUEUED" {
			if err := s.redis.SetNX(writeCtx, fmt.Sprintf(submissionSeenKey, record.ID), "1", submissionCacheTTL).Err(); err != nil {
				return err
			}
		}
	default:
		if err := s.redis.ZRem(writeCtx, submissionPendingKey, record.ID).Err(); err != nil {
			return err
		}
	}

	return nil
}

func advanceMockSubmission(record SubmissionRecord, now time.Time) (SubmissionRecord, bool) {
	switch record.Status {
	case "QUEUED":
		if now.Sub(record.CreatedAt) < queueDelay {
			return record, false
		}
		record.Status = "RUNNING"
		record.UpdatedAt = now
		return record, true
	case "RUNNING":
		if now.Sub(record.UpdatedAt) < runningDelay {
			return record, false
		}
		stdout, compileOutput, result := simulateSubmission(record)
		record.Status = "FINISHED"
		record.Result = result
		record.Stdout = stdout
		record.CompileOutput = compileOutput
		record.UpdatedAt = now
		record.FinishedAt = &now
		return record, true
	default:
		return record, false
	}
}

func (s *Service) advanceJudge0Submission(ctx context.Context, record SubmissionRecord, now time.Time) (SubmissionRecord, bool, error) {
	if strings.TrimSpace(record.Judge0Token) == "" {
		judgeCtx, cancel := judge0Context(ctx)
		defer cancel()

		token, err := s.submitToJudge0(judgeCtx, record)
		if err != nil {
			return record, false, err
		}

		record.Judge0Token = token
		record.Status = "QUEUED"
		record.UpdatedAt = now
		return record, true, nil
	}

	judgeCtx, cancel := judge0Context(ctx)
	defer cancel()

	response, err := s.fetchJudge0Submission(judgeCtx, record.Judge0Token)
	if err != nil {
		return record, false, err
	}

	updated := mapJudge0Response(record, response, now)
	changed := updated.Status != record.Status ||
		updated.Result != record.Result ||
		updated.Stdout != record.Stdout ||
		updated.CompileOutput != record.CompileOutput ||
		(updated.FinishedAt != nil && record.FinishedAt == nil)

	return updated, changed, nil
}

func defaultString(value, fallback string) string {
	if value == "" {
		return fallback
	}
	return value
}

func nullableString(value string) *string {
	if value == "" {
		return nil
	}
	return &value
}
