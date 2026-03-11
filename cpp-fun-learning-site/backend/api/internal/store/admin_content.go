package store

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"
)

var (
	ErrContentExists   = errors.New("content already exists")
	ErrContentInvalid  = errors.New("content payload is invalid")
	ErrContentNotFound = errors.New("content not found")
)

type AdminContentCatalog struct {
	Paths    []PathSummary    `json:"paths"`
	Lessons  []Lesson         `json:"lessons"`
	Problems []ProblemSummary `json:"problems"`
}

type AdminActivityEntry struct {
	ID         int64     `json:"id"`
	ActorID    string    `json:"actorId"`
	ActorName  string    `json:"actorName"`
	ActorEmail string    `json:"actorEmail"`
	Action     string    `json:"action"`
	TargetType string    `json:"targetType"`
	TargetKey  string    `json:"targetKey"`
	Detail     string    `json:"detail"`
	CreatedAt  time.Time `json:"createdAt"`
}

type AdminCreateProblemInput struct {
	Slug        string           `json:"slug"`
	Title       string           `json:"title"`
	Difficulty  string           `json:"difficulty"`
	Type        string           `json:"type"`
	Tags        []string         `json:"tags"`
	Mission     string           `json:"mission"`
	Description string           `json:"description"`
	StarterCode string           `json:"starterCode"`
	Hints       []string         `json:"hints"`
	Acceptance  []string         `json:"acceptance"`
	Runtime     string           `json:"runtime"`
	Examples    []ProblemExample `json:"examples"`
}

type AdminCreatePathModuleInput struct {
	Title   string   `json:"title"`
	Summary string   `json:"summary"`
	Reward  string   `json:"reward"`
	Lessons []Lesson `json:"lessons"`
}

type AdminCreatePathInput struct {
	Slug                    string                       `json:"slug"`
	Title                   string                       `json:"title"`
	Subtitle                string                       `json:"subtitle"`
	Theme                   string                       `json:"theme"`
	EstimatedHours          int                          `json:"estimatedHours"`
	FocusTags               []string                     `json:"focusTags"`
	BossMission             string                       `json:"bossMission"`
	Description             string                       `json:"description"`
	Milestones              []string                     `json:"milestones"`
	Modules                 []AdminCreatePathModuleInput `json:"modules"`
	RecommendedProblemSlugs []string                     `json:"recommendedProblemSlugs"`
}

func (s *Store) GetAdminContentCatalog() AdminContentCatalog {
	paths := s.currentPaths()
	problems := s.currentProblems()
	return AdminContentCatalog{
		Paths:    toPathSummaries(paths),
		Lessons:  flattenLessonsStable(paths),
		Problems: pickProblemSummaries(problems),
	}
}

func (s *Store) ListAdminActivity(limit int) []AdminActivityEntry {
	if limit <= 0 {
		limit = 20
	}

	if s.db != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		rows, err := s.db.Query(
			ctx,
			`select id, actor_id, actor_name, actor_email, action, target_type, target_key, detail, created_at
			 from admin_activity_logs
			 order by created_at desc
			 limit $1`,
			limit,
		)
		if err == nil {
			defer rows.Close()

			items := make([]AdminActivityEntry, 0, limit)
			for rows.Next() {
				var item AdminActivityEntry
				if scanErr := rows.Scan(
					&item.ID,
					&item.ActorID,
					&item.ActorName,
					&item.ActorEmail,
					&item.Action,
					&item.TargetType,
					&item.TargetKey,
					&item.Detail,
					&item.CreatedAt,
				); scanErr == nil {
					items = append(items, item)
				}
			}
			return items
		}
	}

	s.mu.RLock()
	defer s.mu.RUnlock()

	if len(s.adminLogs) <= limit {
		return append([]AdminActivityEntry(nil), s.adminLogs...)
	}
	return append([]AdminActivityEntry(nil), s.adminLogs[:limit]...)
}

