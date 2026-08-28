package main

import (
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

// verifies that escapeMarkdownV2 prefixes each Telegram-reserved character with a backslash
func TestEscapeMarkdownV2(t *testing.T) {
	cases := map[string]string{
		"hello":             "hello",
		"a.b":               `a\.b`,
		"under_score":       `under\_score`,
		"a*b_c[d]":          `a\*b\_c\[d\]`,
		"(parens)":          `\(parens\)`,
		"a!b#c":             `a\!b\#c`,
		"path/with/slashes": "path/with/slashes",
		`back\slash`:        `back\\slash`,
	}
	for in, want := range cases {
		got := escapeMarkdownV2(in)
		if got != want {
			t.Errorf("escapeMarkdownV2(%q) = %q, want %q", in, got, want)
		}
	}
}

// verifies that buildMessage embeds every relevant lead field and escapes user-supplied content
func TestBuildMessage_ContainsFields(t *testing.T) {
	lead := Lead{
		ID:         "REQ-123456",
		ReceivedAt: time.Date(2026, 4, 25, 18, 0, 0, 0, time.UTC),
		Nome:       "Maria",
		Papel:      "catador",
		Cidade:     "São Paulo",
		Contato:    "11999998888",
		Mensagem:   "preciso testar.",
	}
	msg := buildMessage(lead)
	mustContain := []string{"REQ\\-123456", "Maria", "catador", "São Paulo", "11999998888", "preciso testar\\.", "Cataí"}
	for _, want := range mustContain {
		if !strings.Contains(msg, want) {
			t.Errorf("buildMessage missing %q\nfull message:\n%s", want, msg)
		}
	}
}

// verifies that Notify POSTs to the Telegram sendMessage endpoint with chat_id and MarkdownV2
func TestTelegramNotifier_PostsToEndpoint(t *testing.T) {
	var gotPath, gotBody string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotPath = r.URL.Path
		body, _ := io.ReadAll(r.Body)
		gotBody = string(body)
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"ok":true}`))
	}))
	defer srv.Close()

	n := &TelegramNotifier{
		BotToken: "TKN",
		ChatID:   "42",
		Endpoint: srv.URL,
		Client:   srv.Client(),
	}
	err := n.Notify(context.Background(), Lead{ID: "REQ-1", Nome: "n", Contato: "a@b.com"})
	if err != nil {
		t.Fatalf("notify: %v", err)
	}
	if gotPath != "/botTKN/sendMessage" {
		t.Errorf("got path %q, want /botTKN/sendMessage", gotPath)
	}
	if !strings.Contains(gotBody, `"chat_id":"42"`) {
		t.Errorf("body missing chat_id: %s", gotBody)
	}
	if !strings.Contains(gotBody, `"parse_mode":"MarkdownV2"`) {
		t.Errorf("body missing parse_mode MarkdownV2: %s", gotBody)
	}
}

// verifies that a non-2xx response from Telegram surfaces as an error
func TestTelegramNotifier_NonOKReturnsError(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusBadRequest)
		_, _ = w.Write([]byte(`{"ok":false,"description":"bad markdown"}`))
	}))
	defer srv.Close()

	n := &TelegramNotifier{BotToken: "T", ChatID: "1", Endpoint: srv.URL, Client: srv.Client()}
	err := n.Notify(context.Background(), Lead{ID: "X", Nome: "n", Contato: "a@b.com"})
	if err == nil {
		t.Fatal("expected error from 400 response")
	}
}

// verifies that missing token or chat_id fails fast without making a network call
func TestTelegramNotifier_MissingCredentials(t *testing.T) {
	n := &TelegramNotifier{}
	if err := n.Notify(context.Background(), Lead{}); err == nil {
		t.Error("expected error when both creds missing")
	}
	n2 := &TelegramNotifier{BotToken: "T"}
	if err := n2.Notify(context.Background(), Lead{}); err == nil {
		t.Error("expected error when chat_id missing")
	}
}

// verifies that NoopNotifier never returns an error (used when Telegram disabled)
func TestNoopNotifier(t *testing.T) {
	if err := (NoopNotifier{}).Notify(context.Background(), Lead{}); err != nil {
		t.Errorf("noop should never error, got %v", err)
	}
}
