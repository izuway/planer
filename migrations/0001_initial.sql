-- Initial migration: Create app versions table

CREATE TABLE IF NOT EXISTS app_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version TEXT NOT NULL UNIQUE,
    description TEXT,
    released_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index on version for faster lookups
CREATE INDEX IF NOT EXISTS idx_app_versions_version ON app_versions(version);

-- Insert initial test version
INSERT INTO app_versions (version, description) VALUES 
    ('1.0.0', 'Initial release'),
    ('1.0.1', 'Bug fixes and improvements'),
    ('1.1.0', 'New features added');

