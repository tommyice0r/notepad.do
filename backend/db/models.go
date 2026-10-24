package db

import (
	"time"

	"gorm.io/gorm"
)

type Note struct {
	ID            string         `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	Slug          string         `gorm:"uniqueIndex;not null" json:"slug"`
	Content       string         `gorm:"type:text" json:"content"`
	PasswordHash  *string        `gorm:"column:password_hash" json:"-"`
	PasswordPlain *string        `gorm:"column:password_plain" json:"-"`
	ReadOnly      bool           `gorm:"column:read_only;default:false" json:"read_only"` // password protects editing only; anyone can read
	ViewsCount    int64          `gorm:"column:views_count;default:0" json:"views_count"`
	IsPinned      bool           `gorm:"column:is_pinned;default:false" json:"is_pinned"`
	AdminNotes    string         `gorm:"column:admin_notes;type:text" json:"-"`
	LastIP        string         `gorm:"column:last_ip" json:"-"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`
}

type Payment struct {
	ID        string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	InvoiceID string    `gorm:"uniqueIndex;not null" json:"invoice_id"`
	NoteID    string    `gorm:"not null" json:"note_id"`
	NoteSlug  string    `gorm:"column:note_slug" json:"note_slug"`
	Amount    float64   `json:"amount"`
	Status    string    `gorm:"default:'pending'" json:"status"` // pending, paid, expired
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type ContactMessage struct {
	ID        string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Subject   string    `json:"subject"`
	Message   string    `gorm:"type:text" json:"message"`
	Status    string    `gorm:"default:'unread'" json:"status"` // unread, read, resolved
	IP        string    `json:"ip"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type AuditLog struct {
	ID         string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	Action     string    `json:"action"`
	TargetSlug string    `json:"target_slug"`
	Details    string    `gorm:"type:text" json:"details"`
	IP         string    `json:"ip"`
	CreatedAt  time.Time `json:"created_at"`
}

type SystemSetting struct {
	Key       string    `gorm:"primaryKey" json:"key"`
	Value     string    `gorm:"type:text" json:"value"`
	UpdatedAt time.Time `json:"updated_at"`
}

// AdminNoteItem provides complete note visibility (including plaintext password & metadata) for Admin Panel
type AdminNoteItem struct {
	ID            string     `json:"id"`
	Slug          string     `json:"slug"`
	Content       string     `json:"content"`
	Preview       string     `json:"preview"`
	SizeBytes     int        `json:"size_bytes"`
	LineCount     int        `json:"line_count"`
	HasPassword   bool       `json:"has_password"`
	PasswordPlain string     `json:"password_plain"`
	PasswordHash  string     `json:"password_hash"`
	IsBcryptOnly  bool       `json:"is_bcrypt_only"`
	ViewsCount    int64      `json:"views_count"`
	IsPinned      bool       `json:"is_pinned"`
	AdminNotes    string     `json:"admin_notes"`
	LastIP        string     `json:"last_ip"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
	IsDeleted     bool       `json:"is_deleted"`
	DeletedAt     *time.Time `json:"deleted_at,omitempty"`
}

// SafeNoteSummary kept for backward compatibility if needed
type SafeNoteSummary struct {
	Slug          string    `json:"slug"`
	Preview       string    `json:"preview"`
	HasPassword   bool      `json:"has_password"`
	PasswordPlain string    `json:"password_plain,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}
