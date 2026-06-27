import type { Plan, AdminPlanForm } from '@/types/pricing';

export interface FeatureDef {
  key: string;
  label: string;
  icon: string;
  type: 'boolean' | 'limit';
  limitKey?: string;
  format?: (val: number) => string;
}

export const ALL_FEATURES: FeatureDef[] = [
  { key: 'applications', label: 'Applications', icon: 'apps', type: 'limit', limitKey: 'max_apps', format: v => v >= 999 ? 'Unlimited' : v.toString() },
  { key: 'users', label: 'Users & Licenses', icon: 'group', type: 'limit', limitKey: 'max_licenses', format: v => v >= 99999 ? 'Unlimited' : v.toLocaleString() },
  { key: 'variables', label: 'Cloud Variables', icon: 'data_array', type: 'limit', limitKey: 'max_variables', format: v => v >= 99999 ? 'Unlimited' : v.toLocaleString() },
  { key: 'logs', label: 'Activity Logs', icon: 'history', type: 'limit', limitKey: 'max_logs', format: v => v >= 99999 ? 'Unlimited' : v.toLocaleString() },
  { key: 'hashes', label: 'App Hashes', icon: 'fingerprint', type: 'limit', limitKey: 'max_hashes', format: v => v >= 999 ? 'Unlimited' : v.toString() },
  { key: 'ip_tracking', label: 'IP Tracking', icon: 'pin_drop', type: 'boolean', limitKey: 'has_ip_tracking' },
  { key: 'location_tracking', label: 'Location Tracking', icon: 'map', type: 'boolean', limitKey: 'has_location_tracking' },
  { key: 'user_panel', label: 'User Panel Access', icon: 'person', type: 'boolean', limitKey: 'has_user_panel' },
  { key: 'staff_management', label: 'Staff Management', icon: 'supervisor_account', type: 'boolean', limitKey: 'has_staff_management' },
  { key: 'staff', label: 'Staff / Roles / Resellers', icon: 'badge', type: 'limit', limitKey: 'max_staff', format: v => v >= 999 ? 'Unlimited' : v.toString() },
  { key: 'discord', label: 'Discord Bot Integration', icon: 'headset_mic', type: 'boolean', limitKey: 'has_discord_integration' },
  { key: 'telegram', label: 'Telegram Bot Integration', icon: 'send', type: 'boolean', limitKey: 'has_telegram_integration' },
  { key: 'api_access', label: 'API Access', icon: 'api', type: 'boolean', limitKey: 'has_api_access' },
  { key: 'custom_domain', label: 'Custom Domain', icon: 'language', type: 'boolean', limitKey: 'has_custom_domain' },
  { key: 'live_chat', label: 'Live Chat', icon: 'chat', type: 'limit', limitKey: 'max_chatrooms', format: v => v >= 999 ? 'Unlimited' : v <= 0 ? '—' : `${v} Channels` },
  { key: 'audit_log_limit', label: 'Audit Log Limit', icon: 'history_toggle_off', type: 'limit', limitKey: 'audit_log_limit', format: v => v >= 999999 ? 'Unlimited' : v.toLocaleString() },
  { key: 'audit_logs', label: 'Audit Logs', icon: 'visibility', type: 'boolean', limitKey: 'has_audit_logs' },
  { key: 'webhooks', label: 'Advanced Webhooks', icon: 'webhook', type: 'boolean', limitKey: 'has_webhooks' },
  { key: 'white_label', label: 'White Label', icon: 'branding_watermark', type: 'boolean', limitKey: 'has_white_label' },
  { key: 'priority_support', label: 'Priority Support', icon: 'support_agent', type: 'boolean', limitKey: 'has_priority_support' },
  { key: 'ssl', label: 'SSL Support', icon: 'enhanced_encryption', type: 'boolean', limitKey: 'has_ssl' },
  { key: 'global_chat', label: 'Global Chat Access', icon: 'forum', type: 'boolean', limitKey: 'has_global_chat' },
  { key: 'custom_bot', label: 'Custom Bot Integration', icon: 'smart_toy', type: 'boolean', limitKey: 'has_custom_bot' },
  { key: 'threat_intel', label: 'Behavioral Threat Intelligence', icon: 'security', type: 'boolean', limitKey: 'has_behavioral_threat_intel' },
  { key: 'version_whitelist', label: 'Version Whitelisting', icon: 'checklist', type: 'boolean', limitKey: 'has_version_whitelist' },
];

