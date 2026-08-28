package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

type Notifier interface {
	Notify(ctx context.Context, lead Lead) error
}

type NoopNotifier struct{}

func (NoopNotifier) Notify(context.Context, Lead) error { return nil }

type TelegramNotifier struct {
	BotToken string
	ChatID   string
	Endpoint string
	Client   *http.Client
}

func NewTelegramNotifier(token, chatID string) *TelegramNotifier {
	return &TelegramNotifier{
		BotToken: token,
		ChatID:   chatID,
		Endpoint: "https://api.telegram.org",
		Client:   &http.Client{Timeout: 10 * time.Second},
	}
}

func (t *TelegramNotifier) Notify(ctx context.Context, lead Lead) error {
	if t.BotToken == "" || t.ChatID == "" {
		return fmt.Errorf("telegram: token or chat_id missing")
	}

	text := buildMessage(lead)

	body := map[string]any{
		"chat_id":    t.ChatID,
		"text":       text,
		"parse_mode": "MarkdownV2",
	}
	buf, err := json.Marshal(body)
	if err != nil {
		return fmt.Errorf("telegram: marshal: %w", err)
	}

	url := fmt.Sprintf("%s/bot%s/sendMessage", strings.TrimRight(t.Endpoint, "/"), t.BotToken)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(buf))
	if err != nil {
		return fmt.Errorf("telegram: new request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := t.Client.Do(req)
	if err != nil {
		return fmt.Errorf("telegram: do: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode/100 != 2 {
		respBody, _ := io.ReadAll(io.LimitReader(resp.Body, 1024))
		return fmt.Errorf("telegram: status %d: %s", resp.StatusCode, string(respBody))
	}
	return nil
}

func buildMessage(lead Lead) string {
	var b strings.Builder
	b.WriteString("♻️ *Novo contato — Cataí*\n")
	b.WriteString(fmt.Sprintf("`%s`\n\n", escapeMarkdownV2(lead.ID)))
	b.WriteString(fmt.Sprintf("*Papel:* %s\n", escapeMarkdownV2(lead.Papel)))
	b.WriteString(fmt.Sprintf("*Nome:* %s\n", escapeMarkdownV2(lead.Nome)))
	b.WriteString(fmt.Sprintf("*Cidade:* %s\n", escapeMarkdownV2(lead.Cidade)))
	b.WriteString(fmt.Sprintf("*Contato:* %s\n", escapeMarkdownV2(lead.Contato)))
	if strings.TrimSpace(lead.Mensagem) != "" {
		b.WriteString(fmt.Sprintf("*Mensagem:* %s\n", escapeMarkdownV2(lead.Mensagem)))
	}
	b.WriteString(fmt.Sprintf("\n_recebido %s_", escapeMarkdownV2(lead.ReceivedAt.Format("2006-01-02 15:04 -07"))))
	return b.String()
}

func escapeMarkdownV2(s string) string {
	specials := "_*[]()~`>#+-=|{}.!\\"
	var b strings.Builder
	b.Grow(len(s) + 16)
	for _, r := range s {
		if strings.ContainsRune(specials, r) {
			b.WriteByte('\\')
		}
		b.WriteRune(r)
	}
	return b.String()
}
