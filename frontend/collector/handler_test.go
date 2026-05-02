package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
	"log"
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"
	"time"
)

type fakeStorage struct {
	mu      sync.Mutex
	appended []Lead
	err     error
}

func (f *fakeStorage) Append(_ context.Context, lead Lead) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	if f.err != nil {
		return f.err
	}
	f.appended = append(f.appended, lead)
	return nil
}

func (f *fakeStorage) snapshot() []Lead {
	f.mu.Lock()
	defer f.mu.Unlock()
	out := make([]Lead, len(f.appended))
	copy(out, f.appended)
	return out
}

type fakeNotifier struct {
	mu     sync.Mutex
	called []Lead
	err    error
	wait   chan struct{}
}

func (f *fakeNotifier) Notify(_ context.Context, lead Lead) error {
	f.mu.Lock()
	f.called = append(f.called, lead)
	f.mu.Unlock()
	if f.wait != nil {
		f.wait <- struct{}{}
	}
	return f.err
}

func (f *fakeNotifier) snapshot() []Lead {
	f.mu.Lock()
	defer f.mu.Unlock()
	out := make([]Lead, len(f.called))
	copy(out, f.called)
	return out
}

type fakeLimiter struct {
	allow bool
	keys  []string
	mu    sync.Mutex
}

func (f *fakeLimiter) Allow(key string) bool {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.keys = append(f.keys, key)
	return f.allow
}

func newTestHandler(t *testing.T, st Storage, nt Notifier, lm Limiter) *Handler {
	t.Helper()
	return NewHandler(Deps{
		Storage:  st,
		Notifier: nt,
		Limiter:  lm,
		Now:      func() time.Time { return time.Date(2026, 4, 25, 0, 0, 0, 0, time.UTC) },
		NewID:    func() string { return "REQ-000777" },
		Logger:   log.New(io.Discard, "", 0),
	})
}

func postJSON(h http.Handler, body any, headers map[string]string) *httptest.ResponseRecorder {
	buf, _ := json.Marshal(body)
	req := httptest.NewRequest(http.MethodPost, "/contact", bytes.NewReader(buf))
	req.Header.Set("Content-Type", "application/json")
	for k, v := range headers {
		req.Header.Set(k, v)
	}
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	return rec
}

// verifies POST /contact with a valid submission returns 200 with ref and persists+notifies
func TestHandler_ValidSubmission(t *testing.T) {
	st := &fakeStorage{}
	nt := &fakeNotifier{wait: make(chan struct{}, 1)}
	lm := &fakeLimiter{allow: true}
	h := newTestHandler(t, st, nt, lm)

	rec := postJSON(h, Submission{
		Nome: "Maria", Papel: "catador", Cidade: "São Paulo",
		Contato: "11999998888", Mensagem: "ola",
	}, map[string]string{"X-Forwarded-For": "203.0.113.5, 198.51.100.1"})

	if rec.Code != http.StatusOK {
		t.Fatalf("status %d, want 200; body=%s", rec.Code, rec.Body)
	}
	var ok successResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &ok); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if ok.Ref != "REQ-000777" {
		t.Errorf("ref=%q, want REQ-000777", ok.Ref)
	}
	if got := st.snapshot(); len(got) != 1 || got[0].Contato != "11999998888" {
		t.Errorf("storage got %+v", got)
	}
	if got := st.snapshot(); got[0].IP != "203.0.113.5" {
		t.Errorf("ip=%q, want 203.0.113.5 (first XFF entry)", got[0].IP)
	}

	select {
	case <-nt.wait:
	case <-time.After(2 * time.Second):
		t.Error("notifier was not called within 2s")
	}
	if got := nt.snapshot(); len(got) != 1 {
		t.Errorf("notifier called %d times, want 1", len(got))
	}
}

// verifies POST /contact with the honeypot field filled returns 200 silently with no side effects
func TestHandler_HoneypotSilentlyAccepts(t *testing.T) {
	st := &fakeStorage{}
	nt := &fakeNotifier{}
	lm := &fakeLimiter{allow: true}
	h := newTestHandler(t, st, nt, lm)

	rec := postJSON(h, Submission{
		Nome: "Bot", Papel: "catador", Cidade: "X", Contato: "Y",
		Website: "http://spam.example",
	}, nil)

	if rec.Code != http.StatusOK {
		t.Errorf("status %d, want 200", rec.Code)
	}
	if got := st.snapshot(); len(got) != 0 {
		t.Errorf("storage should be empty after honeypot, got %+v", got)
	}
	if got := nt.snapshot(); len(got) != 0 {
		t.Errorf("notifier should not be called, got %+v", got)
	}
}