export function getFeatureValue(plan: Plan | AdminPlanForm, feature: FeatureDef): boolean | number {
  if (feature.type === 'boolean') {
    return (plan as any)[feature.limitKey!] ?? false;
  }
  return (plan as any)[feature.limitKey!] ?? 0;
}

export function formatFeatureValue(plan: Plan | AdminPlanForm, feature: FeatureDef): string {
  const val = getFeatureValue(plan, feature);
  if (feature.type === 'limit' && feature.format) {
    return feature.format(val as number);
  }
  return val ? '✓' : '—';
}

export function planApiToForm(plan: Plan): AdminPlanForm {
  return {
    name: plan.name,
    description: plan.description || '',
    price_monthly: plan.price_monthly,
    price_yearly: plan.price_yearly,
    discount: plan.discount || 0,
    badge_text: plan.badge_text || '',
    badge_color: plan.badge_color || '#3b82f6',
    is_recommended: plan.is_recommended || false,
    button_text: plan.button_text || 'Choose Plan',
    button_color: plan.button_color || 'var(--primary)',
    max_apps: plan.max_apps,
    max_users: plan.max_users,
    max_licenses: plan.max_licenses,
    max_variables: plan.max_variables,
    max_logs: plan.max_logs,
    max_hashes: plan.max_hashes,
    max_staff: plan.max_staff,
    max_chatrooms: plan.max_chatrooms,
    has_ip_tracking: plan.has_ip_tracking || false,
    has_location_tracking: plan.has_location_tracking || false,
    has_user_panel: plan.has_user_panel || false,
    has_staff_management: plan.has_staff_management || false,
    has_discord_integration: plan.has_discord_integration || false,
    has_telegram_integration: plan.has_telegram_integration || false,
    has_api_access: plan.has_api_access || false,
    has_custom_domain: plan.has_custom_domain || false,
    has_live_chat: plan.has_live_chat || false,
    audit_log_limit: plan.audit_log_limit ?? 1000,
    has_audit_logs: plan.has_audit_logs || false,
    has_webhooks: plan.has_webhooks || false,
    has_white_label: plan.has_white_label || false,
    has_priority_support: plan.has_priority_support || false,
    has_ssl: plan.has_ssl || false,
    has_global_chat: plan.has_global_chat || false,
    has_custom_bot: plan.has_custom_bot || false,
    has_behavioral_threat_intel: plan.has_behavioral_threat_intel || false,
    icon: plan.icon || 'card_membership',
    sort_order: plan.sort_order || 0,
    is_active: plan.is_active ?? true,
  };
}

export function calcYearlySavings(monthly: number, yearly: number): number {
  if (monthly <= 0 || yearly <= 0) return 0;
  return Math.round((1 - yearly / (monthly * 12)) * 100);
}

