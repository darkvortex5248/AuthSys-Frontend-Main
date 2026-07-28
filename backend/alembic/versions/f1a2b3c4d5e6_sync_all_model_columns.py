"""Complete schema sync: add ALL model columns missing from the migration chain

Idempotent — uses ALTER TABLE ... ADD COLUMN IF NOT EXISTS so it can safely
run multiple times without error.

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


def _add_column_if_not_exists(table: str, column: str, col_type: str, default: str | None = None, nullable: bool = True):
    stmt = f'ALTER TABLE "{table}" ADD COLUMN IF NOT EXISTS "{column}" {col_type}'
    if default is not None:
        stmt += f" DEFAULT {default}"
    if not nullable:
        stmt += " NOT NULL"
    op.execute(stmt)


def _create_index_if_not_exists(name: str, table: str, columns: list[str], unique: bool = False, where: str | None = None):
    unique_str = "UNIQUE " if unique else ""
    where_str = f" WHERE {where}" if where else ""
    op.execute(
        f'CREATE {unique_str}INDEX IF NOT EXISTS "{name}" ON "{table}" ({", ".join(columns)}){where_str}'
    )


def upgrade() -> None:
    # ═══════════════════════════════════════════════════════════════
    # admin_users
    # ═══════════════════════════════════════════════════════════════
    _add_column_if_not_exists('admin_users', 'must_change_password', 'BOOLEAN', default='false')
    _create_index_if_not_exists('ix_admin_users_must_change_password', 'admin_users', ['must_change_password'])

    # ═══════════════════════════════════════════════════════════════
    # subscription_plans
    # ═══════════════════════════════════════════════════════════════
    _add_column_if_not_exists('subscription_plans', 'audit_log_limit', 'INTEGER', default='1000')
    _add_column_if_not_exists('subscription_plans', 'max_devices', 'INTEGER', default='3')
    _add_column_if_not_exists('subscription_plans', 'has_device_panel', 'BOOLEAN', default='false')

    # ═══════════════════════════════════════════════════════════════
    # developer_accounts
    # ═══════════════════════════════════════════════════════════════
    _add_column_if_not_exists('developer_accounts', 'last_read_at', 'TIMESTAMP WITH TIME ZONE')
    _add_column_if_not_exists('developer_accounts', 'two_factor_enabled', 'BOOLEAN', default='false')
    _add_column_if_not_exists('developer_accounts', 'two_factor_secret', 'VARCHAR')
    _add_column_if_not_exists('developer_accounts', 'two_factor_backup_codes', 'JSONB')
    _add_column_if_not_exists('developer_accounts', 'subscription_tier', 'VARCHAR', default="'tester'")
    _add_column_if_not_exists('developer_accounts', 'discord_id', 'VARCHAR')
    _add_column_if_not_exists('developer_accounts', 'github_id', 'VARCHAR')
    _add_column_if_not_exists('developer_accounts', 'azure_id', 'VARCHAR')
    _add_column_if_not_exists('developer_accounts', 'device_api_key', 'VARCHAR')

    _create_index_if_not_exists('ix_developer_accounts_discord_id', 'developer_accounts', ['discord_id'],
                                unique=True, where='discord_id IS NOT NULL')
    _create_index_if_not_exists('ix_developer_accounts_github_id', 'developer_accounts', ['github_id'],
                                unique=True, where='github_id IS NOT NULL')
    _create_index_if_not_exists('ix_developer_accounts_azure_id', 'developer_accounts', ['azure_id'],
                                unique=True, where='azure_id IS NOT NULL')
    _create_index_if_not_exists('ix_developer_accounts_subscription_tier', 'developer_accounts', ['subscription_tier'])

    # ═══════════════════════════════════════════════════════════════
    # applications
    # ═══════════════════════════════════════════════════════════════
    _add_column_if_not_exists('applications', 'maintenance_mode', 'BOOLEAN', default='false')
    _add_column_if_not_exists('applications', 'developer_lock', 'BOOLEAN', default='false')

    # ═══════════════════════════════════════════════════════════════
    # end_users
    # ═══════════════════════════════════════════════════════════════
    _add_column_if_not_exists('end_users', 'hwids', 'JSONB')
    _add_column_if_not_exists('end_users', 'max_devices', 'INTEGER', default='1')
    _add_column_if_not_exists('end_users', 'expires_at', 'TIMESTAMP WITH TIME ZONE')
    _add_column_if_not_exists('end_users', 'is_shadow', 'BOOLEAN', default='false')
    _add_column_if_not_exists('end_users', 'is_device_only', 'BOOLEAN', default='false')
    _add_column_if_not_exists('end_users', 'max_uses', 'INTEGER', default='1')
    _add_column_if_not_exists('end_users', 'user_category', 'VARCHAR', default="'active'")
    _add_column_if_not_exists('end_users', 'developer_id', 'INTEGER')

    _create_index_if_not_exists('ix_end_users_expires_at', 'end_users', ['expires_at'])
    _create_index_if_not_exists('ix_end_users_max_devices', 'end_users', ['max_devices'])
    _create_index_if_not_exists('ix_end_users_is_shadow', 'end_users', ['is_shadow'])
    _create_index_if_not_exists('ix_end_users_user_category', 'end_users', ['user_category'])
    _create_index_if_not_exists('ix_end_users_is_device_only', 'end_users', ['is_device_only'])
    _create_index_if_not_exists('ix_end_users_developer_id', 'end_users', ['developer_id'])

    # ═══════════════════════════════════════════════════════════════
    # license_keys
    # ═══════════════════════════════════════════════════════════════
    _add_column_if_not_exists('license_keys', 'max_devices', 'INTEGER', default='0')

    # ═══════════════════════════════════════════════════════════════
    # webhooks_log
    # ═══════════════════════════════════════════════════════════════
    _add_column_if_not_exists('webhooks_log', 'endpoint_id', 'INTEGER')

    # ═══════════════════════════════════════════════════════════════
    # payments
    # ═══════════════════════════════════════════════════════════════
    _add_column_if_not_exists('payments', 'payment_method', 'VARCHAR')
    _add_column_if_not_exists('payments', 'wallet_number', 'VARCHAR')
    _add_column_if_not_exists('payments', 'transaction_id', 'VARCHAR')


def downgrade() -> None:
    op.drop_column('payments', 'transaction_id')
    op.drop_column('payments', 'wallet_number')
    op.drop_column('payments', 'payment_method')
    op.drop_column('webhooks_log', 'endpoint_id')
    op.drop_column('license_keys', 'max_devices')
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
    op.drop_column('applications', 'developer_lock')
    op.drop_column('applications', 'maintenance_mode')
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
    op.drop_column('subscription_plans', 'has_device_panel')
    op.drop_column('subscription_plans', 'max_devices')
    op.drop_column('subscription_plans', 'audit_log_limit')
    op.drop_index(op.f('ix_admin_users_must_change_password'), table_name='admin_users')
    op.drop_column('admin_users', 'must_change_password')
