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
    avatar_url TEXT DEFAULT '/DefaultProfilePic.png',
    status TEXT CHECK(status IN ('online', 'offline', 'ingame')) DEFAULT 'offline',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    bio TEXT DEFAULT 'im a gamer'
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
    player1_id INTEGER NOT NULL,
    player2_id INTEGER NOT NULL,
    player1_score INTEGER NOT NULL,
    player2_score INTEGER NOT NULL,
    winner_id INTEGER,
    match_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player1_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (player2_id) REFERENCES users(user_id) ON DELETE CASCADE, -- Or handle AI/guest players differently
    FOREIGN KEY (winner_id) REFERENCES users(user_id) ON DELETE SET NULL -- If winner user is deleted, set winner_id to NULL
);

-- -----------------------------------------------------
-- Indexes for performance
-- -----------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_game_matches_player1 ON game_matches(player1_id);
CREATE INDEX IF NOT EXISTS idx_game_matches_player2 ON game_matches(player2_id);
CREATE INDEX IF NOT EXISTS idx_game_matches_winner ON game_matches(winner_id);
CREATE INDEX IF NOT EXISTS idx_game_matches_date ON game_matches(match_date);
