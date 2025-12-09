-- Fix password hashes for all users
-- Password: password123
UPDATE users SET password_hash = '$2b$12$SzG46ru2FL41zSsJ1pD87uSYbR7HQr7uiTJF8MC104xe.zYlC6xo6';
