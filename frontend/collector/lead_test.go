package main

import (
	"strings"
	"testing"
)

func validSubmission() Submission {
	return Submission{
		Nome:     "Maria",
		Papel:    "catador",
		Cidade:   "São Paulo",
		Contato:  "11999998888 (whatsapp)",
		Mensagem: "Olá",
	}
}

func TestSubmissionTrimmedNormalizesPapel(t *testing.T) {
	s := Submission{
		Nome:    "  Maria  ",
		Papel:   "  CATADOR ",
		Cidade:  "  Rio  ",
		Contato: "  maria@x.org  ",
	}.Trimmed()

	if s.Nome != "Maria" {
		t.Errorf("nome not trimmed: %q", s.Nome)
	}
	if s.Papel != "catador" {
		t.Errorf("papel not lowercased/trimmed: %q", s.Papel)
	}
	if s.Cidade != "Rio" {
		t.Errorf("cidade not trimmed: %q", s.Cidade)
	}
	if s.Contato != "maria@x.org" {
		t.Errorf("contato not trimmed: %q", s.Contato)
	}
}

func TestSubmissionValidate(t *testing.T) {
	tests := []struct {
		name    string
		mutate  func(s *Submission)
		wantErr string
	}{
		{"happy", func(s *Submission) {}, ""},
		{"missing nome", func(s *Submission) { s.Nome = "" }, "nome"},
		{"long nome", func(s *Submission) { s.Nome = strings.Repeat("a", maxShortField+1) }, "nome"},
		{"missing papel", func(s *Submission) { s.Papel = "" }, "papel"},
		{"unknown papel", func(s *Submission) { s.Papel = "presidente" }, "papel"},
		{"missing cidade", func(s *Submission) { s.Cidade = "" }, "cidade"},
		{"long cidade", func(s *Submission) { s.Cidade = strings.Repeat("c", maxShortField+1) }, "cidade"},
		{"missing contato", func(s *Submission) { s.Contato = "" }, "contato"},
		{"long contato", func(s *Submission) { s.Contato = strings.Repeat("c", maxShortField+1) }, "contato"},
		{"long mensagem", func(s *Submission) { s.Mensagem = strings.Repeat("m", maxMessage+1) }, "mensagem"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			s := validSubmission()
			tt.mutate(&s)
			err := s.Validate()
			if tt.wantErr == "" {
				if err != nil {
					t.Fatalf("expected no error, got %+v", err)
				}
				return
			}
			if err == nil {
				t.Fatalf("expected error on field %q, got none", tt.wantErr)
			}
			if err.Field != tt.wantErr {
				t.Errorf("expected field %q, got %q", tt.wantErr, err.Field)
			}
		})
	}
}

func TestValidRoles(t *testing.T) {
	expected := []string{"catador", "cooperativa", "designer", "dev", "simpatizante", "testes"}
	for _, role := range expected {
		if !validRoles[role] {
			t.Errorf("expected role %q to be valid", role)
		}
	}
	if validRoles["random"] {
		t.Error("expected random role to be invalid")
	}
}
