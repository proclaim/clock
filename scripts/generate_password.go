package main

import (
	"fmt"
	"os"

	"golang.org/x/crypto/bcrypt"
)

// Simple utility to generate bcrypt password hashes
// Usage: go run scripts/generate_password.go <password>

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Usage: go run scripts/generate_password.go <password>")
		os.Exit(1)
	}

	password := os.Args[1]

	// Generate hash with cost factor 10 (same as production)
	hash, err := bcrypt.GenerateFromPassword([]byte(password), 10)
	if err != nil {
		fmt.Printf("Error generating hash: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Password: %s\n", password)
	fmt.Printf("Hash:     %s\n", string(hash))
	fmt.Println("\nYou can use this hash in the database or for testing.")
}