func (s *Store) RecordAdminActivity(actor UserAccount, action, targetType, targetKey, detail string) error {
	entry := AdminActivityEntry{
		ActorID:    actor.ID,
		ActorName:  actor.Name,
		ActorEmail: actor.Email,
		Action:     strings.TrimSpace(action),
		TargetType: strings.TrimSpace(targetType),
		TargetKey:  strings.TrimSpace(targetKey),
		Detail:     strings.TrimSpace(detail),
		CreatedAt:  time.Now(),
	}

	if s.db != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		return s.db.QueryRow(
			ctx,
			`insert into admin_activity_logs (actor_id, actor_name, actor_email, action, target_type, target_key, detail)
			 values ($1, $2, $3, $4, $5, $6, $7)
			 returning id, created_at`,
			entry.ActorID,
			entry.ActorName,
			entry.ActorEmail,
			entry.Action,
			entry.TargetType,
			entry.TargetKey,
			entry.Detail,
		).Scan(&entry.ID, &entry.CreatedAt)
	}

	s.mu.Lock()
	defer s.mu.Unlock()
	entry.ID = int64(len(s.adminLogs) + 1)
	s.adminLogs = append([]AdminActivityEntry{entry}, s.adminLogs...)
	if len(s.adminLogs) > 50 {
		s.adminLogs = s.adminLogs[:50]
	}
	return nil
}

func (s *Store) CreateAdminProblem(input AdminCreateProblemInput) error {
	problems := s.currentProblems()
	for _, item := range problems {
		if item.Slug == strings.TrimSpace(input.Slug) {
			return fmt.Errorf("%w: problem slug %q", ErrContentExists, input.Slug)
		}
	}

	problem, err := normalizeProblemInput(input)
	if err != nil {
		return err
	}

	problems = append(problems, problem)
	paths := s.currentPaths()
	home := rebuildManagedHome(s.currentHome(), paths, problems)
	return s.persistManagedContent(home, paths, problems)
}

func (s *Store) CreateAdminPath(input AdminCreatePathInput) error {
	paths := s.currentPaths()
	for _, item := range paths {
		if item.Slug == strings.TrimSpace(input.Slug) {
			return fmt.Errorf("%w: path slug %q", ErrContentExists, input.Slug)
		}
	}

	problems := s.currentProblems()
	existingLessonIDs := make(map[string]struct{})
	for _, lesson := range flattenLessonsStable(paths) {
		existingLessonIDs[lesson.ID] = struct{}{}
	}

	path, err := normalizePathInput(input, problems, existingLessonIDs)
	if err != nil {
		return err
	}

	paths = append(paths, path)
	home := rebuildManagedHome(s.currentHome(), paths, problems)
	return s.persistManagedContent(home, paths, problems)
}

func (s *Store) DeleteAdminProblem(slug string) error {
	targetSlug := strings.TrimSpace(slug)
	if targetSlug == "" {
		return fmt.Errorf("%w: problem slug is required", ErrContentInvalid)
	}

	problems := s.currentProblems()
	index := -1
	for currentIndex, item := range problems {
		if item.Slug == targetSlug {
			index = currentIndex
			break
		}
	}
	if index == -1 {
		return fmt.Errorf("%w: problem slug %q", ErrContentNotFound, targetSlug)
	}

	problems = append(problems[:index], problems[index+1:]...)
	paths := s.currentPaths()
	for pathIndex := range paths {
		filtered := make([]ProblemSummary, 0, len(paths[pathIndex].RecommendedProblems))
		for _, problem := range paths[pathIndex].RecommendedProblems {
			if problem.Slug == targetSlug {
				continue
			}
			filtered = append(filtered, problem)
		}
		paths[pathIndex].RecommendedProblems = filtered
		paths[pathIndex].ChallengeCount = len(filtered)
	}

	home := rebuildManagedHome(s.currentHome(), paths, problems)
	return s.persistManagedContent(home, paths, problems)
}

