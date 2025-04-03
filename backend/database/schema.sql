-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- -----------------------------------------------------
-- Table `users`
-- Stores core user information. Handles standard registration,
-- profile details, status, avatar, username, ect...
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE, -- Nullable if only remote auth is used initially
    password_hash TEXT, -- Nullable for remote auth only users
    avatar_url TEXT DEFAULT '/default-avatar.png',
    status TEXT CHECK(status IN ('online', 'offline', 'ingame')) DEFAULT 'offline',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    preferred_language TEXT DEFAULT 'en'
);

-- Trigger to update `updated_at` timestamp on users table
CREATE TRIGGER IF NOT EXISTS users_updated_at
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE user_id = OLD.user_id;
END;


-- -----------------------------------------------------
-- Indexes for performance
-- -----------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
