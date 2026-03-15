-- Add dedicated passwordHash column to User table
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;

-- Migrate existing password hashes from the username field (legacy format: email::bcryptHash)
UPDATE "User"
SET "passwordHash" = split_part(username, '::', 2),
    "username" = split_part(username, '::', 1)
WHERE username LIKE '%::%';
