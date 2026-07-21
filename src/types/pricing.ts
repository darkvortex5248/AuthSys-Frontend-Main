'use client';

export interface Plan {
  id: number;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  discount: number;
  badge_text: string;
  badge_color: string;
  is_recommended: boolean;
  button_text: string;
  button_color: string;
  features: PlanFeature[];
  max_apps: number;
  max_users: number;
  max_licenses: number;
  max_variables: number;
  max_logs: number;
  max_hashes: number;
  max_staff: number;
  max_chatrooms: number;
  has_ip_tracking: boolean;
  has_location_tracking: boolean;
  has_user_panel: boolean;
  has_staff_management: boolean;
  has_discord_integration: boolean;
  has_telegram_integration: boolean;
  has_api_access: boolean;
  has_custom_domain: boolean;
  has_live_chat: boolean;
  audit_log_limit: number;
  has_audit_logs: boolean;
  has_webhooks: boolean;
  has_white_label: boolean;
  has_priority_support: boolean;
  has_ssl: boolean;
  has_global_chat: boolean;
  has_custom_bot: boolean;
  has_behavioral_threat_intel: boolean;
  has_version_whitelist: boolean;
  icon: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlanFeature {
  key: string;
  label: string;
  included: boolean;
  icon?: string;
}

export interface Subscription {
  id: number;
  plan_id: number;
  plan?: Plan;
  status: 'active' | 'expired' | 'trial' | 'pending' | 'cancelled';
  start_date: string;
  end_date: string;
  billing_cycle: 'monthly' | 'yearly';
  payment_status: 'paid' | 'pending' | 'failed';
  transaction_id: string;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: number;
  subscription_id: number;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  billing_cycle: 'monthly' | 'yearly';
  period_start: string;
  period_end: string;
  issued_at: string;
  paid_at?: string;
}

export interface AdminPlanForm {
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  discount: number;
  badge_text: string;
  badge_color: string;
  is_recommended: boolean;
  button_text: string;
  button_color: string;
  max_apps: number;
  max_users: number;
  max_licenses: number;
  max_variables: number;
  max_logs: number;
  max_hashes: number;
  max_staff: number;
  max_chatrooms: number;
  has_ip_tracking: boolean;
  has_location_tracking: boolean;
  has_user_panel: boolean;
  has_staff_management: boolean;
  has_discord_integration: boolean;
  has_telegram_integration: boolean;
  has_api_access: boolean;
  has_custom_domain: boolean;
  has_live_chat: boolean;
  audit_log_limit: number;
  has_audit_logs: boolean;
  has_webhooks: boolean;
  has_white_label: boolean;
  has_priority_support: boolean;
  has_ssl: boolean;
  has_global_chat: boolean;
  has_custom_bot: boolean;
  has_behavioral_threat_intel: boolean;
  icon: string;
  sort_order: number;
  is_active: boolean;
}

export const EMPTY_PLAN_FORM: AdminPlanForm = {
  name: '',
  description: '',
  price_monthly: 0,
  price_yearly: 0,
  discount: 0,
  badge_text: '',
  badge_color: '#3b82f6',
  is_recommended: false,
  button_text: 'Choose Plan',
  button_color: 'var(--primary)',
  max_apps: 2,
  max_users: 40,
  max_licenses: 40,
  max_variables: 40,
  max_logs: 200,
  max_hashes: 2,
  max_staff: 0,
  max_chatrooms: 0,
  has_ip_tracking: false,
  has_location_tracking: false,
  has_user_panel: false,
  has_staff_management: false,
  has_discord_integration: false,
  has_telegram_integration: false,
  has_api_access: false,
  has_custom_domain: false,
  has_live_chat: false,
  audit_log_limit: 1000,
  has_audit_logs: false,
  has_webhooks: false,
  has_white_label: false,
  has_priority_support: false,
  has_ssl: false,
  has_global_chat: false,
  has_custom_bot: false,
  has_behavioral_threat_intel: false,
  icon: 'card_membership',
  sort_order: 0,
  is_active: true,
};
