package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "host=localhost user=postgres dbname=postgres port=5432 sslmode=disable"
	}

	db, err := sql.Open("pgx", dsn)
	if err != nil {
		log.Fatalf("Error conectando a postgres: %v", err)
	}
	defer db.Close()

	// Intentamos crear la base de datos
	_, err = db.Exec("CREATE DATABASE notepad;")
	if err != nil {
		// Ignoramos el error si ya existe
		fmt.Printf("Aviso (puede que ya exista): %v\n", err)
	} else {
		fmt.Println("Base de datos 'notepad' creada exitosamente.")
	}
}
