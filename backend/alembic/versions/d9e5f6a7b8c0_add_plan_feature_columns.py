"""add plan feature columns to subscription_plans

Revision ID: d9e5f6a7b8c0
Revises: c8f2a3b4d5e6
Create Date: 2026-06-22 10:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'd9e5f6a7b8c0'
down_revision: Union[str, None] = 'c8f2a3b4d5e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('subscription_plans', sa.Column('description', sa.String(), server_default=''))
    op.add_column('subscription_plans', sa.Column('discount', sa.Integer(), server_default='0'))
    op.add_column('subscription_plans', sa.Column('badge_text', sa.String(), server_default=''))
    op.add_column('subscription_plans', sa.Column('badge_color', sa.String(), server_default=''))
    op.add_column('subscription_plans', sa.Column('is_recommended', sa.Boolean(), server_default='false'))
    op.add_column('subscription_plans', sa.Column('button_text', sa.String(), server_default='Choose Plan'))
    op.add_column('subscription_plans', sa.Column('button_color', sa.String(), server_default='var(--primary)'))
    op.add_column('subscription_plans', sa.Column('icon', sa.String(), server_default='card_membership'))
    op.add_column('subscription_plans', sa.Column('sort_order', sa.Integer(), server_default='0'))
    op.add_column('subscription_plans', sa.Column('is_active', sa.Boolean(), server_default='true'))
    op.add_column('subscription_plans', sa.Column('max_licenses', sa.Integer(), server_default='50'))
    op.add_column('subscription_plans', sa.Column('max_variables', sa.Integer(), server_default='40'))
    op.add_column('subscription_plans', sa.Column('max_logs', sa.Integer(), server_default='200'))
    op.add_column('subscription_plans', sa.Column('max_hashes', sa.Integer(), server_default='2'))
    op.add_column('subscription_plans', sa.Column('max_staff', sa.Integer(), server_default='0'))
    op.add_column('subscription_plans', sa.Column('max_chatrooms', sa.Integer(), server_default='0'))
    op.add_column('subscription_plans', sa.Column('has_ip_tracking', sa.Boolean(), server_default='false'))
    op.add_column('subscription_plans', sa.Column('has_location_tracking', sa.Boolean(), server_default='false'))
    op.add_column('subscription_plans', sa.Column('has_user_panel', sa.Boolean(), server_default='false'))
    op.add_column('subscription_plans', sa.Column('has_staff_management', sa.Boolean(), server_default='false'))
    op.add_column('subscription_plans', sa.Column('has_discord_integration', sa.Boolean(), server_default='false'))
    op.add_column('subscription_plans', sa.Column('has_telegram_integration', sa.Boolean(), server_default='false'))
    op.add_column('subscription_plans', sa.Column('has_api_access', sa.Boolean(), server_default='false'))
    op.add_column('subscription_plans', sa.Column('has_custom_domain', sa.Boolean(), server_default='false'))
    op.add_column('subscription_plans', sa.Column('has_live_chat', sa.Boolean(), server_default='false'))
    op.add_column('subscription_plans', sa.Column('has_audit_logs', sa.Boolean(), server_default='false'))
    op.add_column('subscription_plans', sa.Column('has_webhooks', sa.Boolean(), server_default='false'))
    op.add_column('subscription_plans', sa.Column('has_white_label', sa.Boolean(), server_default='false'))
    op.add_column('subscription_plans', sa.Column('has_priority_support', sa.Boolean(), server_default='false'))
    op.add_column('subscription_plans', sa.Column('has_ssl', sa.Boolean(), server_default='false'))
    op.add_column('subscription_plans', sa.Column('has_global_chat', sa.Boolean(), server_default='false'))
    op.add_column('subscription_plans', sa.Column('has_custom_bot', sa.Boolean(), server_default='false'))
    op.add_column('subscription_plans', sa.Column('has_behavioral_threat_intel', sa.Boolean(), server_default='false'))
    op.add_column('subscription_plans', sa.Column('has_version_whitelist', sa.Boolean(), server_default='false'))


def downgrade() -> None:
    cols = [
        'description', 'discount', 'badge_text', 'badge_color', 'is_recommended',
        'button_text', 'button_color', 'icon', 'sort_order', 'is_active',
        'max_licenses', 'max_variables', 'max_logs', 'max_hashes', 'max_staff', 'max_chatrooms',
        'has_ip_tracking', 'has_location_tracking', 'has_user_panel', 'has_staff_management',
        'has_discord_integration', 'has_telegram_integration', 'has_api_access', 'has_custom_domain',
        'has_live_chat', 'has_audit_logs', 'has_webhooks', 'has_white_label', 'has_priority_support',
        'has_ssl', 'has_global_chat', 'has_custom_bot', 'has_behavioral_threat_intel', 'has_version_whitelist',
    ]
    for col in cols:
        op.drop_column('subscription_plans', col)
