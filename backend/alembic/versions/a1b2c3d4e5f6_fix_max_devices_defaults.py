"""Fix license_keys.max_devices: change dangerous default 0 to 1 and backfill.

Bug: previous migration (f1a2b3c4d5e6) added `license_keys.max_devices INTEGER DEFAULT 0`,
which silently meant "no devices allowed" in some code paths. New keys also inherited
this default, so any license created without an explicit max_devices could not be used
on even a single device.

This migration:
  1. Backfills any existing `license_keys.max_devices` rows that are 0 → 1
     (only for non-`uses_based` keys, to keep legacy semantics where `uses_based`
     keys are single-device by default anyway).
  2. Alters the column default to 1 for future inserts.
  3. Same backfill safety for `end_users.max_devices` and `end_users.max_uses`
     if either is 0 (treat 0 as "uninitialized" → 1).

Idempotent — uses UPDATE/ALTER with safe guards.

Revision ID: a1b2c3d4e5f6
Revises: f1a2b3c4d5e6
Create Date: 2026-08-05

"""
from typing import Sequence, Union
from alembic import op

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'f1a2b3c4d5e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Backfill license_keys.max_devices = 0 → 1 for non-uses_based keys
    op.execute(
        "UPDATE license_keys SET max_devices = 1 "
        "WHERE (max_devices IS NULL OR max_devices = 0) "
        "AND (key_type IS NULL OR key_type <> 'uses_based')"
    )
    # 2. For uses_based keys, default max_devices to 1 if not set
    op.execute(
        "UPDATE license_keys SET max_devices = 1 "
        "WHERE (max_devices IS NULL OR max_devices = 0) "
        "AND key_type = 'uses_based'"
    )
    # 3. Change default to 1 for future inserts
    op.execute("ALTER TABLE license_keys ALTER COLUMN max_devices SET DEFAULT 1")

    # 4. Safety backfill for end_users: 0 → 1 (uninitialized)
    op.execute("UPDATE end_users SET max_devices = 1 WHERE max_devices IS NULL OR max_devices = 0")
    op.execute("UPDATE end_users SET max_uses    = 1 WHERE max_uses    IS NULL OR max_uses    = 0")
    op.execute("ALTER TABLE end_users ALTER COLUMN max_devices SET DEFAULT 1")
    op.execute("ALTER TABLE end_users ALTER COLUMN max_uses    SET DEFAULT 1")


def downgrade() -> None:
    # Revert default to 0 (legacy value) — but leave actual data untouched.
    op.execute("ALTER TABLE license_keys ALTER COLUMN max_devices SET DEFAULT 0")
    op.execute("ALTER TABLE end_users    ALTER COLUMN max_devices SET DEFAULT 1")
    op.execute("ALTER TABLE end_users    ALTER COLUMN max_uses    SET DEFAULT 1")
