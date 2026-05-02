package main

import (
	"crypto/rand"
	"fmt"
	"math/big"
)

func newID() string {
	max := big.NewInt(900000)
	n, err := rand.Int(rand.Reader, max)
	var v int64
	if err == nil {
		v = n.Int64()
	}
	return fmt.Sprintf("REQ-%06d", v+100000)
}
