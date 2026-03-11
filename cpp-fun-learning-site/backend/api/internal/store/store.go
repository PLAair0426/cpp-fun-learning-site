package store

import (
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

type Store struct {
	mu          sync.RWMutex
	home        HomeResponse
	paths       []PathDetail
	problems    []ProblemDetail
	leaderboard []LeaderboardEntry
	progress    ProgressOverview
	db          *pgxpool.Pool
	redis       *redis.Client
	usersByID   map[string]UserAccount
	usersByMail map[string]memoryUser
	sessions    map[string]SessionRecord
}

type HomeResponse struct {
	Hero             HeroSection        `json:"hero"`
	DailyQuest       DailyQuest         `json:"dailyQuest"`
	FeaturedPaths    []PathSummary      `json:"featuredPaths"`
	FeaturedLessons  []Lesson           `json:"featuredLessons"`
	FeaturedProblems []ProblemSummary   `json:"featuredProblems"`
	Leaderboard      []LeaderboardEntry `json:"leaderboardPreview"`
	ReleaseNotes     []string           `json:"releaseNotes"`
	Stack            StackSummary       `json:"stack"`
}

type HeroSection struct {
	Eyebrow         string       `json:"eyebrow"`
	Title           string       `json:"title"`
	Subtitle        string       `json:"subtitle"`
	PrimaryAction   ActionLink   `json:"primaryAction"`
	SecondaryAction ActionLink   `json:"secondaryAction"`
	Metrics         []HeroMetric `json:"metrics"`
}

type ActionLink struct {
	Label string `json:"label"`
	Href  string `json:"href"`
}

type HeroMetric struct {
	Label string `json:"label"`
	Value string `json:"value"`
}

type DailyQuest struct {
	Title     string   `json:"title"`
	Reward    string   `json:"reward"`
	Objective string   `json:"objective"`
	Tips      []string `json:"tips"`
}

type StackSummary struct {
	Web         string `json:"web"`
	Judge       string `json:"judge"`
	Persistence string `json:"persistence"`
}

type PathSummary struct {
	Slug           string   `json:"slug"`
	Title          string   `json:"title"`
	Subtitle       string   `json:"subtitle"`
	Theme          string   `json:"theme"`
	EstimatedHours int      `json:"estimatedHours"`
	LessonCount    int      `json:"lessonCount"`
	ChallengeCount int      `json:"challengeCount"`
	FocusTags      []string `json:"focusTags"`
	BossMission    string   `json:"bossMission"`
}

type PathDetail struct {
	PathSummary
	Description         string           `json:"description"`
	Milestones          []string         `json:"milestones"`
	Modules             []PathModule     `json:"modules"`
	RecommendedProblems []ProblemSummary `json:"recommendedProblems"`
}

type PathModule struct {
	Title   string   `json:"title"`
	Summary string   `json:"summary"`
	Reward  string   `json:"reward"`
	Lessons []Lesson `json:"lessons"`
}

type Lesson struct {
	ID          string   `json:"id"`
	Title       string   `json:"title"`
	Module      string   `json:"module"`
	Duration    string   `json:"duration"`
	Difficulty  string   `json:"difficulty"`
	Objective   string   `json:"objective"`
	ContentTags []string `json:"contentTags"`
	Snippet     string   `json:"snippet"`
}

type ProblemSummary struct {
	Slug       string   `json:"slug"`
	Title      string   `json:"title"`
	Difficulty string   `json:"difficulty"`
	Type       string   `json:"type"`
	Tags       []string `json:"tags"`
	Mission    string   `json:"mission"`
}

type ProblemExample struct {
	Input       string `json:"input"`
	Output      string `json:"output"`
	Explanation string `json:"explanation"`
}

type ProblemDetail struct {
	ProblemSummary
	Description string           `json:"description"`
	StarterCode string           `json:"starterCode"`
	Hints       []string         `json:"hints"`
	Acceptance  []string         `json:"acceptance"`
	Runtime     string           `json:"runtime"`
	Examples    []ProblemExample `json:"examples"`
}

type LeaderboardEntry struct {
	Rank   int    `json:"rank"`
	Name   string `json:"name"`
	XP     int    `json:"xp"`
	Streak int    `json:"streak"`
	Title  string `json:"title"`
}

type ProgressOverview struct {
	XP                 int               `json:"xp"`
	Streak             int               `json:"streak"`
	CompletedLessons   int               `json:"completedLessons"`
	TotalLessons       int               `json:"totalLessons"`
	CompletedProblems  int               `json:"completedProblems"`
	TotalProblems      int               `json:"totalProblems"`
	WeeklyTarget       int               `json:"weeklyTarget"`
	WeeklyCompleted    int               `json:"weeklyCompleted"`
	CurrentPath        CurrentPathStatus `json:"currentPath"`
	RecentUnlocks      []string          `json:"recentUnlocks"`
	RecommendedActions []string          `json:"recommendedActions"`
}

type CurrentPathStatus struct {
	Slug              string `json:"slug"`
	Title             string `json:"title"`
	ProgressPercent   int    `json:"progressPercent"`
	NextLessonTitle   string `json:"nextLessonTitle"`
	NextProblemTitle  string `json:"nextProblemTitle"`
	RemainingMissions int    `json:"remainingMissions"`
}

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

func New() *Store {
	lessons := []Lesson{
		{
			ID:          "lesson-env-setup",
			Title:       "Windows 与 Linux 开发环境准备",
			Module:      "新手村：开局装备",
			Duration:    "18 分钟",
			Difficulty:  "Beginner",
			Objective:   "根据课件完成 VS2022、Linux 终端与 gcc/g++/gdb 的基础环境认知。",
			ContentTags: []string{"VS2022", "Linux", "gcc", "g++", "gdb"},
			Snippet: `# Linux toolchain
yum -y install gcc gcc-c++ gdb`,
		},
		{
			ID:          "lesson-first-program",
			Title:       "第一个 C++ 程序",
			Module:      "新手村：开局装备",
			Duration:    "12 分钟",
			Difficulty:  "Beginner",
			Objective:   "认识 `main` 函数、头文件、`cout` 与 `endl`，跑通第一段 Hello C++ 程序。",
			ContentTags: []string{"main", "iostream", "cout"},
			Snippet: `#include <iostream>
int main() {
  std::cout << "Hello C++!" << std::endl;
  return 0;
}`,
		},
		{
			ID:          "lesson-output-comments",
			Title:       "输出数据与程序注释",
			Module:      "新手村：表达与说明",
			Duration:    "16 分钟",
			Difficulty:  "Beginner",
			Objective:   "学习控制台输出、换行和单行/多行注释的基础写法。",
			ContentTags: []string{"cout", "endl", "单行注释", "多行注释"},
			Snippet: `// 输出欢迎语
std::cout << "欢迎来到 C++ 学习站" << std::endl;
/* 多行注释
   用于阶段说明 */`,
		},
		{
			ID:          "lesson-variables-constants",
			Title:       "变量、常量与 C++11 初始化",
			Module:      "新手村：表达与说明",
			Duration:    "20 分钟",
			Difficulty:  "Beginner",
			Objective:   "掌握整型、浮点型、字符型、布尔型变量以及 `const` 常量和列表初始化。",
			ContentTags: []string{"变量", "常量", "const", "初始化"},
			Snippet: `const int days{7};
double weight = 48.5;
char grade{'A'};
std::cout << days << " " << weight << " " << grade << std::endl;`,
		},
		{
			ID:          "lesson-identifiers-input",
			Title:       "标识符命名与输入数据",
			Module:      "新手村：互动控制台",
			Duration:    "18 分钟",
			Difficulty:  "Beginner",
			Objective:   "理解变量命名规则、关键字限制，并学会使用 `cin` 读取输入。",
			ContentTags: []string{"cin", "命名规则", "关键字", "输入"},
			Snippet: `std::string heroName;
std::cin >> heroName;
std::cout << "欢迎你，" << heroName << std::endl;`,
		},
		{
			ID:          "lesson-const-macro",
			Title:       "宏常量与 const 常量",
			Module:      "新手村：互动控制台",
			Duration:    "16 分钟",
			Difficulty:  "Beginner",
			Objective:   "理解 `#define` 与 `const` 的最基础差异，知道何时用常量表达固定值。",
			ContentTags: []string{"#define", "const", "常量", "初始化"},
			Snippet: `#define MONTHS 12
const int days = 7;
std::cout << MONTHS << " " << days << std::endl;`,
		},
		{
			ID:          "lesson-keyword-rules",
			Title:       "关键字避坑与命名规则",
			Module:      "新手村：互动控制台",
			Duration:    "15 分钟",
			Difficulty:  "Beginner",
			Objective:   "知道变量不能和 C++ 关键字重名，并建立清晰、可读的命名习惯。",
			ContentTags: []string{"关键字", "命名规则", "identifier"},
			Snippet: `int playerLevel = 1;
// int class = 2;  // invalid
std::cout << playerLevel << std::endl;`,
		},
		{
			ID:          "lesson-arithmetic-operators",
			Title:       "算术、赋值与自增自减",
			Module:      "运算竞技场：数值操作",
			Duration:    "18 分钟",
			Difficulty:  "Beginner",
			Objective:   "覆盖 `+ - * / %`、`=`、`+=`、`-=`、`++`、`--` 等常见运算写法。",
			ContentTags: []string{"算术运算", "赋值运算", "++", "--"},
			Snippet: `int level = 3;
level += 2;
std::cout << level++ << " " << level << std::endl;`,
		},
		{
			ID:          "lesson-division-remainder",
			Title:       "整数除法与取模",
			Module:      "运算竞技场：数值操作",
			Duration:    "16 分钟",
			Difficulty:  "Beginner",
			Objective:   "掌握 `/` 与 `%` 的差别，理解取模在奇偶判断和周期循环中的作用。",
			ContentTags: []string{"整数除法", "取模", "%", "/"},
			Snippet: `int boxes = 10 / 3;
int remain = 10 % 3;
std::cout << boxes << " " << remain << std::endl;`,
		},
		{
			ID:          "lesson-prefix-postfix",
			Title:       "前置 ++ 与后置 ++",
			Module:      "运算竞技场：数值操作",
			Duration:    "15 分钟",
			Difficulty:  "Beginner",
			Objective:   "理解 `++i` 与 `i++` 在表达式中的差异，避免写题时被自增顺序绕晕。",
			ContentTags: []string{"++i", "i++", "自增", "表达式"},
			Snippet: `int i = 3;
std::cout << ++i << " " << i++ << " " << i << std::endl;`,
		},
		{
			ID:          "lesson-relational-logic",
			Title:       "关系运算、逻辑运算与优先级",
			Module:      "运算竞技场：判断逻辑",
			Duration:    "16 分钟",
			Difficulty:  "Beginner",
			Objective:   "理解 `> < >= <= == != && || !` 的组合方式，以及表达式优先级的影响。",
			ContentTags: []string{"关系运算", "逻辑运算", "优先级"},
			Snippet: `bool canOpen = (score >= 60) && hasKey;
std::cout << canOpen << std::endl;`,
		},
		{
			ID:          "lesson-branch-loop",
			Title:       "if 与 for：基础分支和循环",
			Module:      "运算竞技场：控制流",
			Duration:    "18 分钟",
			Difficulty:  "Beginner",
			Objective:   "用 `if / else` 完成条件判断，用 `for` 完成固定次数循环。",
			ContentTags: []string{"if", "else", "for"},
			Snippet: `for (int step = 1; step <= 5; ++step) {
  if (step % 2 == 0) {
    std::cout << "偶数步" << std::endl;
  }
}`,
		},
		{
			ID:          "lesson-switch-while",
			Title:       "switch、while 与 do...while",
			Module:      "运算竞技场：控制流",
			Duration:    "20 分钟",
			Difficulty:  "Beginner",
			Objective:   "掌握 `switch`、`while`、`do...while`、`break`、`continue` 的典型用法。",
			ContentTags: []string{"switch", "while", "do...while", "break", "continue"},
			Snippet: `switch (weekday) {
  case 1: std::cout << "MON"; break;
  default: std::cout << "REST";
}`,
		},
		{
			ID:          "lesson-operator-precedence",
			Title:       "表达式优先级与括号控制",
			Module:      "运算竞技场：判断逻辑",
			Duration:    "16 分钟",
			Difficulty:  "Beginner",
			Objective:   "理解乘除优先于加减，知道什么时候要用括号让表达式结果更清晰。",
			ContentTags: []string{"优先级", "括号", "表达式", "运算顺序"},
			Snippet: `int score = 2 + 3 * 4;
int fixed = (2 + 3) * 4;
std::cout << score << " " << fixed << std::endl;`,
		},
		{
			ID:          "lesson-do-while-checkpoint",
			Title:       "do...while：先执行再判断",
			Module:      "运算竞技场：控制流",
			Duration:    "18 分钟",
			Difficulty:  "Beginner",
			Objective:   "掌握 do...while 与 while 的区别，理解“至少执行一次”的典型场景。",
			ContentTags: []string{"do...while", "循环", "控制流"},
			Snippet: `int password = 0;
do {
  std::cin >> password;
} while (password != 7);`,
		},
		{
			ID:          "lesson-break-continue",
			Title:       "break 与 continue 的节奏控制",
			Module:      "运算竞技场：控制流",
			Duration:    "16 分钟",
			Difficulty:  "Beginner",
			Objective:   "理解何时提前结束循环，何时跳过本轮继续下一轮。",
			ContentTags: []string{"break", "continue", "循环控制"},
			Snippet: `for (int i = 1; i <= 5; ++i) {
  if (i == 2) continue;
  if (i == 4) break;
}`,
		},
		{
			ID:          "lesson-switch-default",
			Title:       "switch default 与兜底分支",
			Module:      "运算竞技场：控制流",
			Duration:    "15 分钟",
			Difficulty:  "Beginner",
			Objective:   "知道 `default` 用来处理未命中的情况，避免 switch 缺少兜底逻辑。",
			ContentTags: []string{"switch", "default", "break"},
			Snippet: `switch (code) {
  case 1: std::cout << "MON"; break;
  default: std::cout << "REST"; break;
}`,
		},
		{
			ID:          "lesson-functions-reference",
			Title:       "函数定义、调用与引用传参",
			Module:      "函数与内存实验室：函数基础",
			Duration:    "20 分钟",
			Difficulty:  "Intermediate",
			Objective:   "理解函数声明与定义，练习值传递和引用传递的差异。",
			ContentTags: []string{"函数", "声明", "定义", "引用参数"},
			Snippet: `void swapValue(int& a, int& b) {
  int temp = a;
  a = b;
  b = temp;
}`,
		},
		{
			ID:          "lesson-function-scope",
			Title:       "作用域、局部变量与分文件思维",
			Module:      "函数与内存实验室：函数基础",
			Duration:    "22 分钟",
			Difficulty:  "Intermediate",
			Objective:   "理解全局变量、局部变量与函数作用域，并建立声明/实现分离的意识。",
			ContentTags: []string{"作用域", "局部变量", "全局变量", "分文件"},
			Snippet: `int globalLevel = 1;
void upgrade(int& level) { level += 1; }`,
		},
		{
			ID:          "lesson-function-declaration-files",
			Title:       "函数声明、原型与分文件组织",
			Module:      "函数与内存实验室：函数基础",
			Duration:    "18 分钟",
			Difficulty:  "Intermediate",
			Objective:   "理解函数原型、先声明后定义，以及头文件与实现文件分离的基本思路。",
			ContentTags: []string{"函数原型", "声明", "头文件", "分文件"},
			Snippet: `int calculateXP(int level);

int main() {
  std::cout << calculateXP(6) << std::endl;
}`,
		},
		{
			ID:          "lesson-value-vs-reference",
			Title:       "值传递与引用传递对比",
			Module:      "函数与内存实验室：函数基础",
			Duration:    "18 分钟",
			Difficulty:  "Intermediate",
			Objective:   "通过同一个变量修改案例，理解副本与原变量被修改的差别。",
			ContentTags: []string{"值传递", "引用传递", "参数", "函数"},
			Snippet: `void copyValue(int level) { level += 1; }
void refValue(int& level) { level += 1; }`,
		},
		{
			ID:          "lesson-function-return-value",
			Title:       "函数返回值与结果复用",
			Module:      "函数与内存实验室：函数基础",
			Duration:    "16 分钟",
			Difficulty:  "Intermediate",
			Objective:   "理解函数不只是改参数，也可以通过返回值把结果带回主流程。",
			ContentTags: []string{"return", "函数返回值", "复用"},
			Snippet: `int doubleXP(int level) {
  return level * 2;
}`,
		},
		{
			ID:          "lesson-basic-data-types",
			Title:       "整型、浮点型、字符型与布尔型",
			Module:      "函数与内存实验室：调试分析",
			Duration:    "18 分钟",
			Difficulty:  "Beginner",
			Objective:   "回顾 `int`、`double`、`char`、`bool` 的写法和常见取值形式，为 sizeof 与调试做铺垫。",
			ContentTags: []string{"int", "double", "char", "bool"},
			Snippet: `int hp = 100;
double weight = 48.5;
char rank = 'A';
bool passed = true;`,
		},
		{
			ID:          "lesson-vs-debug-workflow",
			Title:       "VS 调试流程与断点观察",
			Module:      "函数与内存实验室：调试分析",
			Duration:    "18 分钟",
			Difficulty:  "Intermediate",
			Objective:   "建立断点、单步执行、观察变量值的调试流程意识，把课件里的调试步骤转成练习习惯。",
			ContentTags: []string{"VS", "debug", "breakpoint", "watch"},
			Snippet: `int score = 60;
score += 5;
// 在这里打断点观察 score`,
		},
		{
			ID:          "lesson-debug-types",
			Title:       "调试、sizeof 与基础类型复盘",
			Module:      "函数与内存实验室：调试分析",
			Duration:    "24 分钟",
			Difficulty:  "Intermediate",
			Objective:   "结合 VS 调试流程，理解 `sizeof` 和基础类型在内存里的差异。",
			ContentTags: []string{"调试", "sizeof", "基础类型", "内存观察"},
			Snippet: `std::cout << sizeof(int) << " "
          << sizeof(double) << " "
          << int('A') << std::endl;`,
		},
		{
			ID:          "lesson-pointer-memory",
			Title:       "指针与动态内存",
			Module:      "函数与内存实验室：调试分析",
			Duration:    "22 分钟",
			Difficulty:  "Intermediate",
			Objective:   "认识地址、解引用、`new` / `delete` 以及动态内存释放。",
			ContentTags: []string{"指针", "动态内存", "new/delete"},
			Snippet: `int* score = new int(95);
std::cout << *score << std::endl;
delete score;`,
		},
		{
			ID:          "lesson-linux-toolchain",
			Title:       "Linux 工具链与 gdb 入门",
			Module:      "Linux 支线：终端工具链",
			Duration:    "18 分钟",
			Difficulty:  "Beginner",
			Objective:   "认识 Linux 里的 gcc、g++、gdb，并完成基础安装命令。",
			ContentTags: []string{"Linux", "gcc", "g++", "gdb"},
			Snippet: `yum -y install gcc gcc-c++ gdb
gdb ./hello`,
		},
		{
			ID:          "lesson-linux-hello",
			Title:       "Linux 命令行编译 Hello World",
			Module:      "Linux 支线：终端工具链",
			Duration:    "15 分钟",
			Difficulty:  "Beginner",
			Objective:   "用 `g++` 编译 `hello.cpp`，并在 Linux 终端里运行可执行文件。",
			ContentTags: []string{"Linux", "编译", "g++"},
			Snippet: `g++ hello.cpp -o hello
./hello`,
		},
		{
			ID:          "lesson-linux-gdb",
			Title:       "Linux 下的基础调试流程",
			Module:      "Linux 支线：终端工具链",
			Duration:    "15 分钟",
			Difficulty:  "Intermediate",
			Objective:   "了解 `-g` 编译、进入 gdb、设置断点和查看变量的最基础流程。",
			ContentTags: []string{"Linux", "gdb", "断点", "调试"},
			Snippet: `g++ -g hello.cpp -o hello
gdb ./hello`,
		},
		{
			ID:          "lesson-linux-gdb-breakpoint",
			Title:       "gdb 断点、运行与查看变量",
			Module:      "Linux 支线：终端工具链",
			Duration:    "16 分钟",
			Difficulty:  "Intermediate",
			Objective:   "掌握 `break`、`run`、`print` 这类最基础的 gdb 调试动作。",
			ContentTags: []string{"gdb", "break", "run", "print"},
			Snippet: `gdb ./hello
(gdb) break main
(gdb) run`,
		},
		{
			ID:          "lesson-linux-print-watch",
			Title:       "gdb print 与变量观察",
			Module:      "Linux 支线：终端工具链",
			Duration:    "14 分钟",
			Difficulty:  "Intermediate",
			Objective:   "认识 `print` 查看变量值的用法，把 Linux 调试流程补到最小闭环。",
			ContentTags: []string{"gdb", "print", "变量观察"},
			Snippet: `gdb ./hello
(gdb) break main
(gdb) run
(gdb) print score`,
		},
		{
			ID:          "lesson-linux-step-next",
			Title:       "gdb next 单步执行",
			Module:      "Linux 支线：终端工具链",
			Duration:    "14 分钟",
			Difficulty:  "Intermediate",
			Objective:   "补充 `next` 这类单步命令，让 Linux 调试从“能进 gdb”走到“能跟代码”。",
			ContentTags: []string{"gdb", "next", "单步执行"},
			Snippet: `gdb ./hello
(gdb) break main
(gdb) run
(gdb) next`,
		},
	}

	problems := []ProblemDetail{
		{
			ProblemSummary: ProblemSummary{
				Slug:       "hello-cpp",
				Title:      "输出 Hello C++",
				Difficulty: "Easy",
				Type:       "输出题",
				Tags:       []string{"输出", "main"},
				Mission:    "完成你的第一道 C++ 输出题。",
			},
			Description: "补全一段最基础的控制台程序，让它输出 `Hello C++`。",
			StarterCode: `#include <iostream>
using namespace std;

int main() {
  // TODO
  return 0;
}`,
			Hints: []string{
				"先包含 `<iostream>`。",
				"输出固定字符串后返回 0。",
			},
			Acceptance: []string{
				"标准输出包含 `Hello C++`。",
				"`main` 函数正常结束。",
			},
			Runtime: "mock runtime · C++17",
			Examples: []ProblemExample{
				{Input: "(无输入)", Output: "Hello C++", Explanation: "只需要打印固定文本。"},
			},
		},
		{
			ProblemSummary: ProblemSummary{
				Slug:       "profile-console",
				Title:      "控制台资料卡",
				Difficulty: "Easy",
				Type:       "变量题",
				Tags:       []string{"cout", "变量", "字符串"},
				Mission:    "输出一行简短的个人资料信息。",
			},
			Description: "练习字符串、整型与输出拼接，模拟控制台资料卡。",
			StarterCode: `#include <iostream>
using namespace std;

int main() {
  // TODO
  return 0;
}`,
			Hints: []string{
				"可以先定义 `name`、`age`、`weight`、`sex`。",
				"用 `<<` 把多段内容串起来输出。",
			},
			Acceptance: []string{
				"输出里同时包含姓名和年龄。",
				"整行信息按顺序展示。",
			},
			Runtime: "mock runtime · C++17",
			Examples: []ProblemExample{
				{Input: "(无输入)", Output: "姓名：小布 年龄：18", Explanation: "输出格式保持清晰即可。"},
			},
		},
		{
			ProblemSummary: ProblemSummary{
				Slug:       "const-week-plan",
				Title:      "常量周计划",
				Difficulty: "Easy",
				Type:       "常量题",
				Tags:       []string{"const", "#define", "输出"},
				Mission:    "定义一个常量表示一周 7 天，并输出它。",
			},
			Description: "练习 `const` 或 `#define` 的最基础写法，输出固定值 7。",
			StarterCode: `#include <iostream>
using namespace std;

int main() {
  // TODO
  return 0;
}`,
			Hints: []string{
				"可以写成 `const int days = 7;`。",
				"也可以用 `#define`，但推荐优先练 `const`。",
			},
			Acceptance: []string{
				"标准输出为 `7`。",
				"代码中出现 `const` 或 `#define`。",
			},
			Runtime: "mock runtime · C++17",
			Examples: []ProblemExample{
				{Input: "(无输入)", Output: "7", Explanation: "一周固定有 7 天。"},
			},
		},
		{
			ProblemSummary: ProblemSummary{
				Slug:       "sum-two-values",
				Title:      "两个数求和",
				Difficulty: "Easy",
				Type:       "输入题",
				Tags:       []string{"cin", "sum", "运算"},
				Mission:    "读取两个整数并输出它们的和。",
			},
			Description: "使用 `cin` 读取两个整数，并把结果输出到控制台。",
			StarterCode: `#include <iostream>
using namespace std;

int main() {
  int a, b;
  cin >> a >> b;
  // TODO
  return 0;
}`,
			Hints: []string{
				"可以定义 `int sum = a + b;`。",
				"最后用 `cout` 输出结果。",
			},
			Acceptance: []string{
				"输入 `3 5` 时输出 `8`。",
				"结果变量可命名为 `sum` 或 `total`。",
			},
			Runtime: "mock runtime · C++17",
			Examples: []ProblemExample{
				{Input: "3 5", Output: "8", Explanation: "3 加 5 等于 8。"},
			},
		},
		{
			ProblemSummary: ProblemSummary{
				Slug:       "level-gate",
				Title:      "关卡门禁",
				Difficulty: "Easy",
				Type:       "条件题",
				Tags:       []string{"if", "条件判断", "输出"},
				Mission:    "分数达到 60 输出 PASS，否则输出 RETRY。",
			},
			Description: "读取一个分数，使用 `if / else` 判断是否通过关卡。",
			StarterCode: `#include <iostream>
using namespace std;

int main() {
  int score;
  cin >> score;
  // TODO
  return 0;
}`,
			Hints: []string{
				"先判断 `score >= 60`。",
				"两个分支分别输出 PASS 和 RETRY。",
			},
			Acceptance: []string{
				"60 分及以上输出 `PASS`。",
				"不足 60 分输出 `RETRY`。",
			},
			Runtime: "mock runtime · C++17",
			Examples: []ProblemExample{
				{Input: "77", Output: "PASS", Explanation: "达到及格线即可通过。"},
			},
		},
		{
			ProblemSummary: ProblemSummary{
				Slug:       "logic-guard",
				Title:      "逻辑守卫",
				Difficulty: "Easy",
				Type:       "布尔逻辑题",
				Tags:       []string{"&&", "||", "bool"},
				Mission:    "根据条件组合输出 OPEN 或 WAIT。",
			},
			Description: "读取两个布尔条件，组合逻辑判断是否可以开门。",
			StarterCode: `#include <iostream>
using namespace std;

int main() {
  bool hasTicket;
  bool hasPassword;
  cin >> hasTicket >> hasPassword;
  // TODO
  return 0;
}`,
			Hints: []string{
				"可以先用 `&&` 完成基础版本。",
				"满足条件时输出 `OPEN`，否则输出 `WAIT`。",
			},
			Acceptance: []string{
				"条件满足时输出 `OPEN`。",
				"条件不足时输出 `WAIT`。",
			},
			Runtime: "mock runtime · C++17",
			Examples: []ProblemExample{
				{Input: "1 1", Output: "OPEN", Explanation: "两项条件同时满足时开门。"},
			},
		},
		{
			ProblemSummary: ProblemSummary{
				Slug:       "bool-signal-tower",
				Title:      "布尔信号塔",
				Difficulty: "Easy",
				Type:       "布尔题",
				Tags:       []string{"bool", "if", "SAFE"},
				Mission:    "读入一个布尔值，安全时输出 SAFE，否则输出 ALERT。",
			},
			Description: "练习布尔型输入和最基础的 if 判断。",
			StarterCode: `#include <iostream>
using namespace std;

int main() {
  bool safe;
  cin >> safe;
  // TODO
  return 0;
}`,
			Hints: []string{
				"`true/1` 视为安全。",
				"两个分支分别输出 `SAFE` 和 `ALERT`。",
			},
			Acceptance: []string{
				"安全状态输出 `SAFE`。",
				"非安全状态输出 `ALERT`。",
			},
			Runtime: "mock runtime · C++17",
			Examples: []ProblemExample{
				{Input: "1", Output: "SAFE", Explanation: "布尔条件为真时输出安全状态。"},
			},
		},
		{
			ProblemSummary: ProblemSummary{
				Slug:       "switch-weekday",
				Title:      "switch 星期映射",
				Difficulty: "Easy",
				Type:       "分支题",
				Tags:       []string{"switch", "case", "break"},
				Mission:    "把数字 1/2/3 映射成 MON/TUE/WED。",
			},
			Description: "使用 `switch` 结构完成星期缩写映射，并注意 `break` 的位置。",
			StarterCode: `#include <iostream>
using namespace std;

int main() {
  int day;
  cin >> day;
  // TODO
  return 0;
}`,
			Hints: []string{
				"`case 1` 对应 `MON`。",
				"每个分支结束后记得 `break`。",
			},
			Acceptance: []string{
				"输入 1 输出 `MON`。",
				"输入 2 输出 `TUE`，输入 3 输出 `WED`。",
			},
			Runtime: "mock runtime · C++17",
			Examples: []ProblemExample{
				{Input: "2", Output: "TUE", Explanation: "数字 2 对应星期二。"},
			},
		},
		{
			ProblemSummary: ProblemSummary{
				Slug:       "operator-priority",
				Title:      "优先级试炼",
				Difficulty: "Easy",
				Type:       "表达式题",
				Tags:       []string{"优先级", "括号", "运算"},
				Mission:    "计算表达式 `2 + 3 * 4` 的结果，理解默认优先级。",
			},
			Description: "不使用复杂输入，直接输出表达式 `2 + 3 * 4` 的结果，练习运算优先级。",
			StarterCode: `#include <iostream>
using namespace std;

int main() {
  // TODO
  return 0;
}`,
			Hints: []string{
				"乘法会先于加法执行。",
				"也可以先定义一个 `priorityScore` 变量再输出。",
			},
			Acceptance: []string{
				"输出结果应为 `14`。",
				"可以直接写表达式，也可以先存变量。",
			},
			Runtime: "mock runtime · C++17",
			Examples: []ProblemExample{
				{Input: "(无输入)", Output: "14", Explanation: "`3 * 4` 先算，所以结果是 14。"},
			},
		},
		{
			ProblemSummary: ProblemSummary{
				Slug:       "modulo-remainder",
				Title:      "余数侦察",
				Difficulty: "Easy",
				Type:       "运算题",
				Tags:       []string{"%", "余数", "算术"},
				Mission:    "计算 `10 % 3` 的结果，练习取模运算。",
			},
			Description: "输出表达式 `10 % 3` 的结果，建立对取模的直觉。",
			StarterCode: `#include <iostream>
using namespace std;

int main() {
  // TODO
  return 0;
}`,
			Hints:      []string{"直接使用 `%` 运算符。", "也可以先定义 `remainder` 变量再输出。"},
			Acceptance: []string{"输出应为 `1`。", "代码里使用 `%` 或 `remainder`。"},
			Runtime:    "mock runtime · C++17",
			Examples: []ProblemExample{
				{Input: "(无输入)", Output: "1", Explanation: "10 除以 3 余 1。"},
			},
		},
		{
			ProblemSummary: ProblemSummary{
				Slug:       "prefix-postfix-lab",
				Title:      "前后置自增实验",
				Difficulty: "Easy",
				Type:       "表达式题",
				Tags:       []string{"++i", "i++", "COUNT"},
				Mission:    "写出包含前置或后置自增的代码，并输出 COUNT 作为完成标记。",
			},
			Description: "通过一段最小示例理解 `++i` 与 `i++` 的存在感，先建立手感再做复杂表达式。",
			StarterCode: `#include <iostream>
using namespace std;

int main() {
  // TODO
  return 0;
}`,
			Hints:      []string{"代码里出现 `++`。", "最后输出 `COUNT` 作为完成标记。"},
			Acceptance: []string{"代码里使用前置或后置自增。", "输出 `COUNT`。"},
			Runtime:    "mock runtime · C++17",
			Examples: []ProblemExample{
				{Input: "(无输入)", Output: "COUNT", Explanation: "先把前后置自增用起来，再输出完成标记。"},
			},
		},
		{
			ProblemSummary: ProblemSummary{
				Slug:       "loop-sum",
				Title:      "循环累加",
				Difficulty: "Medium",
				Type:       "循环题",
				Tags:       []string{"for", "sum", "累加"},
				Mission:    "输入 n，输出 1 到 n 的累加和。",
			},
			Description: "使用 `for` 或 `while` 循环累加，练习计数变量和累积变量的配合。",
			StarterCode: `#include <iostream>
using namespace std;

int main() {
  int n;
  cin >> n;
  // TODO
  return 0;
}`,
			Hints: []string{
				"从 `sum = 0` 开始。",
				"循环变量从 1 累加到 `n`。",
			},
			Acceptance: []string{
				"输入 4 时输出 10。",
				"结果变量推荐命名为 `sum` 或 `total`。",
			},
			Runtime: "mock runtime · C++17",
			Examples: []ProblemExample{
				{Input: "4", Output: "10", Explanation: "1+2+3+4=10。"},
			},
		},
		{
			ProblemSummary: ProblemSummary{
				Slug:       "do-while-password",
				Title:      "do...while 口令门",
				Difficulty: "Medium",
				Type:       "循环题",
				Tags:       []string{"do...while", "循环", "OPEN"},
				Mission:    "用 do...while 读取口令，直到口令正确后输出 OPEN。",
			},
			Description: "模拟一个至少要输入一次的口令门，练习 do...while 的典型使用场景。",
			StarterCode: `#include <iostream>
using namespace std;

int main() {
  int password = 0;
  // TODO
  return 0;
}`,
			Hints: []string{
				"循环体里先读取，再判断是否继续。",
				"口令正确后输出 `OPEN`。",
			},
			Acceptance: []string{
				"使用 `do...while`。",
				"成功时输出 `OPEN`。",
			},
			Runtime: "mock runtime · C++17",
			Examples: []ProblemExample{
				{Input: "1 3 7", Output: "OPEN", Explanation: "前两次错误，第三次输入正确后通过。"},
			},
		},
		{
			ProblemSummary: ProblemSummary{
				Slug:       "break-continue-route",
				Title:      "break/continue 路线图",
				Difficulty: "Medium",
				Type:       "循环题",
				Tags:       []string{"break", "continue", "SKIP"},
				Mission:    "在循环里跳过一个节点并提前结束，最终输出 SKIP。",
			},
			Description: "练习在同一个循环中同时使用 `continue` 与 `break`。",
			StarterCode: `#include <iostream>
using namespace std;

int main() {
  // TODO
  return 0;
}`,
			Hints:      []string{"让代码里同时出现 `continue` 和 `break`。", "最后输出 `SKIP` 作为完成标记。"},
			Acceptance: []string{"代码中出现 `continue`。", "最终输出 `SKIP`。"},
			Runtime:    "mock runtime · C++17",
			Examples: []ProblemExample{
				{Input: "(无输入)", Output: "SKIP", Explanation: "跳过中间节点并提前结束循环。"},
			},
		},
		{
			ProblemSummary: ProblemSummary{
				Slug:       "switch-default-camp",
				Title:      "default 营地",
				Difficulty: "Easy",
				Type:       "分支题",
				Tags:       []string{"switch", "default", "REST"},
				Mission:    "用 `switch` 处理未知分支，并在 `default` 中输出 REST。",
			},
			Description: "练习 switch 的兜底分支，让未命中的情况也能有稳定输出。",
			StarterCode: `#include <iostream>
using namespace std;

int main() {
  int code;
  cin >> code;
  // TODO
  return 0;
}`,
			Hints:      []string{"保留 `default` 分支。", "兜底输出 `REST`。"},
			Acceptance: []string{"代码里出现 `default`。", "未知值输出 `REST`。"},
			Runtime:    "mock runtime · C++17",
			Examples: []ProblemExample{
				{Input: "9", Output: "REST", Explanation: "未命中 case 时走兜底分支。"},
			},
		},
		{
			ProblemSummary: ProblemSummary{
				Slug:       "swap-by-reference",
				Title:      "引用交换",
				Difficulty: "Medium",
				Type:       "函数题",
				Tags:       []string{"函数", "引用", "swap"},
				Mission:    "定义 `swapValue`，通过引用交换两个变量的值。",
			},
			Description: "根据课件里的参数传递知识，完成引用参数版本的交换函数。",
			StarterCode: `#include <iostream>
using namespace std;

void swapValue(int &left, int &right) {
  // TODO
}

int main() {
  int a = 3;
  int b = 9;
  swapValue(a, b);
  cout << a << " " << b << endl;
  return 0;
}`,
			Hints: []string{
				"先定义一个临时变量 `temp`。",
				"函数参数要带 `&`。",
			},
			Acceptance: []string{
				"输出应为 `9 3`。",
				"必须通过 `swapValue` 完成交换。",
			},
			Runtime: "mock runtime · C++17",
			Examples: []ProblemExample{
				{Input: "(无输入)", Output: "9 3", Explanation: "通过引用修改原变量。"},
			},
		},
		{
			ProblemSummary: ProblemSummary{
				Slug:       "function-prototype",
				Title:      "函数原型接力",
				Difficulty: "Medium",
				Type:       "函数题",
				Tags:       []string{"函数原型", "声明", "calculateXP"},
				Mission:    "在 `main` 前声明 `calculateXP`，在后面完成定义，并输出 42。",
			},
			Description: "练习“先声明、后定义”的函数组织方式，模仿分文件开发前的最小原型流程。",
			StarterCode: `#include <iostream>
using namespace std;

int calculateXP(int level);

int main() {
  cout << calculateXP(6) << endl;
  return 0;
}

// TODO: 在这里定义 calculateXP`,
			Hints: []string{
				"可以让 `calculateXP(6)` 返回 42。",
				"保留函数原型声明在 `main` 上方。",
			},
			Acceptance: []string{
				"输出结果为 `42`。",
				"代码里出现 `calculateXP` 的声明与定义。",
			},
			Runtime: "mock runtime · C++17",
			Examples: []ProblemExample{
				{Input: "(无输入)", Output: "42", Explanation: "先声明函数，再在后面补定义。"},
			},
		},
		{
			ProblemSummary: ProblemSummary{
				Slug:       "value-copy-lab",
				Title:      "值拷贝实验",
				Difficulty: "Medium",
				Type:       "函数题",
				Tags:       []string{"值传递", "函数", "UNCHANGED"},
				Mission:    "写一个值传递函数，调用后原变量保持不变，并输出 UNCHANGED。",
			},
			Description: "通过值传递的方式传入参数，证明函数内修改不会影响原变量。",
			StarterCode: `#include <iostream>
using namespace std;

void copyValue(int level) {
  // TODO
}

int main() {
  int level = 3;
  copyValue(level);
  cout << "UNCHANGED" << endl;
  return 0;
}`,
			Hints:      []string{"参数不要加 `&`。", "函数名可以保留 `copyValue`。"},
			Acceptance: []string{"代码中出现 `copyValue`。", "输出结果为 `UNCHANGED`。"},
			Runtime:    "mock runtime · C++17",
			Examples: []ProblemExample{
				{Input: "(无输入)", Output: "UNCHANGED", Explanation: "值传递修改的是副本，不是原变量。"},
			},
		},
		{
			ProblemSummary: ProblemSummary{
				Slug:       "return-value-orb",
				Title:      "返回值宝珠",
				Difficulty: "Medium",
				Type:       "函数题",
				Tags:       []string{"return", "doublexp", "64"},
				Mission:    "定义一个返回值函数，让它输出 64。",
			},
			Description: "练习通过函数返回值把结果带回主流程，而不是只在函数里直接输出。",
			StarterCode: `#include <iostream>
using namespace std;

int doubleXP(int level) {
  // TODO
}

int main() {
  cout << doubleXP(32) << endl;
  return 0;
}`,
			Hints:      []string{"函数里要写 `return`。", "让 `doubleXP(32)` 变成 `64`。"},
			Acceptance: []string{"代码里出现 `return`。", "输出结果为 `64`。"},
			Runtime:    "mock runtime · C++17",
			Examples: []ProblemExample{
				{Input: "(无输入)", Output: "64", Explanation: "通过返回值把结果带回 `main`。"},
			},
		},
		{
			ProblemSummary: ProblemSummary{
				Slug:       "pointer-box",
				Title:      "指针盒子",
				Difficulty: "Medium",
				Type:       "内存题",
				Tags:       []string{"指针", "new", "delete"},
				Mission:    "用 `new` 申请一个整型空间，写入并输出 95，最后正确释放。",
			},
			Description: "练习指针、解引用以及 `new / delete` 的基本搭配。",
			StarterCode: `#include <iostream>
using namespace std;

int main() {
  // TODO
  return 0;
}`,
			Hints: []string{
				"可以写成 `int *score = new int(95);`。",
				"输出后不要忘记 `delete score;`。",
			},
			Acceptance: []string{
				"程序输出 `95`。",
				"代码中出现 `delete` 释放动态内存。",
			},
			Runtime: "mock runtime · C++17",
			Examples: []ProblemExample{
				{Input: "(无输入)", Output: "95", Explanation: "申请一个整型地址并输出其中的值。"},
			},
		},
		{
			ProblemSummary: ProblemSummary{
				Slug:       "sizeof-scout",
				Title:      "sizeof 侦察兵",
				Difficulty: "Easy",
				Type:       "类型题",
				Tags:       []string{"sizeof", "double", "基础类型"},
				Mission:    "输出 `double` 类型的字节数，感受 sizeof 的用法。",
			},
			Description: "用 `sizeof(double)` 观察基础类型大小，为后续调试与内存理解打底。",
			StarterCode: `#include <iostream>
using namespace std;

int main() {
  // TODO
  return 0;
}`,
			Hints: []string{
				"直接输出 `sizeof(double)` 即可。",
				"题目关注的是 `sizeof` 的写法。",
			},
			Acceptance: []string{
				"代码里使用 `sizeof`。",
				"mock 判题将识别并返回 `8`。",
			},
			Runtime: "mock runtime · C++17",
			Examples: []ProblemExample{
				{Input: "(无输入)", Output: "8", Explanation: "在当前学习环境里，`double` 视作 8 字节。"},
			},
		},
		{
			ProblemSummary: ProblemSummary{
				Slug:       "char-badge",
				Title:      "字符徽章",
				Difficulty: "Easy",
				Type:       "类型题",
				Tags:       []string{"char", "输出", "A"},
				Mission:    "定义一个字符变量并输出字符 `A`。",
			},
			Description: "练习字符型变量的写法，知道字符要用单引号包起来。",
			StarterCode: `#include <iostream>
using namespace std;

int main() {
  // TODO
  return 0;
}`,
			Hints: []string{
				"可以写成 `char badge = 'A';`。",
				"输出字符变量本身即可。",
			},
			Acceptance: []string{
				"输出结果为 `A`。",
				"代码里出现 `char`。",
			},
			Runtime: "mock runtime · C++17",
			Examples: []ProblemExample{
				{Input: "(无输入)", Output: "A", Explanation: "字符变量需要使用单引号。"},
			},
		},
		{
			ProblemSummary: ProblemSummary{
				Slug:       "linux-compile-route",
				Title:      "Linux 编译路线",
				Difficulty: "Easy",
				Type:       "命令题",
				Tags:       []string{"Linux", "g++", "命令行"},
				Mission:    "写出在 Linux 里编译并运行 `hello.cpp` 的命令顺序。",
			},
			Description: "按照课件顺序，先编译 `hello.cpp`，再执行生成出的可执行文件。",
			StarterCode: `# 在下方写出命令顺序
`,
			Hints: []string{
				"第一条命令使用 `g++`。",
				"第二条命令以 `./` 开头。",
			},
			Acceptance: []string{
				"包含 `g++ hello.cpp -o hello`。",
				"包含 `./hello`。",
			},
			Runtime: "command mock · Linux branch",
			Examples: []ProblemExample{
				{
					Input:       "(无输入)",
					Output:      "g++ hello.cpp -o hello\n./hello",
					Explanation: "顺序必须先编译、后运行。",
				},
			},
		},
		{
			ProblemSummary: ProblemSummary{
				Slug:       "linux-gdb-route",
				Title:      "Linux gdb 路线",
				Difficulty: "Medium",
				Type:       "命令题",
				Tags:       []string{"Linux", "gdb", "-g"},
				Mission:    "写出开启调试信息并进入 gdb 的两条关键命令。",
			},
			Description: "先用 `-g` 重新编译，再进入 gdb，补齐 Linux 调试链路。",
			StarterCode: `# 在下方写出命令顺序
`,
			Hints: []string{
				"先写 `g++ -g hello.cpp -o hello`。",
				"第二条命令是 `gdb ./hello`。",
			},
			Acceptance: []string{
				"包含 `g++ -g hello.cpp -o hello`。",
				"包含 `gdb ./hello`。",
			},
			Runtime: "command mock · Linux branch",
			Examples: []ProblemExample{
				{
					Input:       "(无输入)",
					Output:      "g++ -g hello.cpp -o hello\ngdb ./hello",
					Explanation: "先携带调试信息编译，再进入 gdb。",
				},
			},
		},
		{
			ProblemSummary: ProblemSummary{
				Slug:       "gdb-break-watch",
				Title:      "gdb 断点观察",
				Difficulty: "Medium",
				Type:       "命令题",
				Tags:       []string{"gdb", "break main", "print"},
				Mission:    "写出进入 gdb 后设置断点、运行并查看变量的关键命令。",
			},
			Description: "补全 `break main`、`run`、`print score` 这条最小调试命令链。",
			StarterCode: `# 在下方写出 gdb 命令
`,
			Hints:      []string{"至少包含 `break main` 与 `print score`。", "中间记得加 `run`。"},
			Acceptance: []string{"包含 `break main`。", "包含 `run` 和 `print score`。"},
			Runtime:    "command mock · Linux branch",
			Examples: []ProblemExample{
				{
					Input:       "(无输入)",
					Output:      "break main\nrun\nprint score",
					Explanation: "这是进入 gdb 后最常见的一条起步调试链。",
				},
			},
		},
		{
			ProblemSummary: ProblemSummary{
				Slug:       "gdb-next-step",
				Title:      "gdb 单步前进",
				Difficulty: "Medium",
				Type:       "命令题",
				Tags:       []string{"gdb", "next", "run"},
				Mission:    "写出进入 gdb 后运行并使用 `next` 单步前进的命令链。",
			},
			Description: "补齐 `run` 到 `next` 的最小单步调试流程。",
			StarterCode: `# 在下方写出 gdb 命令
`,
			Hints:      []string{"先 `break main` 再 `run`。", "最后补上 `next`。"},
			Acceptance: []string{"包含 `break main`。", "包含 `run` 与 `next`。"},
			Runtime:    "command mock · Linux branch",
			Examples: []ProblemExample{
				{
					Input:       "(无输入)",
					Output:      "break main\nrun\nnext",
					Explanation: "这是最基础的一条单步执行路线。",
				},
			},
		},
	}

	leaderboard := []LeaderboardEntry{
		{Rank: 1, Name: "阿星", XP: 1480, Streak: 9, Title: "新手村速通王"},
		{Rank: 2, Name: "小布", XP: 1420, Streak: 8, Title: "条件分支猎手"},
		{Rank: 3, Name: "橘子汽水", XP: 1360, Streak: 7, Title: "函数实验员"},
		{Rank: 4, Name: "Linux Side Quest", XP: 1290, Streak: 5, Title: "终端漫游者"},
	}

	paths := []PathDetail{
		{
			PathSummary: PathSummary{
				Slug:           "cpp-rookie-village",
				Title:          "C++ 新手村",
				Subtitle:       "从环境准备到输入输出，把第一批基础能力一次搭起来。",
				Theme:          "入门启航",
				EstimatedHours: 12,
				LessonCount:    7,
				ChallengeCount: 4,
				FocusTags:      []string{"环境准备", "cout", "变量", "cin"},
				BossMission:    "完成第一段程序、变量输出和输入求和三连击。",
			},
			Description: "对应 DOCX 里最前面的入门章节，适合完全零基础学习者快速建立 C++ 控制台程序直觉。",
			Milestones: []string{
				"认识 VS2022 与 Linux 开发环境分别解决什么问题。",
				"理解 `main`、头文件、`cout`、注释这些最基础语法块。",
				"能够定义变量、常量并读取用户输入。",
			},
			Modules: []PathModule{
				{
					Title:   "模块 1：搭环境，点亮第一段程序",
					Summary: "先把 Windows / Linux 环境与第一段程序跑通。",
					Reward:  "解锁「Hello C++」入门徽章",
					Lessons: pickLessons(lessons, "lesson-env-setup", "lesson-first-program"),
				},
				{
					Title:   "模块 2：让程序会说话，也会接收输入",
					Summary: "覆盖输出、注释、变量常量、命名规则与 `cin` 输入。",
					Reward:  "获得「控制台表达者」称号",
					Lessons: pickLessons(lessons, "lesson-output-comments", "lesson-variables-constants", "lesson-const-macro"),
				},
				{
					Title:   "模块 3：命名规则与控制台输入",
					Summary: "理解关键字避坑、标识符命名和 `cin` 输入流程。",
					Reward:  "解锁「输入交互」练习组",
					Lessons: pickLessons(lessons, "lesson-identifiers-input", "lesson-keyword-rules"),
				},
			},
			RecommendedProblems: pickProblemSummaries(problems, "hello-cpp", "profile-console", "const-week-plan", "sum-two-values"),
		},
		{
			PathSummary: PathSummary{
				Slug:           "operator-arena",
				Title:          "运算竞技场",
				Subtitle:       "把运算符、条件判断和循环控制串成一条完整实战线。",
				Theme:          "逻辑对决",
				EstimatedHours: 15,
				LessonCount:    10,
				ChallengeCount: 11,
				FocusTags:      []string{"+=", "&&", "if", "switch", "while"},
				BossMission:    "通过门禁、逻辑守卫和星期映射，拿下控制流基础。",
			},
			Description: "这条路径承接课件中的算术运算、关系逻辑运算和控制流，是从“会写语句”走向“会组织逻辑”的关键阶段。",
			Milestones: []string{
				"能读懂并组合常见运算符。",
				"知道什么时候用 `if`，什么时候用 `switch`。",
				"可以用循环解决求和与重复处理问题。",
			},
			Modules: []PathModule{
				{
					Title:   "模块 1：运算符武器库",
					Summary: "集中练习加减乘除、取模和前后置自增这些最常见的数值操作。",
					Reward:  "获得「数值手感」加成",
					Lessons: pickLessons(lessons, "lesson-arithmetic-operators", "lesson-division-remainder", "lesson-prefix-postfix"),
				},
				{
					Title:   "模块 2：逻辑判断与优先级",
					Summary: "把关系运算、逻辑运算和括号优先级组合起来使用。",
					Reward:  "解锁「判断逻辑」徽章",
					Lessons: pickLessons(lessons, "lesson-relational-logic", "lesson-operator-precedence"),
				},
				{
					Title:   "模块 3：控制流试炼",
					Summary: "把 `if / switch / while / for / do...while / break / continue` 真正用到题目里。",
					Reward:  "解锁「分支与循环」试炼门票",
					Lessons: pickLessons(lessons, "lesson-branch-loop", "lesson-switch-while", "lesson-switch-default", "lesson-do-while-checkpoint", "lesson-break-continue"),
				},
			},
			RecommendedProblems: pickProblemSummaries(problems, "level-gate", "logic-guard", "bool-signal-tower", "operator-priority", "modulo-remainder", "prefix-postfix-lab", "switch-weekday", "switch-default-camp", "loop-sum", "do-while-password", "break-continue-route"),
		},
		{
			PathSummary: PathSummary{
				Slug:           "function-memory-lab",
				Title:          "函数与内存实验室",
				Subtitle:       "从函数拆分到指针内存，把程序结构感搭起来。",
				Theme:          "实验研究",
				EstimatedHours: 18,
				LessonCount:    10,
				ChallengeCount: 7,
				FocusTags:      []string{"函数", "作用域", "sizeof", "指针"},
				BossMission:    "完成引用交换与指针盒子两道代表题。",
			},
			Description: "这一条路径承接课件中的函数、作用域、调试、基础类型与动态内存内容，适合从基础语法进入结构化思维。",
			Milestones: []string{
				"理解函数为什么能帮助拆小问题。",
				"知道局部变量、全局变量和引用参数的差别。",
				"能写出最基础的 `new / delete` 流程。",
			},
			Modules: []PathModule{
				{
					Title:   "Lab 1：函数拆解与声明组织",
					Summary: "从函数声明、作用域到原型组织，搭起函数化思维的骨架。",
					Reward:  "拿到 `swapValue` 实验许可",
					Lessons: pickLessons(lessons, "lesson-functions-reference", "lesson-function-scope", "lesson-function-declaration-files"),
				},
				{
					Title:   "Lab 2：参数传递与返回值",
					Summary: "对比值传递、引用传递和返回值，理解函数如何与主流程交换结果。",
					Reward:  "获得「函数控制器」徽章",
					Lessons: pickLessons(lessons, "lesson-value-vs-reference", "lesson-function-return-value"),
				},
				{
					Title:   "Lab 3：调试视角下的类型与内存",
					Summary: "结合 `sizeof`、调试视角和指针操作，认识数据在内存里的形态。",
					Reward:  "解锁「内存观察员」徽章",
					Lessons: pickLessons(lessons, "lesson-basic-data-types", "lesson-vs-debug-workflow", "lesson-debug-types", "lesson-pointer-memory"),
				},
			},
			RecommendedProblems: pickProblemSummaries(problems, "swap-by-reference", "function-prototype", "value-copy-lab", "return-value-orb", "sizeof-scout", "char-badge", "pointer-box"),
		},
		{
			PathSummary: PathSummary{
				Slug:           "linux-side-quest",
				Title:          "Linux 支线",
				Subtitle:       "把 Linux 环境、编译命令和 gdb 调试流程落到终端里。",
				Theme:          "终端远征",
				EstimatedHours: 10,
				LessonCount:    7,
				ChallengeCount: 4,
				FocusTags:      []string{"Linux", "g++", "gdb", "./hello"},
				BossMission:    "在 Linux 下完成 hello.cpp 的编译、运行和基础调试。",
			},
			Description: "这是一条面向终端环境的加分路线，适合把 DOCX 中的 Linux 工具链内容单独拎出来练熟。",
			Milestones: []string{
				"掌握 `gcc / g++ / gdb` 的安装和角色分工。",
				"会写 `g++ hello.cpp -o hello` 与 `./hello`。",
				"知道如何带 `-g` 编译并进入 gdb。",
			},
			Modules: []PathModule{
				{
					Title:   "支线 1：安装并认识工具链",
					Summary: "明确 gcc、g++、gdb 的职责，并完成最基础安装。",
					Reward:  "获得「终端新兵」身份",
					Lessons: pickLessons(lessons, "lesson-linux-toolchain"),
				},
				{
					Title:   "支线 2：命令行编译与运行",
					Summary: "先把 `g++` 编译和 `./hello` 执行顺序跑通。",
					Reward:  "解锁 Linux 编译路线练习",
					Lessons: pickLessons(lessons, "lesson-linux-hello", "lesson-linux-gdb"),
				},
				{
					Title:   "支线 3：gdb 断点、观察与单步",
					Summary: "补齐 `break`、`run`、`print`、`next` 这条最小调试链。",
					Reward:  "获得「终端调试员」徽章",
					Lessons: pickLessons(lessons, "lesson-linux-gdb-breakpoint", "lesson-linux-print-watch", "lesson-linux-step-next"),
				},
			},
			RecommendedProblems: pickProblemSummaries(problems, "linux-compile-route", "linux-gdb-route", "gdb-break-watch", "gdb-next-step"),
		},
	}

	home := HomeResponse{
		Hero: HeroSection{
			Eyebrow:         "C++ Gameified Learning",
			Title:           "把基础课件扩成可闯关、可练习、可本地跑通的学习地图",
			Subtitle:        "本轮已根据 DOCX 补全环境准备、输入输出、变量常量、运算符、控制流、函数、指针与 Linux 工具链等模块，首页、路径页和题库页都会直接展示扩展后的内容。",
			PrimaryAction:   ActionLink{Label: "开始刷路径", Href: "/paths/cpp-rookie-village"},
			SecondaryAction: ActionLink{Label: "打开题库", Href: "/problems"},
			Metrics: []HeroMetric{
				{Label: "学习路径", Value: "4"},
				{Label: "课程模块", Value: "32"},
				{Label: "练习题", Value: "26"},
			},
		},
		DailyQuest: DailyQuest{
			Title:     "今日任务：完成运算竞技场主线",
			Reward:    "80 XP + 控制流徽章",
			Objective: "至少完成 1 道 Hello World 之后的逻辑题，并提交 if/switch/循环相关练习各一次。",
			Tips: []string{
				"先把判断条件写清楚，再决定输出哪个分支。",
				"循环题先手算一遍变量变化，再落代码更稳。",
				"Linux 支线建议在主线刷完后做，体验更顺。",
			},
		},
		FeaturedPaths:    toPathSummaries(paths),
		FeaturedLessons:  pickLessons(lessons, "lesson-prefix-postfix", "lesson-switch-default", "lesson-function-return-value", "lesson-value-vs-reference", "lesson-vs-debug-workflow", "lesson-linux-step-next"),
		FeaturedProblems: pickProblemSummaries(problems, "prefix-postfix-lab", "switch-default-camp", "return-value-orb", "value-copy-lab", "char-badge", "gdb-next-step"),
		Leaderboard:      leaderboard,
		ReleaseNotes: []string{
			"已根据 DOCX 继续扩充为 4 条路径、32 节课程、26 道练习。",
			"新增前后置自增、switch default、函数返回值、gdb next 单步等内容模块。",
			"首页、路径页、题库页与本地 API 数据已经同步更新。",
			"Judge0 接入口仍保留，当前继续支持 mock runtime 本地联调。",
		},
		Stack: StackSummary{
			Web:         "Next.js 16 + TypeScript + Tailwind CSS v4",
			Judge:       "run stays mock-first, submit supports worker-driven mock or real Judge0",
			Persistence: "PostgreSQL 17 + Redis 7 via Docker Compose",
		},
	}

	progress := ProgressOverview{
		XP:                1480,
		Streak:            7,
		CompletedLessons:  9,
		TotalLessons:      len(lessons),
		CompletedProblems: 4,
		TotalProblems:     len(problems),
		WeeklyTarget:      8,
		WeeklyCompleted:   5,
		CurrentPath: CurrentPathStatus{
			Slug:              "cpp-rookie-village",
			Title:             "C++ 新手村",
			ProgressPercent:   52,
			NextLessonTitle:   "标识符命名与输入数据",
			NextProblemTitle:  "两个数求和",
			RemainingMissions: 5,
		},
		RecentUnlocks: []string{
			"已解锁：运算竞技场",
			"已解锁：函数与内存实验室",
			"已解锁：Linux 支线",
		},
		RecommendedActions: []string{
			"先完成 `sum-two-values`，把 `cin` 和 `cout` 流程跑顺。",
			"接着挑战 `switch-weekday`，补齐 `switch` 和 `break` 的手感。",
			"最后去 Linux 支线写出完整的编译与运行命令。",
		},
	}

	return &Store{
		home:        home,
		paths:       paths,
		problems:    problems,
		leaderboard: leaderboard,
		progress:    progress,
		usersByID:   make(map[string]UserAccount),
		usersByMail: make(map[string]memoryUser),
		sessions:    make(map[string]SessionRecord),
	}
}

func (s *Store) GetHome() HomeResponse {
	if doc, ok := s.loadHomeDocument(); ok {
		if leaderboard, ok := s.loadLeaderboardCache(); ok {
			doc.Leaderboard = leaderboard
		}
		return doc
	}
	if leaderboard, ok := s.loadLeaderboardCache(); ok {
		s.home.Leaderboard = leaderboard
	}
	return s.home
}

func (s *Store) GetPaths() []PathSummary {
	if docs, ok := s.loadPathsDocument(); ok {
		return toPathSummaries(docs)
	}
	return toPathSummaries(s.paths)
}

func (s *Store) FindPath(slug string) (PathDetail, bool) {
	if docs, ok := s.loadPathsDocument(); ok {
		for _, item := range docs {
			if item.Slug == slug {
				return item, true
			}
		}
		return PathDetail{}, false
	}

	for _, item := range s.paths {
		if item.Slug == slug {
			return item, true
		}
	}
	return PathDetail{}, false
}

func (s *Store) GetFeaturedLessons() []Lesson {
	if doc, ok := s.loadHomeDocument(); ok {
		return doc.FeaturedLessons
	}
	return s.home.FeaturedLessons
}

func (s *Store) GetProblems() []ProblemSummary {
	if docs, ok := s.loadProblemsDocument(); ok {
		return pickProblemSummaries(docs)
	}
	return pickProblemSummaries(s.problems)
}

func (s *Store) FindProblem(slug string) (ProblemDetail, bool) {
	if docs, ok := s.loadProblemsDocument(); ok {
		for _, item := range docs {
			if item.Slug == slug {
				return item, true
			}
		}
		return ProblemDetail{}, false
	}

	for _, item := range s.problems {
		if item.Slug == slug {
			return item, true
		}
	}
	return ProblemDetail{}, false
}

func (s *Store) GetLeaderboard() []LeaderboardEntry {
	if doc, ok := s.loadLeaderboardCache(); ok {
		return doc
	}
	if doc, ok := s.loadLeaderboardDocument(); ok {
		return doc
	}
	return s.leaderboard
}

func (s *Store) GetProgressOverview() ProgressOverview {
	if doc, ok := s.loadProgressDocument(); ok {
		return doc
	}
	return s.progress
}

func pickLessons(all []Lesson, ids ...string) []Lesson {
	selected := make([]Lesson, 0, len(ids))
	for _, id := range ids {
		for _, item := range all {
			if item.ID == id {
				selected = append(selected, item)
				break
			}
		}
	}
	return selected
}

func pickProblemSummaries(all []ProblemDetail, slugs ...string) []ProblemSummary {
	if len(slugs) == 0 {
		result := make([]ProblemSummary, 0, len(all))
		for _, item := range all {
			result = append(result, item.ProblemSummary)
		}
		return result
	}

	selected := make([]ProblemSummary, 0, len(slugs))
	for _, slug := range slugs {
		for _, item := range all {
			if item.Slug == slug {
				selected = append(selected, item.ProblemSummary)
				break
			}
		}
	}
	return selected
}

func toPathSummaries(all []PathDetail) []PathSummary {
	result := make([]PathSummary, 0, len(all))
	for _, item := range all {
		result = append(result, item.PathSummary)
	}
	return result
}
