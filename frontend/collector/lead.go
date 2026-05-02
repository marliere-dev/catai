package main

import (
	"strings"
	"time"
	"unicode/utf8"
)

const (
	maxShortField = 256
	maxMessage    = 4096
)

// Roles a contributor can self-identify as. Anything else is rejected.
var validRoles = map[string]bool{
	"catador":      true,
	"cooperativa":  true,
	"designer":     true,
	"dev":          true,
	"simpatizante": true,
	"testes":       true, // someone volunteering for field tests
}

type Submission struct {
	Nome     string `json:"nome"`
	Papel    string `json:"papel"`
	Cidade   string `json:"cidade"`
	Contato  string `json:"contato"`
	Mensagem string `json:"mensagem"`
	Website  string `json:"website"`
}

type Lead struct {
	ID         string    `json:"id"`
	ReceivedAt time.Time `json:"received_at"`
	IP         string    `json:"ip"`
	UserAgent  string    `json:"user_agent"`
	Nome       string    `json:"nome"`
	Papel      string    `json:"papel"`
	Cidade     string    `json:"cidade"`
	Contato    string    `json:"contato"`
	Mensagem   string    `json:"mensagem,omitempty"`
}

type ValidationError struct {
	Field   string
	Message string
}

func (s Submission) Trimmed() Submission {
	return Submission{
		Nome:     strings.TrimSpace(s.Nome),
		Papel:    strings.ToLower(strings.TrimSpace(s.Papel)),
		Cidade:   strings.TrimSpace(s.Cidade),
		Contato:  strings.TrimSpace(s.Contato),
		Mensagem: strings.TrimSpace(s.Mensagem),
		Website:  s.Website,
	}
}

func (s Submission) Validate() *ValidationError {
	if s.Nome == "" {
		return &ValidationError{"nome", "obrigatório"}
	}
	if utf8.RuneCountInString(s.Nome) > maxShortField {
		return &ValidationError{"nome", "muito longo"}
	}
	if s.Papel == "" {
		return &ValidationError{"papel", "obrigatório"}
	}
	if !validRoles[s.Papel] {
		return &ValidationError{"papel", "valor inválido"}
	}
	if s.Cidade == "" {
		return &ValidationError{"cidade", "obrigatório"}
	}
	if utf8.RuneCountInString(s.Cidade) > maxShortField {
		return &ValidationError{"cidade", "muito longa"}
	}
	if s.Contato == "" {
		return &ValidationError{"contato", "obrigatório"}
	}
	if utf8.RuneCountInString(s.Contato) > maxShortField {
		return &ValidationError{"contato", "muito longo"}
	}
	if utf8.RuneCountInString(s.Mensagem) > maxMessage {
		return &ValidationError{"mensagem", "muito longa"}
	}
	return nil
}