// verifies POST /contact with rate limit exceeded returns 429 and does not persist
func TestHandler_RateLimitedReturns429(t *testing.T) {
	st := &fakeStorage{}
	nt := &fakeNotifier{}
	lm := &fakeLimiter{allow: false}
	h := newTestHandler(t, st, nt, lm)

	rec := postJSON(h, Submission{Nome: "a", Papel: "catador", Cidade: "b", Contato: "c"}, nil)

	if rec.Code != http.StatusTooManyRequests {
		t.Errorf("status %d, want 429", rec.Code)
	}
	if got := st.snapshot(); len(got) != 0 {
		t.Errorf("storage should be empty when rate limited")
	}
}

// verifies POST /contact with an invalid papel returns 400 with field=papel
func TestHandler_InvalidPapelReturns400(t *testing.T) {
	st := &fakeStorage{}
	nt := &fakeNotifier{}
	lm := &fakeLimiter{allow: true}
	h := newTestHandler(t, st, nt, lm)

	rec := postJSON(h, Submission{Nome: "a", Papel: "presidente", Cidade: "b", Contato: "c"}, nil)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status %d, want 400", rec.Code)
	}
	var er errorResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &er); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if er.Field != "papel" {
		t.Errorf("field=%q, want papel", er.Field)
	}
}

// verifies POST /contact with malformed JSON returns 400
func TestHandler_MalformedJSONReturns400(t *testing.T) {
	st := &fakeStorage{}
	nt := &fakeNotifier{}
	lm := &fakeLimiter{allow: true}
	h := newTestHandler(t, st, nt, lm)

	req := httptest.NewRequest(http.MethodPost, "/contact", bytes.NewBufferString(`{not json`))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusBadRequest {
		t.Errorf("status %d, want 400", rec.Code)
	}
}

// verifies POST /contact rejects non-POST methods with 405
func TestHandler_RejectsNonPost(t *testing.T) {
	h := newTestHandler(t, &fakeStorage{}, &fakeNotifier{}, &fakeLimiter{allow: true})
	for _, m := range []string{http.MethodGet, http.MethodPut, http.MethodDelete} {
		req := httptest.NewRequest(m, "/contact", nil)
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, req)
		if rec.Code != http.StatusMethodNotAllowed {
			t.Errorf("%s: status %d, want 405", m, rec.Code)
		}
	}
}

// verifies that storage failure surfaces as 500 and the notifier is not called
func TestHandler_StorageFailureReturns500(t *testing.T) {
	st := &fakeStorage{err: errors.New("disk full")}
	nt := &fakeNotifier{}
	lm := &fakeLimiter{allow: true}
	h := newTestHandler(t, st, nt, lm)

	rec := postJSON(h, Submission{Nome: "a", Papel: "catador", Cidade: "b", Contato: "c"}, nil)
	if rec.Code != http.StatusInternalServerError {
		t.Errorf("status %d, want 500", rec.Code)
	}
	if got := nt.snapshot(); len(got) != 0 {
		t.Errorf("notifier should not be called when storage fails")
	}
}

// verifies that CF-Connecting-IP wins over X-Forwarded-For for rate-limiting key
func TestHandler_PrefersCFConnectingIP(t *testing.T) {
	st := &fakeStorage{}
	nt := &fakeNotifier{}
	lm := &fakeLimiter{allow: true}
	h := newTestHandler(t, st, nt, lm)

	postJSON(h, Submission{Nome: "a", Papel: "catador", Cidade: "b", Contato: "c"}, map[string]string{
		"CF-Connecting-IP": "203.0.113.7",
		"X-Forwarded-For":  "198.51.100.1",
	})
	if len(lm.keys) != 1 || lm.keys[0] != "203.0.113.7" {
		t.Errorf("limiter keys=%v, want [203.0.113.7]", lm.keys)
	}
}

// verifies that an oversized request body is rejected without crashing the handler
func TestHandler_OversizedBodyRejected(t *testing.T) {
	st := &fakeStorage{}
	nt := &fakeNotifier{}
	lm := &fakeLimiter{allow: true}
	h := newTestHandler(t, st, nt, lm)

	huge := bytes.Repeat([]byte("a"), maxBodyBytes+1024)
	req := httptest.NewRequest(http.MethodPost, "/contact", bytes.NewReader(huge))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusBadRequest {
		t.Errorf("status %d, want 400 (body too large)", rec.Code)
	}
}
