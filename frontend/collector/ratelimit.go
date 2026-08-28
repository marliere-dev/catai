package main

import (
	"sync"
	"time"
)

type Limiter interface {
	Allow(key string) bool
}

type bucket struct {
	hits     []time.Time
	lastSeen time.Time
}

type WindowLimiter struct {
	mu      sync.Mutex
	buckets map[string]*bucket
	limit   int
	window  time.Duration
	now     func() time.Time
}

func NewWindowLimiter(limit int, window time.Duration, now func() time.Time) *WindowLimiter {
	if now == nil {
		now = time.Now
	}
	return &WindowLimiter{
		buckets: map[string]*bucket{},
		limit:   limit,
		window:  window,
		now:     now,
	}
}

func (l *WindowLimiter) Allow(key string) bool {
	l.mu.Lock()
	defer l.mu.Unlock()

	now := l.now()
	cutoff := now.Add(-l.window)

	b, ok := l.buckets[key]
	if !ok {
		b = &bucket{}
		l.buckets[key] = b
	}

	kept := b.hits[:0]
	for _, t := range b.hits {
		if t.After(cutoff) {
			kept = append(kept, t)
		}
	}
	b.hits = kept
	b.lastSeen = now

	if len(b.hits) >= l.limit {
		return false
	}
	b.hits = append(b.hits, now)

	if len(l.buckets) > 1024 {
		l.gc(cutoff)
	}
	return true
}

func (l *WindowLimiter) gc(cutoff time.Time) {
	for k, b := range l.buckets {
		if b.lastSeen.Before(cutoff) {
			delete(l.buckets, k)
		}
	}
}