func (s *Store) DeleteAdminPath(slug string) error {
	targetSlug := strings.TrimSpace(slug)
	if targetSlug == "" {
		return fmt.Errorf("%w: path slug is required", ErrContentInvalid)
	}

	paths := s.currentPaths()
	index := -1
	for currentIndex, item := range paths {
		if item.Slug == targetSlug {
			index = currentIndex
			break
		}
	}
	if index == -1 {
		return fmt.Errorf("%w: path slug %q", ErrContentNotFound, targetSlug)
	}

	paths = append(paths[:index], paths[index+1:]...)
	problems := s.currentProblems()
	home := rebuildManagedHome(s.currentHome(), paths, problems)
	return s.persistManagedContent(home, paths, problems)
}

func (s *Store) currentHome() HomeResponse {
	if doc, ok := s.loadHomeDocument(); ok {
		return doc
	}

	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.home
}

func (s *Store) currentPaths() []PathDetail {
	if docs, ok := s.loadPathsDocument(); ok {
		return docs
	}

	s.mu.RLock()
	defer s.mu.RUnlock()
	return append([]PathDetail(nil), s.paths...)
}

func (s *Store) currentProblems() []ProblemDetail {
	if docs, ok := s.loadProblemsDocument(); ok {
		return docs
	}

	s.mu.RLock()
	defer s.mu.RUnlock()
	return append([]ProblemDetail(nil), s.problems...)
}

func (s *Store) persistManagedContent(home HomeResponse, paths []PathDetail, problems []ProblemDetail) error {
	if s.db != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		queries := []struct {
			key     string
			payload any
		}{
			{key: documentHome, payload: home},
			{key: documentPaths, payload: paths},
			{key: documentProblems, payload: problems},
		}

		for _, item := range queries {
			if err := s.writeDocument(ctx, item.key, item.payload); err != nil {
				return err
			}
		}
		return nil
	}

	s.mu.Lock()
	defer s.mu.Unlock()
	s.home = home
	s.paths = paths
	s.problems = problems
	return nil
}

func rebuildManagedHome(home HomeResponse, paths []PathDetail, problems []ProblemDetail) HomeResponse {
	lessons := flattenLessonsStable(paths)
	home.FeaturedPaths = toPathSummaries(paths)
	home.FeaturedLessons = limitLessonsFromTail(lessons, 6)
	home.FeaturedProblems = limitProblemSummariesFromTail(problems, 6)
	home.Hero.Metrics = []HeroMetric{
		{Label: "学习路径", Value: fmt.Sprintf("%d", len(paths))},
		{Label: "课程模块", Value: fmt.Sprintf("%d", len(lessons))},
		{Label: "练习题", Value: fmt.Sprintf("%d", len(problems))},
	}
	return home
}

func normalizeProblemInput(input AdminCreateProblemInput) (ProblemDetail, error) {
	problem := ProblemDetail{
		ProblemSummary: ProblemSummary{
			Slug:       strings.TrimSpace(input.Slug),
			Title:      strings.TrimSpace(input.Title),
			Difficulty: strings.TrimSpace(input.Difficulty),
			Type:       strings.TrimSpace(input.Type),
			Tags:       compactStrings(input.Tags),
			Mission:    strings.TrimSpace(input.Mission),
		},
		Description: strings.TrimSpace(input.Description),
		StarterCode: strings.TrimSpace(input.StarterCode),
		Hints:       compactStrings(input.Hints),
		Acceptance:  compactStrings(input.Acceptance),
		Runtime:     strings.TrimSpace(input.Runtime),
		Examples:    normalizeProblemExamples(input.Examples),
	}

	switch {
	case problem.Slug == "":
		return ProblemDetail{}, fmt.Errorf("%w: problem slug is required", ErrContentInvalid)
	case problem.Title == "":
		return ProblemDetail{}, fmt.Errorf("%w: problem title is required", ErrContentInvalid)
	case problem.Difficulty == "":
		return ProblemDetail{}, fmt.Errorf("%w: problem difficulty is required", ErrContentInvalid)
	case problem.Type == "":
		return ProblemDetail{}, fmt.Errorf("%w: problem type is required", ErrContentInvalid)
	case problem.Mission == "":
		return ProblemDetail{}, fmt.Errorf("%w: problem mission is required", ErrContentInvalid)
	case problem.Description == "":
		return ProblemDetail{}, fmt.Errorf("%w: problem description is required", ErrContentInvalid)
	case problem.StarterCode == "":
		return ProblemDetail{}, fmt.Errorf("%w: starter code is required", ErrContentInvalid)
	case problem.Runtime == "":
		return ProblemDetail{}, fmt.Errorf("%w: runtime is required", ErrContentInvalid)
	case len(problem.Acceptance) == 0:
		return ProblemDetail{}, fmt.Errorf("%w: at least one acceptance rule is required", ErrContentInvalid)
	}

	return problem, nil
}