export const DEFAULT_PLANS: Plan[] = [
  {
    id: 1, name: 'Free', description: 'Essential auth, HWID lock, license keys, 2 apps', price_monthly: 0, price_yearly: 0, discount: 0,
    badge_text: '', badge_color: '', is_recommended: false,
    button_text: 'Get Started', button_color: 'var(--primary)',
    max_apps: 2, max_users: 30, max_licenses: 30, max_variables: 40, max_logs: 200, max_hashes: 2,
    max_staff: 0, max_chatrooms: 0,
    has_ip_tracking: false, has_location_tracking: false, has_user_panel: true,
    has_staff_management: true, has_discord_integration: false, has_telegram_integration: false,
    has_api_access: true, has_custom_domain: false, has_live_chat: false,
    has_audit_logs: true, has_webhooks: false, has_white_label: false,
    has_priority_support: false, has_ssl: false, has_global_chat: false,
    has_custom_bot: false, has_behavioral_threat_intel: false,
    has_version_whitelist: true,
    audit_log_limit: 50,
    icon: 'explore', sort_order: 1, is_active: true,
    features: [], created_at: '', updated_at: '',
  },
  {
    id: 2, name: 'Developer', description: 'AI agent, webhooks, team mgmt, IP tracking, user panel', price_monthly: 99, price_yearly: 999, discount: 16,
    badge_text: '', badge_color: '', is_recommended: true,
    button_text: 'Choose Plan', button_color: '#3b82f6',
    max_apps: 20, max_users: 10000, max_licenses: 10000, max_variables: 999999, max_logs: 5000, max_hashes: 20,
    max_staff: 10, max_chatrooms: 0,
    has_ip_tracking: true, has_location_tracking: true, has_user_panel: true,
    has_staff_management: true, has_discord_integration: false, has_telegram_integration: false,
    has_api_access: true, has_custom_domain: false, has_live_chat: false,
    has_audit_logs: true, has_webhooks: true, has_white_label: false,
    has_priority_support: false, has_ssl: false, has_global_chat: false,
    has_custom_bot: false, has_behavioral_threat_intel: false,
    has_version_whitelist: true,
    audit_log_limit: 150,
    icon: 'workspace_premium', sort_order: 2, is_active: true,
    features: [], created_at: '', updated_at: '',
  },
  {
    id: 3, name: 'Seller', description: 'Chatrooms, Discord/Telegram bots, seller API, unlimited', price_monthly: 199, price_yearly: 1999, discount: 16,
    badge_text: 'BEST VALUE', badge_color: '#10b981', is_recommended: false,
    button_text: 'Choose Plan', button_color: 'var(--primary)',
    max_apps: 999999, max_users: 999999, max_licenses: 999999, max_variables: 999999, max_logs: 999999, max_hashes: 999999,
    max_staff: 999999, max_chatrooms: 999999,
    has_ip_tracking: true, has_location_tracking: true, has_user_panel: true,
    has_staff_management: true, has_discord_integration: true, has_telegram_integration: true,
    has_api_access: true, has_custom_domain: false, has_live_chat: true,
    has_audit_logs: true, has_webhooks: true, has_white_label: false,
    has_priority_support: false, has_ssl: false, has_global_chat: false,
    has_custom_bot: false, has_behavioral_threat_intel: false,
    has_version_whitelist: true,
    audit_log_limit: 250,
    icon: 'rocket', sort_order: 3, is_active: true,
    features: [], created_at: '', updated_at: '',
  },
  {
    id: 4, name: 'Enterprise', description: 'White-label, custom domain, SSL, dedicated priority support', price_monthly: 299, price_yearly: 2999, discount: 16,
    badge_text: '', badge_color: '', is_recommended: false,
    button_text: 'Contact Sales', button_color: 'var(--primary)',
    max_apps: 999999, max_users: 999999, max_licenses: 999999, max_variables: 999999, max_logs: 999999, max_hashes: 999999,
    max_staff: 999999, max_chatrooms: 999999,
    has_ip_tracking: true, has_location_tracking: true, has_user_panel: true,
    has_staff_management: true, has_discord_integration: true, has_telegram_integration: true,
    has_api_access: true, has_custom_domain: true, has_live_chat: true,
    has_audit_logs: true, has_webhooks: true, has_white_label: true,
    has_priority_support: true, has_ssl: true, has_global_chat: true,
    has_custom_bot: true, has_behavioral_threat_intel: true,
    has_version_whitelist: true,
    audit_log_limit: 500,
    icon: 'diamond', sort_order: 4, is_active: true,
    features: [], created_at: '', updated_at: '',
  },
];
