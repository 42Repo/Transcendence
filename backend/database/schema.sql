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
    google_id TEXT UNIQUE,
    avatar_url TEXT DEFAULT '/DefaultProfilePic.png',
    status TEXT CHECK(status IN ('online', 'offline', 'ingame')) DEFAULT 'offline',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    bio TEXT DEFAULT 'im a gamer',
    two_factor_secret TEXT,
    is_two_factor_enabled INTEGER DEFAULT 0 NOT NULL
);

-- Trigger to update `updated_at` timestamp on users table
CREATE TRIGGER IF NOT EXISTS users_updated_at
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE user_id = OLD.user_id;
END;

-- -----------------------------------------------------
-- Table `game_matches`
-- Stores information about completed game matches.
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS game_matches (
    match_id INTEGER PRIMARY KEY AUTOINCREMENT,
    player1_id INTEGER,
    player2_id INTEGER,
    player1_guest_name TEXT,
    player2_guest_name TEXT,
    player1_score INTEGER NOT NULL,
    player2_score INTEGER NOT NULL,
    winner_id INTEGER,
    match_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    player1_touched_ball INTEGER DEFAULT 0,
    player1_missed_ball INTEGER DEFAULT 0,
    player1_touched_ball_in_row INTEGER DEFAULT 0,
    player1_missed_ball_in_row INTEGER DEFAULT 0,
    player2_touched_ball INTEGER DEFAULT 0,
    player2_missed_ball INTEGER DEFAULT 0,
    player2_touched_ball_in_row INTEGER DEFAULT 0,
    player2_missed_ball_in_row INTEGER DEFAULT 0,
    FOREIGN KEY (player1_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (player2_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (winner_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- -----------------------------------------------------
-- Indexes for performance
-- -----------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_game_matches_player1 ON game_matches(player1_id);
CREATE INDEX IF NOT EXISTS idx_game_matches_player2 ON game_matches(player2_id);
CREATE INDEX IF NOT EXISTS idx_game_matches_winner ON game_matches(winner_id);
CREATE INDEX IF NOT EXISTS idx_game_matches_date ON game_matches(match_date);
