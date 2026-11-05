package main

import (
	"fmt"
	"net"
	"net/http"
	"time"
)

const healthcheckArg = "healthcheck"

// runHealthcheck consulta o /health local; imagens distroless não têm wget para o Docker usar.
func runHealthcheck(addr string) error {
	_, port, err := net.SplitHostPort(addr)
	if err != nil {
		return fmt.Errorf("endereço inválido %q: %w", addr, err)
	}
	client := http.Client{Timeout: 3 * time.Second}
	resp, err := client.Get("http://" + net.JoinHostPort("127.0.0.1", port) + "/health")
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("/health respondeu %d", resp.StatusCode)
	}
	return nil
}
