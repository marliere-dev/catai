package main

import (
	"net"
	"net/http"
	"net/http/httptest"
	"testing"
)

func startHealthServer(t *testing.T, status int) string {
	t.Helper()
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/health" {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		w.WriteHeader(status)
	}))
	t.Cleanup(srv.Close)
	_, port, err := net.SplitHostPort(srv.Listener.Addr().String())
	if err != nil {
		t.Fatal(err)
	}
	return ":" + port
}

func TestRunHealthcheckAcceptsOK(t *testing.T) {
	if err := runHealthcheck(startHealthServer(t, http.StatusOK)); err != nil {
		t.Fatalf("esperava sucesso: %v", err)
	}
}

func TestRunHealthcheckRejectsServerError(t *testing.T) {
	if err := runHealthcheck(startHealthServer(t, http.StatusServiceUnavailable)); err == nil {
		t.Fatal("esperava erro para status 503")
	}
}

func TestRunHealthcheckRejectsClosedPort(t *testing.T) {
	addr := startHealthServer(t, http.StatusOK)
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	_, port, _ := net.SplitHostPort(listener.Addr().String())
	listener.Close()
	if port == addr[1:] {
		t.Skip("porta repetida")
	}
	if err := runHealthcheck(":" + port); err == nil {
		t.Fatal("esperava erro com a porta fechada")
	}
}

func TestRunHealthcheckRejectsInvalidAddress(t *testing.T) {
	if err := runHealthcheck("sem-porta"); err == nil {
		t.Fatal("esperava erro de endereço")
	}
}
