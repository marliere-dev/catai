package main

import (
	"bufio"
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
	"testing"
	"time"
)

// verifies that Append writes one JSONL line per call and preserves field values
func TestFileStorage_AppendWritesJSONLLine(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "contacts.jsonl")
	s := NewFileStorage(path)

	lead := Lead{
		ID:         "REQ-000001",
		ReceivedAt: time.Date(2026, 4, 25, 18, 0, 0, 0, time.UTC),
		IP:         "1.2.3.4",
		UserAgent:  "ua",
		Nome:       "Maria",
		Papel:      "catador",
		Cidade:     "São Paulo",
		Contato:    "11999998888",
		Mensagem:   "ola",
	}
	if err := s.Append(context.Background(), lead); err != nil {
		t.Fatalf("append: %v", err)
	}
	if err := s.Append(context.Background(), Lead{ID: "REQ-000002", Contato: "x@y.com"}); err != nil {
		t.Fatalf("append 2: %v", err)
	}

	f, err := os.Open(path)
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	defer f.Close()
	scanner := bufio.NewScanner(f)
	var lines []string
	for scanner.Scan() {
		lines = append(lines, scanner.Text())
	}
	if len(lines) != 2 {
		t.Fatalf("got %d lines, want 2", len(lines))
	}
	var got Lead
	if err := json.Unmarshal([]byte(lines[0]), &got); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if got.ID != lead.ID || got.Contato != lead.Contato || got.Nome != lead.Nome {
		t.Errorf("decoded lead mismatch: %+v", got)
	}
}

// verifies that concurrent Append calls do not interleave bytes within a line
func TestFileStorage_ConcurrentAppendIsLineSafe(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "contacts.jsonl")
	s := NewFileStorage(path)

	const N = 50
	var wg sync.WaitGroup
	wg.Add(N)
	for i := 0; i < N; i++ {
		go func(i int) {
			defer wg.Done()
			_ = s.Append(context.Background(), Lead{ID: "REQ-X", Nome: "n", Contato: "a@b.com"})
			_ = i
		}(i)
	}
	wg.Wait()

	f, err := os.Open(path)
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	defer f.Close()
	scanner := bufio.NewScanner(f)
	count := 0
	for scanner.Scan() {
		var l Lead
		if err := json.Unmarshal(scanner.Bytes(), &l); err != nil {
			t.Errorf("line %d not valid JSON: %v", count, err)
		}
		count++
	}
	if count != N {
		t.Errorf("got %d lines, want %d", count, N)
	}
}

// verifies that Append surfaces an error when the target path is unwritable
func TestFileStorage_AppendErrorsOnUnwritablePath(t *testing.T) {
	s := NewFileStorage("/nope/this/path/does/not/exist.jsonl")
	err := s.Append(context.Background(), Lead{ID: "x", Contato: "a@b.com"})
	if err == nil {
		t.Fatal("expected error for unwritable path, got nil")
	}
}
