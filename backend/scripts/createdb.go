package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"strings"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	dsn := ""
	if len(os.Args) > 1 && strings.TrimSpace(os.Args[1]) != "" {
		dsn = strings.TrimSpace(os.Args[1])
	} else {
		dsn = os.Getenv("DATABASE_URL")
	}
	if dsn == "" {
		dsn = "host=localhost user=postgres dbname=postgres port=5432 sslmode=disable"
	}

	db, err := sql.Open("pgx", dsn)
	if err != nil {
		log.Fatalf("Error conectando a postgres: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("Error en Ping a postgres: %v", err)
	}

	databases := []string{"notepad", "prueba"}
	for _, dbName := range databases {
		_, err = db.Exec(fmt.Sprintf(`CREATE DATABASE "%s";`, dbName))
		if err != nil {
			fmt.Printf("Aviso para '%s' (puede que ya exista): %v\n", dbName, err)
		} else {
			fmt.Printf("Base de datos '%s' creada exitosamente.\n", dbName)
		}
	}
}
