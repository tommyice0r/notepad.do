package services

import (
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
)

// ScrapeNotepadPW fetches the content from notepad.pw for a given slug securely
func ScrapeNotepadPW(slug string) (string, error) {
	// Sanitize slug to prevent path traversal or SSRF
	cleanSlug := url.PathEscape(strings.TrimSpace(slug))
	if cleanSlug == "" || strings.Contains(cleanSlug, "..") {
		return "", fmt.Errorf("invalid slug format")
	}

	targetURL := fmt.Sprintf("https://notepad.pw/%s", cleanSlug)

	// Create HTTP client with strict timeout
	client := &http.Client{
		Timeout: 5 * time.Second,
	}

	req, err := http.NewRequest("GET", targetURL, nil)
	if err != nil {
		return "", err
	}

	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
	req.Header.Set("Accept", "text/html,application/xhtml+xml")

	res, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer res.Body.Close()

	if res.StatusCode != 200 {
		return "", fmt.Errorf("status code: %d", res.StatusCode)
	}

	// Load document safely
	doc, err := goquery.NewDocumentFromReader(res.Body)
	if err != nil {
		return "", err
	}

	var content string
	doc.Find("textarea").Each(func(i int, s *goquery.Selection) {
		content = s.Text()
	})

	return strings.TrimSpace(content), nil
}
