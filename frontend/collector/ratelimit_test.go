package main

import (
	"sync/atomic"
	"testing"
	"time"
)

// verifies that a fresh limiter allows submissions up to the configured threshold and blocks the next one
func TestWindowLimiter_AllowsUpToLimit(t *testing.T) {
	now := time.Date(2026, 4, 25, 0, 0, 0, 0, time.UTC)
	l := NewWindowLimiter(3, time.Hour, func() time.Time { return now })

	for i := 0; i < 3; i++ {
		if !l.Allow("ip-1") {
			t.Errorf("attempt %d: expected allow", i)
		}
	}
	if l.Allow("ip-1") {
		t.Error("expected 4th attempt to be blocked")
	}
}

// verifies that two distinct keys have independent buckets
func TestWindowLimiter_KeysAreIndependent(t *testing.T) {
	now := time.Date(2026, 4, 25, 0, 0, 0, 0, time.UTC)
	l := NewWindowLimiter(1, time.Hour, func() time.Time { return now })

	if !l.Allow("ip-a") {
		t.Fatal("ip-a first hit should be allowed")
	}
	if !l.Allow("ip-b") {
		t.Error("ip-b first hit should be allowed even after ip-a hit")
	}
	if l.Allow("ip-a") {
		t.Error("ip-a second hit should be blocked")
	}
}

// verifies that gc removes buckets whose lastSeen is older than the cutoff
func TestWindowLimiter_GCEvictsOldBuckets(t *testing.T) {
	now := time.Date(2026, 4, 25, 0, 0, 0, 0, time.UTC)
	l := NewWindowLimiter(10, time.Hour, func() time.Time { return now })
	l.buckets["fresh"] = &bucket{lastSeen: now}
	l.buckets["stale"] = &bucket{lastSeen: now.Add(-2 * time.Hour)}
	l.gc(now.Add(-time.Hour))
	if _, ok := l.buckets["stale"]; ok {
		t.Error("stale bucket should be evicted")
	}
	if _, ok := l.buckets["fresh"]; !ok {
		t.Error("fresh bucket must remain")
	}
}

// verifies that hits older than the window are evicted and capacity is restored
func TestWindowLimiter_HitsExpire(t *testing.T) {
	var current atomic.Int64
	current.Store(time.Date(2026, 4, 25, 0, 0, 0, 0, time.UTC).Unix())
	now := func() time.Time { return time.Unix(current.Load(), 0).UTC() }

	l := NewWindowLimiter(2, time.Hour, now)
	if !l.Allow("ip") {
		t.Fatal("hit 1")
	}
	if !l.Allow("ip") {
		t.Fatal("hit 2")
	}
	if l.Allow("ip") {
		t.Fatal("hit 3 should block")
	}

	current.Add(int64((time.Hour + time.Second).Seconds()))
	if !l.Allow("ip") {
		t.Error("after window expiry the bucket should accept again")
	}
}
