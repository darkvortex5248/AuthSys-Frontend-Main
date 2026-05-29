# Database Update Queries

Run these SQL commands in your Neon SQL Editor to apply the latest backend changes to your existing database.

## User Expiry Date Feature

Add the `expires_at` field to the `end_users` table to support user expiry dates:

```sql
-- Add expires_at column to end_users table
ALTER TABLE end_users ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;
```

This change enables the new user creation features:
- Setting expiry dates when creating users manually
- Setting expiry dates when bulk creating users
- Users will automatically expire based on the set date