func normalizePathInput(input AdminCreatePathInput, problems []ProblemDetail, existingLessonIDs map[string]struct{}) (PathDetail, error) {
	path := PathDetail{
		PathSummary: PathSummary{
			Slug:           strings.TrimSpace(input.Slug),
			Title:          strings.TrimSpace(input.Title),
			Subtitle:       strings.TrimSpace(input.Subtitle),
			Theme:          strings.TrimSpace(input.Theme),
			EstimatedHours: input.EstimatedHours,
			FocusTags:      compactStrings(input.FocusTags),
			BossMission:    strings.TrimSpace(input.BossMission),
		},
		Description: strings.TrimSpace(input.Description),
		Milestones:  compactStrings(input.Milestones),
	}

	switch {
	case path.Slug == "":
		return PathDetail{}, fmt.Errorf("%w: path slug is required", ErrContentInvalid)
	case path.Title == "":
		return PathDetail{}, fmt.Errorf("%w: path title is required", ErrContentInvalid)
	case path.Subtitle == "":
		return PathDetail{}, fmt.Errorf("%w: path subtitle is required", ErrContentInvalid)
	case path.Theme == "":
		return PathDetail{}, fmt.Errorf("%w: path theme is required", ErrContentInvalid)
	case path.EstimatedHours <= 0:
		return PathDetail{}, fmt.Errorf("%w: estimated hours must be greater than zero", ErrContentInvalid)
	case path.Description == "":
		return PathDetail{}, fmt.Errorf("%w: path description is required", ErrContentInvalid)
	case len(input.Modules) == 0:
		return PathDetail{}, fmt.Errorf("%w: at least one module is required", ErrContentInvalid)
	}

	lessonIDs := make(map[string]struct{})
	modules := make([]PathModule, 0, len(input.Modules))
	for _, moduleInput := range input.Modules {
		moduleTitle := strings.TrimSpace(moduleInput.Title)
		moduleSummary := strings.TrimSpace(moduleInput.Summary)
		moduleReward := strings.TrimSpace(moduleInput.Reward)
		if moduleTitle == "" || moduleSummary == "" || moduleReward == "" {
			return PathDetail{}, fmt.Errorf("%w: each module needs title, summary and reward", ErrContentInvalid)
		}
		if len(moduleInput.Lessons) == 0 {
			return PathDetail{}, fmt.Errorf("%w: each module needs at least one lesson", ErrContentInvalid)
		}

		lessons := make([]Lesson, 0, len(moduleInput.Lessons))
		for _, lessonInput := range moduleInput.Lessons {
			lesson := Lesson{
				ID:          strings.TrimSpace(lessonInput.ID),
				Title:       strings.TrimSpace(lessonInput.Title),
				Module:      moduleTitle,
				Duration:    strings.TrimSpace(lessonInput.Duration),
				Difficulty:  strings.TrimSpace(lessonInput.Difficulty),
				Objective:   strings.TrimSpace(lessonInput.Objective),
				ContentTags: compactStrings(lessonInput.ContentTags),
				Snippet:     strings.TrimSpace(lessonInput.Snippet),
			}

			switch {
			case lesson.ID == "":
				return PathDetail{}, fmt.Errorf("%w: lesson id is required", ErrContentInvalid)
			case lesson.Title == "":
				return PathDetail{}, fmt.Errorf("%w: lesson title is required", ErrContentInvalid)
			case lesson.Duration == "":
				return PathDetail{}, fmt.Errorf("%w: lesson duration is required", ErrContentInvalid)
			case lesson.Difficulty == "":
				return PathDetail{}, fmt.Errorf("%w: lesson difficulty is required", ErrContentInvalid)
			case lesson.Objective == "":
				return PathDetail{}, fmt.Errorf("%w: lesson objective is required", ErrContentInvalid)
			case lesson.Snippet == "":
				return PathDetail{}, fmt.Errorf("%w: lesson snippet is required", ErrContentInvalid)
			}

			if _, exists := existingLessonIDs[lesson.ID]; exists {
				return PathDetail{}, fmt.Errorf("%w: lesson id %q already exists", ErrContentExists, lesson.ID)
			}
			if _, exists := lessonIDs[lesson.ID]; exists {
				return PathDetail{}, fmt.Errorf("%w: duplicated lesson id %q in request", ErrContentInvalid, lesson.ID)
			}

			lessonIDs[lesson.ID] = struct{}{}
			lessons = append(lessons, lesson)
		}

		modules = append(modules, PathModule{
			Title:   moduleTitle,
			Summary: moduleSummary,
			Reward:  moduleReward,
			Lessons: lessons,
		})
	}

	path.Modules = modules
	path.LessonCount = len(lessonIDs)
	path.RecommendedProblems = make([]ProblemSummary, 0, len(input.RecommendedProblemSlugs))

	problemIndex := make(map[string]ProblemSummary, len(problems))
	for _, problem := range problems {
		problemIndex[problem.Slug] = problem.ProblemSummary
	}

	seenProblem := make(map[string]struct{})
	for _, slug := range compactStrings(input.RecommendedProblemSlugs) {
		if _, duplicated := seenProblem[slug]; duplicated {
			continue
		}
		problem, ok := problemIndex[slug]
		if !ok {
			return PathDetail{}, fmt.Errorf("%w: recommended problem %q does not exist", ErrContentInvalid, slug)
		}
		seenProblem[slug] = struct{}{}
		path.RecommendedProblems = append(path.RecommendedProblems, problem)
	}
	path.ChallengeCount = len(path.RecommendedProblems)

	return path, nil
}

