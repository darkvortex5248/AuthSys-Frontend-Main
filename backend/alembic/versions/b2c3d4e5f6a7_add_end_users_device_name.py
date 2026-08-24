"""Add end_users.device_name column.

Bug: POST /api/v1/client/device/register passes `device_name` to EndUser,
but the `end_users` table had no `device_name` column — any registration
with a device name exploded with a sanitized 500 ("Operation failed").

This migration adds the column. Bootstrap also contains the same
`ADD COLUMN IF NOT EXISTS` guard for deployments that restart before
running alembic (see services/bootstrap.py).

Idempotent.

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-08-12
"""
from typing import Sequence, Union
from alembic import op

revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE end_users ADD COLUMN IF NOT EXISTS device_name VARCHAR")


def downgrade() -> None:
    op.execute("ALTER TABLE end_users DROP COLUMN IF EXISTS device_name")