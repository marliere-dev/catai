package main

import (
	"log"
	"regexp"
	"testing"
)

// verifies that newID returns a string matching REQ- followed by 6 digits
func TestNewID_FormatMatches(t *testing.T) {
	re := regexp.MustCompile(`^REQ-\d{6}$`)
	for i := 0; i < 50; i++ {
		got := newID()
		if !re.MatchString(got) {
			t.Errorf("newID()=%q does not match REQ-NNNNNN", got)
		}
	}
}

// verifies that envOr returns the env value when set and the default otherwise
func TestEnvOr(t *testing.T) {
	t.Setenv("PH_TEST_KEY", "from-env")
	if got := envOr("PH_TEST_KEY", "fallback"); got != "from-env" {
		t.Errorf("got %q, want from-env", got)
	}
	if got := envOr("PH_DEFINITELY_UNSET_X9Y", "fallback"); got != "fallback" {
		t.Errorf("got %q, want fallback", got)
	}
}

// verifies that loadConfig applies defaults and env overrides correctly
func TestLoadConfig(t *testing.T) {
	t.Setenv("ADDR", "")
	t.Setenv("JSONL_PATH", "")
	t.Setenv("TELEGRAM_BOT_TOKEN", "TKN-X")
	t.Setenv("TELEGRAM_CHAT_ID", "42")
	t.Setenv("RATE_LIMIT_PER_IP_PER_HOUR", "25")

	c := loadConfig(log.New(discardWriter{}, "", 0))
	if c.Addr != ":8081" {
		t.Errorf("Addr=%q, want :8081", c.Addr)
	}
	if c.JSONLPath != "/data/contacts.jsonl" {
		t.Errorf("JSONLPath=%q", c.JSONLPath)
	}
	if c.TelegramBotToken != "TKN-X" || c.TelegramChatID != "42" {
		t.Errorf("telegram creds wrong: %+v", c)
	}
	if c.RateLimitPerHour != 25 {
		t.Errorf("RateLimitPerHour=%d, want 25", c.RateLimitPerHour)
	}
}

// verifies that loadConfig falls back to default when RATE_LIMIT env is invalid
func TestLoadConfig_InvalidRateLimitFallsBack(t *testing.T) {
	t.Setenv("RATE_LIMIT_PER_IP_PER_HOUR", "not-a-number")
	c := loadConfig(log.New(discardWriter{}, "", 0))
	if c.RateLimitPerHour != 10 {
		t.Errorf("RateLimitPerHour=%d, want default 10", c.RateLimitPerHour)
	}
}

// verifies that trimToLen truncates only when input exceeds n
func TestTrimToLen(t *testing.T) {
	if got := trimToLen("abcdef", 3); got != "abc" {
		t.Errorf("got %q, want abc", got)
	}
	if got := trimToLen("ab", 3); got != "ab" {
		t.Errorf("got %q, want ab", got)
	}
	if got := trimToLen("", 3); got != "" {
		t.Errorf("empty input should stay empty, got %q", got)
	}
}

// verifies that NewWindowLimiter with nil now uses time.Now as default
func TestNewWindowLimiter_NilNowUsesTimeNow(t *testing.T) {
	l := NewWindowLimiter(2, 0, nil)
	if l.now == nil {
		t.Fatal("expected default now func, got nil")
	}
}

// verifies that NewTelegramNotifier sets the default endpoint and a non-nil client
func TestNewTelegramNotifier_Defaults(t *testing.T) {
	n := NewTelegramNotifier("tok", "1")
	if n.Endpoint != "https://api.telegram.org" {
		t.Errorf("endpoint=%q", n.Endpoint)
	}
	if n.Client == nil || n.Client.Timeout == 0 {
		t.Errorf("client not initialised: %+v", n.Client)
	}
	if n.BotToken != "tok" || n.ChatID != "1" {
		t.Errorf("creds wrong: %+v", n)
	}
}

type discardWriter struct{}

func (discardWriter) Write(p []byte) (int, error) { return len(p), nil }
