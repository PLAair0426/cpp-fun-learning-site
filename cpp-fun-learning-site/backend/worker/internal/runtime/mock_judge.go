package runtime

import "strings"

func simulateSubmission(record SubmissionRecord) (stdout string, compileOutput string, result string) {
	source := strings.TrimSpace(record.SourceCode)
	normalized := strings.ToLower(source)

	switch {
	case strings.Contains(normalized, "todo") && !strings.Contains(normalized, "cout"):
		return "", "Incomplete code detected. Please finish the logic.", "NEEDS_WORK"
	case strings.Contains(normalized, "syntax_error"):
		return "", "Mock compile failed: check semicolons or brackets.", "COMPILE_ERROR"
	case strings.Contains(normalized, "g++ hello.cpp -o hello") && strings.Contains(normalized, "./hello"):
		return "Compile command order is correct. Linux path can continue.", "", "ACCEPTED"
	case strings.Contains(normalized, "hello c++"):
		return "Hello C++", "", "ACCEPTED"
	case strings.Contains(normalized, "2+3*4") || strings.Contains(normalized, "2 + 3 * 4") || strings.Contains(normalized, "priorityscore"):
		return "14", "", "ACCEPTED"
	case strings.Contains(normalized, "calculatexp") || strings.Contains(normalized, "prototype"):
		return "42", "", "ACCEPTED"
	case strings.Contains(normalized, "sizeof") && strings.Contains(normalized, "double"):
		return "8", "", "ACCEPTED"
	case strings.Contains(normalized, "%") || strings.Contains(normalized, "remainder"):
		return "1", "", "ACCEPTED"
	case strings.Contains(normalized, "++") && strings.Contains(normalized, "count"):
		return "COUNT", "", "ACCEPTED"
	case strings.Contains(normalized, "continue") && strings.Contains(normalized, "skip"):
		return "SKIP", "", "ACCEPTED"
	case strings.Contains(normalized, "default") && strings.Contains(normalized, "rest"):
		return "REST", "", "ACCEPTED"
	case strings.Contains(normalized, "copyvalue") || strings.Contains(normalized, "unchanged"):
		return "UNCHANGED", "", "ACCEPTED"
	case strings.Contains(normalized, "doublexp") && strings.Contains(normalized, "return"):
		return "64", "", "ACCEPTED"
	case strings.Contains(normalized, "const int days") || strings.Contains(normalized, "#define months"):
		return "7", "", "ACCEPTED"
	case strings.Contains(normalized, "safe") || strings.Contains(normalized, "alert"):
		return "SAFE", "", "ACCEPTED"
	case strings.Contains(normalized, "char") && strings.Contains(normalized, "'a'"):
		return "A", "", "ACCEPTED"
	case strings.Contains(normalized, "g++ -g hello.cpp -o hello") && strings.Contains(normalized, "gdb ./hello"):
		return "GDB", "", "ACCEPTED"
	case strings.Contains(normalized, "break main") && strings.Contains(normalized, "print score"):
		return "BREAK", "", "ACCEPTED"
	case strings.Contains(normalized, "break main") && strings.Contains(normalized, "next"):
		return "NEXT", "", "ACCEPTED"
	case strings.Contains(normalized, "open") || strings.Contains(normalized, "wait"):
		return "OPEN", "", "ACCEPTED"
	case strings.Contains(normalized, "mon") || strings.Contains(normalized, "tue") || strings.Contains(normalized, "wed"):
		return "MON", "", "ACCEPTED"
	case strings.Contains(normalized, "sum") || strings.Contains(normalized, "total"):
		return "8", "", "ACCEPTED"
	case strings.Contains(normalized, "pass") || strings.Contains(normalized, "retry"):
		return "PASS", "", "ACCEPTED"
	case strings.Contains(normalized, "swapvalue") || strings.Contains(normalized, "delete"):
		return "Mock execution finished: logic structure recognized.", "", "ACCEPTED"
	default:
		return "Mock runner accepted the code and returned instant feedback.", "", "RUN_FINISHED"
	}
}


