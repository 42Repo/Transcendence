import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dbDir = path.join(__dirname, '../../database');
const dbPath = path.join(dbDir, 'transcendence.db');
const dbSchemaPath = path.join(dbDir, 'schema.sql');

if (!fs.existsSync(dbDir)) {
  console.log(`Database directory does not exist. Creating ${dbDir}`);
  fs.mkdirSync(dbDir);
}

let dbInstance: Database.Database | null = null;

export const getDb = () => {
  if (dbInstance) {
    return dbInstance;
  }

  const dbExists = fs.existsSync(dbPath);

  try {
    dbInstance = new Database(dbPath, { verbose: console.log });
    console.log('Database connection established.');

    if (!dbExists || !isSchemaApplied(dbInstance)) {
      console.log(
        'Database file created or schema not fully applied. Applying schema...'
      );
      if (fs.existsSync(dbSchemaPath)) {
        const schemaSql = fs.readFileSync(dbSchemaPath, 'utf-8');
        dbInstance.exec(schemaSql);
        console.log('Schema applied successfully.');
      } else {
        console.error(`Schema file not found at ${dbSchemaPath}`);
        throw new Error(`Schema file not found at ${dbSchemaPath}`);
      }
    } else {
      console.log('Database already exists and schema seems applied.');
    }

    dbInstance.pragma('foreign_keys = ON');

    return dbInstance;
  } catch (err) {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  }
};

function isSchemaApplied(db: Database.Database): boolean {
  try {
    const usersTableCheck = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
      )
      .get();
    const gameMatchesTableCheck = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='game_matches'"
      )
      .get();

    if (usersTableCheck && gameMatchesTableCheck) {
      console.log("Schema check: 'users' and 'game_matches' tables exist.");
      return true;
    } else {
      if (!usersTableCheck) console.log("Schema check: 'users' table missing.");
      if (!gameMatchesTableCheck)
        console.log("Schema check: 'game_matches' table missing.");
      return false;
    }
  } catch (error) {
    console.error('Error checking schema application status:', error);
    return false;
  }
}

process.on('exit', () => {
  if (dbInstance) {
    dbInstance.close();
    console.log('Database connection closed.');
  }
});

process.on('SIGINT', () => {
  process.exit();
});
