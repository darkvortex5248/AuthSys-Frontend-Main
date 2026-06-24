"""add display_name bio timezone preferences to developer_accounts

Revision ID: c8f2a3b4d5e6
Revises: b0bef6c6c78c
Create Date: 2026-06-15 12:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'c8f2a3b4d5e6'
down_revision: Union[str, None] = 'b0bef6c6c78c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('developer_accounts', sa.Column('display_name', sa.String(), nullable=True))
    op.add_column('developer_accounts', sa.Column('bio', sa.String(), nullable=True))
    op.add_column('developer_accounts', sa.Column('timezone', sa.String(), server_default='UTC+00:00'))
    op.add_column('developer_accounts', sa.Column('preferences', sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column('developer_accounts', 'preferences')
    op.drop_column('developer_accounts', 'timezone')
    op.drop_column('developer_accounts', 'bio')
    op.drop_column('developer_accounts', 'display_name')
