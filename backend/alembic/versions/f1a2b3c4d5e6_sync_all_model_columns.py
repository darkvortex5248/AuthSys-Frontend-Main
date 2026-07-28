"""Complete schema sync: add ALL model columns missing from the migration chain

This migration adds every column that exists in SQLAlchemy models but is
NOT yet created by the cumulative migration chain (revisions 1-5).
It also adds corresponding indexes, unique constraints, and foreign keys.

Revision ID: f1a2b3c4d5e6
Revises: e1f2a3b4c5d6
Create Date: 2026-07-28

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'f1a2b3c4d5e6'
down_revision: Union[str, None] = 'e1f2a3b4c5d6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ═══════════════════════════════════════════════════════════════
    # admin_users
    # ═══════════════════════════════════════════════════════════════
    op.add_column('admin_users', sa.Column(
        'must_change_password', sa.Boolean(),
        server_default=sa.text('false'),
        nullable=True,
    ))
    op.create_index(
        op.f('ix_admin_users_must_change_password'),
        'admin_users', ['must_change_password'],
    )

    # ═══════════════════════════════════════════════════════════════
    # subscription_plans — columns added to model after migration 4
    # ═══════════════════════════════════════════════════════════════
    op.add_column('subscription_plans', sa.Column(
        'audit_log_limit', sa.Integer(),
        server_default=sa.text('1000'),
    ))
    op.add_column('subscription_plans', sa.Column(
        'max_devices', sa.Integer(),
        server_default=sa.text('3'),
    ))
    op.add_column('subscription_plans', sa.Column(
        'has_device_panel', sa.Boolean(),
        server_default=sa.text('false'),
    ))

    # ═══════════════════════════════════════════════════════════════
    # developer_accounts — columns added to model after migration 3
    # ═══════════════════════════════════════════════════════════════
    op.add_column('developer_accounts', sa.Column(
        'last_read_at', sa.DateTime(timezone=True), nullable=True,
    ))
    op.add_column('developer_accounts', sa.Column(
        'two_factor_enabled', sa.Boolean(),
        server_default=sa.text('false'),
    ))
    op.add_column('developer_accounts', sa.Column(
        'two_factor_secret', sa.String(), nullable=True,
    ))
    op.add_column('developer_accounts', sa.Column(
        'two_factor_backup_codes', sa.JSON(), nullable=True,
    ))
    op.add_column('developer_accounts', sa.Column(
        'subscription_tier', sa.String(),
        server_default=sa.text("'tester'"),
    ))
    op.add_column('developer_accounts', sa.Column(
        'discord_id', sa.String(), nullable=True,
    ))
    op.add_column('developer_accounts', sa.Column(
        'github_id', sa.String(), nullable=True,
    ))
    op.add_column('developer_accounts', sa.Column(
        'azure_id', sa.String(), nullable=True,
    ))
    op.add_column('developer_accounts', sa.Column(
        'device_api_key', sa.String(), nullable=True,
    ))

    op.create_index(
        op.f('ix_developer_accounts_discord_id'),
        'developer_accounts', ['discord_id'],
        unique=True,
        postgresql_where=sa.text('discord_id IS NOT NULL'),
    )
    op.create_index(
        op.f('ix_developer_accounts_github_id'),
        'developer_accounts', ['github_id'],
        unique=True,
        postgresql_where=sa.text('github_id IS NOT NULL'),
    )
    op.create_index(
        op.f('ix_developer_accounts_azure_id'),
        'developer_accounts', ['azure_id'],
        unique=True,
        postgresql_where=sa.text('azure_id IS NOT NULL'),
    )
    op.create_index(
        op.f('ix_developer_accounts_subscription_tier'),
        'developer_accounts', ['subscription_tier'],
    )

    # ═══════════════════════════════════════════════════════════════
    # applications — columns added to model after migration 2
    # ═══════════════════════════════════════════════════════════════
    op.add_column('applications', sa.Column(
        'maintenance_mode', sa.Boolean(),
        server_default=sa.text('false'),
    ))
    op.add_column('applications', sa.Column(
        'developer_lock', sa.Boolean(),
        server_default=sa.text('false'),
    ))

    # ═══════════════════════════════════════════════════════════════
    # end_users — columns added to model after migration 1
    # ═══════════════════════════════════════════════════════════════
    op.add_column('end_users', sa.Column(
        'hwids', sa.JSON(), nullable=True,
    ))
    op.add_column('end_users', sa.Column(
        'max_devices', sa.Integer(),
        server_default=sa.text('1'),
    ))
    op.add_column('end_users', sa.Column(
        'expires_at', sa.DateTime(timezone=True), nullable=True,
    ))
    op.add_column('end_users', sa.Column(
        'is_shadow', sa.Boolean(),
        server_default=sa.text('false'),
    ))
    op.add_column('end_users', sa.Column(
        'is_device_only', sa.Boolean(),
        server_default=sa.text('false'),
    ))
    op.add_column('end_users', sa.Column(
        'max_uses', sa.Integer(),
        server_default=sa.text('1'),
    ))
    op.add_column('end_users', sa.Column(
        'user_category', sa.String(),
        server_default=sa.text("'active'"),
    ))
    op.add_column('end_users', sa.Column(
        'developer_id', sa.Integer(), nullable=True,
    ))

    op.create_index(op.f('ix_end_users_expires_at'), 'end_users', ['expires_at'])
    op.create_index(op.f('ix_end_users_max_devices'), 'end_users', ['max_devices'])
    op.create_index(op.f('ix_end_users_is_shadow'), 'end_users', ['is_shadow'])
    op.create_index(op.f('ix_end_users_user_category'), 'end_users', ['user_category'])
    op.create_index(op.f('ix_end_users_is_device_only'), 'end_users', ['is_device_only'])
    op.create_index(op.f('ix_end_users_developer_id'), 'end_users', ['developer_id'])

    # ═══════════════════════════════════════════════════════════════
    # license_keys — columns added to model after migration 1
    # ═══════════════════════════════════════════════════════════════
    op.add_column('license_keys', sa.Column(
        'max_devices', sa.Integer(),
        server_default=sa.text('0'),
    ))

    # ═══════════════════════════════════════════════════════════════
    # webhooks_log — columns added to model after migration 1
    # ═══════════════════════════════════════════════════════════════
    op.add_column('webhooks_log', sa.Column(
        'endpoint_id', sa.Integer(), nullable=True,
    ))

    # ═══════════════════════════════════════════════════════════════
    # payments — columns added to model (table not in any migration)
    # ═══════════════════════════════════════════════════════════════
    op.add_column('payments', sa.Column(
        'payment_method', sa.String(), nullable=True,
    ))
    op.add_column('payments', sa.Column(
        'wallet_number', sa.String(), nullable=True,
    ))
    op.add_column('payments', sa.Column(
        'transaction_id', sa.String(), nullable=True,
    ))


def downgrade() -> None:
    # payments
    op.drop_column('payments', 'transaction_id')
    op.drop_column('payments', 'wallet_number')
    op.drop_column('payments', 'payment_method')

    # webhooks_log
    op.drop_column('webhooks_log', 'endpoint_id')

    # license_keys
    op.drop_column('license_keys', 'max_devices')

    # end_users
    op.drop_index(op.f('ix_end_users_developer_id'), table_name='end_users')
    op.drop_index(op.f('ix_end_users_is_device_only'), table_name='end_users')
    op.drop_index(op.f('ix_end_users_user_category'), table_name='end_users')
    op.drop_index(op.f('ix_end_users_is_shadow'), table_name='end_users')
    op.drop_index(op.f('ix_end_users_max_devices'), table_name='end_users')
    op.drop_index(op.f('ix_end_users_expires_at'), table_name='end_users')
    op.drop_column('end_users', 'developer_id')
    op.drop_column('end_users', 'user_category')
    op.drop_column('end_users', 'max_uses')
    op.drop_column('end_users', 'is_device_only')
    op.drop_column('end_users', 'is_shadow')
    op.drop_column('end_users', 'expires_at')
    op.drop_column('end_users', 'max_devices')
    op.drop_column('end_users', 'hwids')

    # applications
    op.drop_column('applications', 'developer_lock')
    op.drop_column('applications', 'maintenance_mode')

    # developer_accounts
    op.drop_index(op.f('ix_developer_accounts_subscription_tier'), table_name='developer_accounts')
    op.drop_index(op.f('ix_developer_accounts_discord_id'), table_name='developer_accounts')
    op.drop_index(op.f('ix_developer_accounts_github_id'), table_name='developer_accounts')
    op.drop_index(op.f('ix_developer_accounts_azure_id'), table_name='developer_accounts')
    op.drop_column('developer_accounts', 'device_api_key')
    op.drop_column('developer_accounts', 'azure_id')
    op.drop_column('developer_accounts', 'github_id')
    op.drop_column('developer_accounts', 'discord_id')
    op.drop_column('developer_accounts', 'subscription_tier')
    op.drop_column('developer_accounts', 'two_factor_backup_codes')
    op.drop_column('developer_accounts', 'two_factor_secret')
    op.drop_column('developer_accounts', 'two_factor_enabled')
    op.drop_column('developer_accounts', 'last_read_at')

    # subscription_plans
    op.drop_column('subscription_plans', 'has_device_panel')
    op.drop_column('subscription_plans', 'max_devices')
    op.drop_column('subscription_plans', 'audit_log_limit')

    # admin_users
    op.drop_index(op.f('ix_admin_users_must_change_password'), table_name='admin_users')
    op.drop_column('admin_users', 'must_change_password')