func normalizeProblemExamples(items []ProblemExample) []ProblemExample {
	result := make([]ProblemExample, 0, len(items))
	for _, item := range items {
		example := ProblemExample{
			Input:       strings.TrimSpace(item.Input),
			Output:      strings.TrimSpace(item.Output),
			Explanation: strings.TrimSpace(item.Explanation),
		}
		if example.Input == "" && example.Output == "" && example.Explanation == "" {
			continue
		}
		result = append(result, example)
	}
	return result
}

func compactStrings(items []string) []string {
	result := make([]string, 0, len(items))
	for _, item := range items {
		trimmed := strings.TrimSpace(item)
		if trimmed == "" {
			continue
		}
		result = append(result, trimmed)
	}
	return result
}

func flattenLessonsStable(paths []PathDetail) []Lesson {
	seen := make(map[string]struct{})
	lessons := make([]Lesson, 0)
	for _, path := range paths {
		for _, module := range path.Modules {
			for _, lesson := range module.Lessons {
				if _, ok := seen[lesson.ID]; ok {
					continue
				}
				seen[lesson.ID] = struct{}{}
				lessons = append(lessons, lesson)
			}
		}
	}
	return lessons
}

func limitLessonsFromTail(all []Lesson, limit int) []Lesson {
	if len(all) <= limit {
		return all
	}
	return all[len(all)-limit:]
}

func limitProblemSummariesFromTail(all []ProblemDetail, limit int) []ProblemSummary {
	summaries := pickProblemSummaries(all)
	if len(summaries) <= limit {
		return summaries
	}
	return summaries[len(summaries)-limit:]
}
