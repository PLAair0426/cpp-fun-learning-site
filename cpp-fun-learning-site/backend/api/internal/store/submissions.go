package store

import (
	"context"
	"log"
	"sort"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
)

func (s *Store) SaveSubmission(record SubmissionRecord) bool {
	if record.CreatedAt.IsZero() {
		record.CreatedAt = time.Now()
	}
	if record.UpdatedAt.IsZero() {
		record.UpdatedAt = time.Now()
	}

	persisted := false

	if s.db != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
		defer cancel()

		_, err := s.db.Exec(
			ctx,
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
		if err != nil {
			log.Printf("postgres submission save failed for %s: %v", record.ID, err)
		} else {
			persisted = true
		}
	}

	if s.cacheSubmission(record) {
		persisted = true
	}

	if s.db == nil {
		s.mu.Lock()
		s.submissions[record.ID] = record
		s.mu.Unlock()
		persisted = true
	}

	return persisted
}

func (s *Store) FindSubmission(id string) (SubmissionRecord, bool) {
	if s.db != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
		defer cancel()

		var record SubmissionRecord
		err := s.db.QueryRow(
			ctx,
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
			id,
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
			return record, true
		}
		if err != pgx.ErrNoRows {
			log.Printf("postgres submission read failed for %s: %v", id, err)
		}
	}

	if record, ok := s.loadSubmissionCache(id); ok {
		return record, true
	}

	if s.db == nil {
		s.mu.RLock()
		defer s.mu.RUnlock()
		record, ok := s.submissions[id]
		return record, ok
	}

	return SubmissionRecord{}, false
}

func (s *Store) listMemoryUserSubmissions(userID string) []SubmissionRecord {
	if strings.TrimSpace(userID) == "" {
		return []SubmissionRecord{}
	}

	s.mu.RLock()
	defer s.mu.RUnlock()

	items := make([]SubmissionRecord, 0)
	for _, record := range s.submissions {
		if record.UserID == userID {
			items = append(items, record)
		}
	}

	sort.Slice(items, func(left, right int) bool {
		if items[left].CreatedAt.Equal(items[right].CreatedAt) {
			return items[left].UpdatedAt.After(items[right].UpdatedAt)
		}
		return items[left].CreatedAt.After(items[right].CreatedAt)
	})

	return items
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
