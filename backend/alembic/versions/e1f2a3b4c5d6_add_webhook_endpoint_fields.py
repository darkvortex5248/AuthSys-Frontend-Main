"""add description last_sent_at last_status to webhook_endpoints

Revision ID: e1f2a3b4c5d6
Revises: d9e5f6a7b8c0
Create Date: 2026-06-22 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'e1f2a3b4c5d6'
down_revision: Union[str, None] = 'd9e5f6a7b8c0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('webhook_endpoints', sa.Column('description', sa.String(), server_default=''))
    op.add_column('webhook_endpoints', sa.Column('last_sent_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('webhook_endpoints', sa.Column('last_status', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('webhook_endpoints', 'last_status')
    op.drop_column('webhook_endpoints', 'last_sent_at')
    op.drop_column('webhook_endpoints', 'description')
