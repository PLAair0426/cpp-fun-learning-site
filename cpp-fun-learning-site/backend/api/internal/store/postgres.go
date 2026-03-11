package store

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

const (
	documentHome        = "home"
	documentPaths       = "paths"
	documentProblems    = "problems"
	documentLeaderboard = "leaderboard"
	documentProgress    = "progress"
)

func (s *Store) ConnectPostgres(ctx context.Context, dsn string) error {
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		return err
	}

	pingCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	if err := pool.Ping(pingCtx); err != nil {
		pool.Close()
		return err
	}

	s.db = pool

	if err := s.seedStructuredContent(ctx); err != nil {
		pool.Close()
		s.db = nil
		return err
	}

	if err := s.seedDocuments(ctx); err != nil {
		pool.Close()
		s.db = nil
		return err
	}

	return nil
}

func (s *Store) Close() {
	if s.db != nil {
		s.db.Close()
	}
	if s.redis != nil {
		_ = s.redis.Close()
	}
}

func (s *Store) UsingPostgres() bool {
	return s.db != nil
}

func (s *Store) seedDocuments(ctx context.Context) error {
	documents := map[string]any{
		documentHome:        s.home,
		documentPaths:       s.paths,
		documentProblems:    s.problems,
		documentLeaderboard: s.leaderboard,
		documentProgress:    s.progress,
	}

	for key, payload := range documents {
		encoded, err := json.Marshal(payload)
		if err != nil {
			return err
		}

		_, err = s.db.Exec(
			ctx,
			`insert into content_documents (doc_key, payload)
			 values ($1, $2)
			 on conflict (doc_key) do update
			 set payload = excluded.payload,
			     updated_at = now()`,
			key,
			encoded,
		)
		if err != nil {
			return err
		}
	}

	log.Printf("postgres content repository seeded: %d documents", len(documents))
	return nil
}

func (s *Store) seedStructuredContent(ctx context.Context) error {
	for _, path := range s.paths {
		metadata, err := json.Marshal(map[string]any{
			"subtitle":    path.Subtitle,
			"focusTags":   path.FocusTags,
			"bossMission": path.BossMission,
			"description": path.Description,
			"milestones":  path.Milestones,
		})
		if err != nil {
			return err
		}

		_, err = s.db.Exec(
			ctx,
			`insert into learning_paths (slug, title, theme, estimated_hours, lesson_count, challenge_count, metadata)
			 values ($1, $2, $3, $4, $5, $6, $7)
			 on conflict (slug) do update
			 set title = excluded.title,
			     theme = excluded.theme,
			     estimated_hours = excluded.estimated_hours,
			     lesson_count = excluded.lesson_count,
			     challenge_count = excluded.challenge_count,
			     metadata = excluded.metadata`,
			path.Slug,
			path.Title,
			path.Theme,
			path.EstimatedHours,
			path.LessonCount,
			path.ChallengeCount,
			metadata,
		)
		if err != nil {
			return err
		}
	}

	for _, lesson := range uniqueLessons(s.paths) {
		tags, err := json.Marshal(lesson.ContentTags)
		if err != nil {
			return err
		}

		_, err = s.db.Exec(
			ctx,
			`insert into lessons (id, path_slug, title, module, duration, difficulty, objective, tags, snippet)
			 values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
			 on conflict (id) do update
			 set path_slug = excluded.path_slug,
			     title = excluded.title,
			     module = excluded.module,
			     duration = excluded.duration,
			     difficulty = excluded.difficulty,
			     objective = excluded.objective,
			     tags = excluded.tags,
			     snippet = excluded.snippet`,
			lesson.ID,
			pathSlugForLesson(s.paths, lesson.ID),
			lesson.Title,
			lesson.Module,
			lesson.Duration,
			lesson.Difficulty,
			lesson.Objective,
			tags,
			lesson.Snippet,
		)
		if err != nil {
			return err
		}
	}

	for _, problem := range s.problems {
		tags, err := json.Marshal(problem.Tags)
		if err != nil {
			return err
		}

		_, err = s.db.Exec(
			ctx,
			`insert into problems (slug, title, difficulty, problem_type, mission, tags, description, starter_code, runtime)
			 values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
			 on conflict (slug) do update
			 set title = excluded.title,
			     difficulty = excluded.difficulty,
			     problem_type = excluded.problem_type,
			     mission = excluded.mission,
			     tags = excluded.tags,
			     description = excluded.description,
			     starter_code = excluded.starter_code,
			     runtime = excluded.runtime`,
			problem.Slug,
			problem.Title,
			problem.Difficulty,
			problem.Type,
			problem.Mission,
			tags,
			problem.Description,
			problem.StarterCode,
			problem.Runtime,
		)
		if err != nil {
			return err
		}
	}

	return nil
}

func (s *Store) loadHomeDocument() (HomeResponse, bool) {
	var target HomeResponse
	if !s.readDocument(documentHome, &target) {
		return HomeResponse{}, false
	}
	return target, true
}

func (s *Store) loadPathsDocument() ([]PathDetail, bool) {
	var target []PathDetail
	if !s.readDocument(documentPaths, &target) {
		return nil, false
	}
	return target, true
}

func (s *Store) loadProblemsDocument() ([]ProblemDetail, bool) {
	var target []ProblemDetail
	if !s.readDocument(documentProblems, &target) {
		return nil, false
	}
	return target, true
}

func (s *Store) loadLeaderboardDocument() ([]LeaderboardEntry, bool) {
	var target []LeaderboardEntry
	if !s.readDocument(documentLeaderboard, &target) {
		return nil, false
	}
	return target, true
}

func (s *Store) loadProgressDocument() (ProgressOverview, bool) {
	var target ProgressOverview
	if !s.readDocument(documentProgress, &target) {
		return ProgressOverview{}, false
	}
	return target, true
}

func (s *Store) readDocument(key string, target any) bool {
	if s.db == nil {
		return false
	}

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	var payload []byte
	err := s.db.QueryRow(ctx, `select payload from content_documents where doc_key = $1`, key).Scan(&payload)
	if err != nil {
		if err != pgx.ErrNoRows {
			log.Printf("postgres document read failed for %s: %v", key, err)
		}
		return false
	}

	if err := json.Unmarshal(payload, target); err != nil {
		log.Printf("postgres document decode failed for %s: %v", key, err)
		return false
	}

	return true
}

func uniqueLessons(paths []PathDetail) []Lesson {
	seen := make(map[string]Lesson)
	for _, path := range paths {
		for _, module := range path.Modules {
			for _, lesson := range module.Lessons {
				seen[lesson.ID] = lesson
			}
		}
	}

	result := make([]Lesson, 0, len(seen))
	for _, lesson := range seen {
		result = append(result, lesson)
	}
	return result
}

func pathSlugForLesson(paths []PathDetail, lessonID string) string {
	for _, path := range paths {
		for _, module := range path.Modules {
			for _, lesson := range module.Lessons {
				if lesson.ID == lessonID {
					return path.Slug
				}
			}
		}
	}
	return ""
}
