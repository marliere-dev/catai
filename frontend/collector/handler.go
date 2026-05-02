package main

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net"
	"net/http"
	"strings"
	"time"
)

const maxBodyBytes = 64 << 10 // 64 KB

type Deps struct {
	Storage  Storage
	Notifier Notifier
	Limiter  Limiter
	Now      func() time.Time
	NewID    func() string
	Logger   *log.Logger
	NotifyTimeout time.Duration
}

type Handler struct {
	deps Deps
}

func NewHandler(d Deps) *Handler {
	if d.Now == nil {
		d.Now = time.Now
	}
	if d.NewID == nil {
		d.NewID = newID
	}
	if d.Logger == nil {
		d.Logger = log.Default()
	}
	if d.NotifyTimeout == 0 {
		d.NotifyTimeout = 15 * time.Second
	}
	return &Handler{deps: d}
}

type errorResponse struct {
	Error string `json:"error"`
	Field string `json:"field,omitempty"`
}

type successResponse struct {
	Ref string `json:"ref"`
}

func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, errorResponse{Error: "method not allowed"})
		return
	}

	ip := clientIP(r)

	r.Body = http.MaxBytesReader(w, r.Body, maxBodyBytes)
	defer r.Body.Close()

	var sub Submission
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	if err := dec.Decode(&sub); err != nil {
		writeJSON(w, http.StatusBadRequest, errorResponse{Error: "invalid json"})
		return
	}
	sub = sub.Trimmed()

	// Honeypot: bot filled the hidden input. Pretend success without
	// persisting or notifying — bots get no signal that something
	// blocked them.
	if sub.Website != "" {
		writeJSON(w, http.StatusOK, successResponse{Ref: h.deps.NewID()})
		return
	}

	if !h.deps.Limiter.Allow(ip) {
		writeJSON(w, http.StatusTooManyRequests, errorResponse{Error: "rate limit"})
		return
	}

	if vErr := sub.Validate(); vErr != nil {
		writeJSON(w, http.StatusBadRequest, errorResponse{Error: vErr.Message, Field: vErr.Field})
		return
	}

	lead := Lead{
		ID:         h.deps.NewID(),
		ReceivedAt: h.deps.Now().UTC(),
		IP:         ip,
		UserAgent:  trimToLen(r.UserAgent(), maxShortField),
		Nome:       sub.Nome,
		Papel:      sub.Papel,
		Cidade:     sub.Cidade,
		Contato:    sub.Contato,
		Mensagem:   sub.Mensagem,
	}

	if err := h.deps.Storage.Append(r.Context(), lead); err != nil {
		h.deps.Logger.Printf("storage append failed for %s: %v", lead.ID, err)
		writeJSON(w, http.StatusInternalServerError, errorResponse{Error: "storage failed"})
		return
	}

	go h.notifyAsync(lead)

	writeJSON(w, http.StatusOK, successResponse{Ref: lead.ID})
}

func (h *Handler) notifyAsync(lead Lead) {
	ctx, cancel := context.WithTimeout(context.Background(), h.deps.NotifyTimeout)
	defer cancel()
	if err := h.deps.Notifier.Notify(ctx, lead); err != nil {
		h.deps.Logger.Printf("notify failed for %s: %v", lead.ID, err)
	}
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(body); err != nil {
		// nothing useful to do — connection probably closed
		_ = err
	}
}

// clientIP extracts the client IP, preferring the first entry in
// X-Forwarded-For (set by Cloudflare) so rate limiting hits real
// clients instead of the Cloudflared connector.
func clientIP(r *http.Request) string {
	if cf := r.Header.Get("CF-Connecting-IP"); cf != "" {
		return strings.TrimSpace(cf)
	}
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		if idx := strings.IndexByte(xff, ','); idx >= 0 {
			return strings.TrimSpace(xff[:idx])
		}
		return strings.TrimSpace(xff)
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}

func trimToLen(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n]
}

// ErrShutdown is returned when the handler is shutting down. Currently
// unused but reserved so the main loop can distinguish.
var ErrShutdown = errors.New("collector shutting down")
