import sqlite3

def migrate_add_created_at_column():
    conn = sqlite3.connect('signatures.db')
    cursor = conn.cursor()

    # Check if the column already exists
    cursor.execute("PRAGMA table_info(signatures);")
    columns = [info[1] for info in cursor.fetchall()]

    if 'created_at' not in columns:
        print("Adding 'created_at' column...")
        cursor.execute("ALTER TABLE signatures ADD COLUMN created_at TEXT;")
        print("Filling existing rows with current timestamp...")
        cursor.execute("UPDATE signatures SET created_at = datetime('now') WHERE created_at IS NULL;")
        conn.commit()
        print("Migration completed successfully! ✅")
    else:
        print("'created_at' column already exists. Nothing to do. ✅")

    conn.close()

if __name__ == "__main__":
    migrate_add_created_at_column()
 