package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"sync"
)

type Storage interface {
	Append(ctx context.Context, lead Lead) error
}

type FileStorage struct {
	path string
	mu   sync.Mutex
}

func NewFileStorage(path string) *FileStorage {
	return &FileStorage{path: path}
}

func (s *FileStorage) Append(_ context.Context, lead Lead) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	f, err := os.OpenFile(s.path, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0o644)
	if err != nil {
		return fmt.Errorf("open jsonl: %w", err)
	}
	defer f.Close()

	line, err := json.Marshal(lead)
	if err != nil {
		return fmt.Errorf("marshal lead: %w", err)
	}
	line = append(line, '\n')
	if _, err := f.Write(line); err != nil {
		return fmt.Errorf("write jsonl: %w", err)
	}
	return nil
}
