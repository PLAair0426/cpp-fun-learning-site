package store

import (
	"context"
	"sort"
	"time"
)

func (s *Store) GetProgressOverviewForUser(userID string) ProgressOverview {
	paths := s.currentPaths()
	problems := s.currentProblems()
	totalLessons := len(flattenLessonsStable(paths))
	totalProblems := len(problems)

	if userID == "" {
		return guestProgressOverview(s.progress, totalLessons, totalProblems)
	}

	base := guestProgressOverview(s.progress, totalLessons, totalProblems)
	if s.db == nil {
		records := s.listMemoryUserSubmissions(userID)
		if len(records) == 0 {
			return base
		}

		acceptedProblemSet := make(map[string]struct{})
		acceptedTitles := make([]string, 0, 3)
		acceptedSeen := make(map[string]struct{})
		problemTitles := make(map[string]string, len(problems))
		finishedSubmissions := 0
		weeklyCompleted := 0
		distinctDays := make(map[time.Time]struct{})
		sevenDaysAgo := time.Now().AddDate(0, 0, -7)

		for _, problem := range problems {
			problemTitles[problem.Slug] = problem.Title
		}

		for _, record := range records {
			if record.Status == "FINISHED" {
				finishedSubmissions++
				if !record.CreatedAt.Before(sevenDaysAgo) {
					weeklyCompleted++
				}
				distinctDays[truncateToDay(record.UpdatedAt)] = struct{}{}
			}

			if record.Result == "ACCEPTED" {
				acceptedProblemSet[record.ProblemSlug] = struct{}{}
				if _, exists := acceptedSeen[record.ProblemSlug]; !exists {
					title := problemTitles[record.ProblemSlug]
					if title == "" {
						title = record.ProblemSlug
					}
					acceptedTitles = append(acceptedTitles, "已点亮题目："+title)
					acceptedSeen[record.ProblemSlug] = struct{}{}
				}
			}
		}

		acceptedProblems := len(acceptedProblemSet)
		recentUnlocks := acceptedTitles
		if len(recentUnlocks) > 3 {
			recentUnlocks = recentUnlocks[:3]
		}
		if len(recentUnlocks) == 0 {
			recentUnlocks = []string{
				"完成第一道正式提交后，这里会出现你的个人解锁记录。",
			}
		}

		days := make([]time.Time, 0, len(distinctDays))
		for day := range distinctDays {
			days = append(days, day)
		}
		sort.Slice(days, func(left, right int) bool {
			return days[left].After(days[right])
		})

		streak := 0
		if len(days) > 0 {
			today := truncateToDay(time.Now())
			expected := today
			for index, day := range days {
				if index == 0 {
					if day.Equal(today) || day.Equal(today.AddDate(0, 0, -1)) {
						streak = 1
						expected = day
						continue
					}
					break
				}

				nextExpected := expected.AddDate(0, 0, -1)
				if day.Equal(nextExpected) {
					streak++
					expected = day
					continue
				}
				break
			}
		}

		completedLessons := acceptedProblems * 2
		if completedLessons > base.TotalLessons {
			completedLessons = base.TotalLessons
		}

		progressPercent := 0
		if base.TotalLessons > 0 {
			progressPercent = completedLessons * 100 / base.TotalLessons
		}
		if progressPercent > 100 {
			progressPercent = 100
		}

		recommendedActions := []string{
			"先完成一道正式提交，建立自己的通过记录。",
			"优先刷当前路线里的下一题，保持连续反馈。",
			"每周至少完成 3 次练习，成长面板会更快点亮。",
		}
		if acceptedProblems > 0 {
			recommendedActions = []string{
				"继续完成当前路线的下一道题，扩大自己的通过题集。",
				"对比最近一次结果输出，修复边界条件与输入处理。",
				"保持本周练习频率，尽量延长连续学习天数。",
			}
		}

		return ProgressOverview{
			XP:                acceptedProblems*120 + finishedSubmissions*35,
			Streak:            streak,
			CompletedLessons:  completedLessons,
			TotalLessons:      base.TotalLessons,
			CompletedProblems: acceptedProblems,
			TotalProblems:     base.TotalProblems,
			WeeklyTarget:      6,
			WeeklyCompleted:   weeklyCompleted,
			CurrentPath: CurrentPathStatus{
				Slug:              base.CurrentPath.Slug,
				Title:             base.CurrentPath.Title,
				ProgressPercent:   progressPercent,
				NextLessonTitle:   base.CurrentPath.NextLessonTitle,
				NextProblemTitle:  base.CurrentPath.NextProblemTitle,
				RemainingMissions: max(base.TotalProblems-acceptedProblems, 0),
			},
			RecentUnlocks:      recentUnlocks,
			RecommendedActions: recommendedActions,
		}
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var acceptedProblems int
	var finishedSubmissions int
	var weeklyCompleted int

	err := s.db.QueryRow(
		ctx,
		`select
			count(distinct case when result = 'ACCEPTED' then problem_slug end),
			count(*) filter (where status = 'FINISHED'),
			count(*) filter (where status = 'FINISHED' and created_at >= now() - interval '7 days')
		 from submissions
		 where user_id = $1`,
		userID,
	).Scan(&acceptedProblems, &finishedSubmissions, &weeklyCompleted)
	if err != nil {
		return base
	}

	streak := s.loadUserStreak(ctx, userID)
	recentUnlocks := s.loadRecentUnlocks(ctx, userID)
	if len(recentUnlocks) == 0 {
		recentUnlocks = []string{
			"完成第一道正式提交后，这里会出现你的个人解锁记录。",
		}
	}

	completedLessons := acceptedProblems * 2
	if completedLessons > base.TotalLessons {
		completedLessons = base.TotalLessons
	}

	progressPercent := 0
	if base.TotalLessons > 0 {
		progressPercent = completedLessons * 100 / base.TotalLessons
	}
	if progressPercent > 100 {
		progressPercent = 100
	}

	recommendedActions := []string{
		"先完成一道正式提交，建立自己的通过记录。",
		"优先刷当前路线里的下一题，保持连续反馈。",
		"每周至少完成 3 次练习，成长面板会更快点亮。",
	}
	if acceptedProblems > 0 {
		recommendedActions = []string{
			"继续完成当前路线的下一道题，扩大自己的通过题集。",
			"对比最近一次结果输出，修复边界条件与输入处理。",
			"保持本周练习频率，尽量延长连续学习天数。",
		}
	}

	return ProgressOverview{
		XP:                acceptedProblems*120 + finishedSubmissions*35,
		Streak:            streak,
		CompletedLessons:  completedLessons,
		TotalLessons:      base.TotalLessons,
		CompletedProblems: acceptedProblems,
		TotalProblems:     base.TotalProblems,
		WeeklyTarget:      6,
		WeeklyCompleted:   weeklyCompleted,
		CurrentPath: CurrentPathStatus{
			Slug:              base.CurrentPath.Slug,
			Title:             base.CurrentPath.Title,
			ProgressPercent:   progressPercent,
			NextLessonTitle:   base.CurrentPath.NextLessonTitle,
			NextProblemTitle:  base.CurrentPath.NextProblemTitle,
			RemainingMissions: max(base.TotalProblems-acceptedProblems, 0),
		},
		RecentUnlocks:      recentUnlocks,
		RecommendedActions: recommendedActions,
	}
}

func (s *Store) loadUserStreak(ctx context.Context, userID string) int {
	rows, err := s.db.Query(
		ctx,
		`select distinct date(updated_at)
		 from submissions
		 where user_id = $1 and status = 'FINISHED'
		 order by date(updated_at) desc`,
		userID,
	)
	if err != nil {
		return 0
	}
	defer rows.Close()

	var dates []time.Time
	for rows.Next() {
		var day time.Time
		if scanErr := rows.Scan(&day); scanErr == nil {
			dates = append(dates, day)
		}
	}
	if len(dates) == 0 {
		return 0
	}

	today := truncateToDay(time.Now())
	expected := today
	streak := 0

	for index, day := range dates {
		current := truncateToDay(day)
		if index == 0 {
			if current.Equal(today) || current.Equal(today.AddDate(0, 0, -1)) {
				expected = current
				streak = 1
				continue
			}
			return 0
		}

		nextExpected := expected.AddDate(0, 0, -1)
		if current.Equal(nextExpected) {
			streak++
			expected = current
			continue
		}
		break
	}

	return streak
}

func (s *Store) loadRecentUnlocks(ctx context.Context, userID string) []string {
	rows, err := s.db.Query(
		ctx,
		`select coalesce(p.title, s.problem_slug)
		 from submissions s
		 left join problems p on p.slug = s.problem_slug
		 where s.user_id = $1 and s.result = 'ACCEPTED'
		 group by coalesce(p.title, s.problem_slug)
		 order by max(s.updated_at) desc
		 limit 3`,
		userID,
	)
	if err != nil {
		return nil
	}
	defer rows.Close()

	items := make([]string, 0, 3)
	for rows.Next() {
		var title string
		if scanErr := rows.Scan(&title); scanErr == nil {
			items = append(items, "已点亮题目："+title)
		}
	}
	return items
}

func guestProgressOverview(base ProgressOverview, totalLessons, totalProblems int) ProgressOverview {
	progress := base
	progress.XP = 0
	progress.Streak = 0
	progress.CompletedLessons = 0
	progress.TotalLessons = totalLessons
	progress.CompletedProblems = 0
	progress.TotalProblems = totalProblems
	progress.WeeklyCompleted = 0
	progress.WeeklyTarget = 6
	progress.CurrentPath.ProgressPercent = 0
	progress.CurrentPath.RemainingMissions = totalProblems
	progress.RecentUnlocks = []string{
		"登录后会开始累计你的个人闯关记录。",
	}
	progress.RecommendedActions = []string{
		"先注册账号，系统会按你的提交记录生成专属进度。",
		"从当前推荐路线开始，先完成一题热身。",
		"正式提交后即可解锁个人成长面板。",
	}
	return progress
}

func truncateToDay(target time.Time) time.Time {
	year, month, day := target.Date()
	return time.Date(year, month, day, 0, 0, 0, 0, target.Location())
}

func max(left, right int) int {
	if left > right {
		return left
	}
	return right
}
