/** Subscription tier levels — higher unlocks more dashboard features */

export type NavTier = 'tester' | 'developer' | 'seller';

const TIER_LEVEL: Record<string, number> = {
  free: 0,
  tester: 1,
  test: 1,
  developer: 2,
  dev: 2,
  pro: 3,
  seller: 3,
  enterprise: 4,
  ent: 4,
};

const NAV_REQUIRED_LEVEL: Record<NavTier, number> = {
  tester: 0,
  developer: 2,
  seller: 3,
};

export function getTierLevel(tier?: string | null): number {
  if (!tier) return 1;
  const key = tier.toLowerCase().trim();
  if (TIER_LEVEL[key] !== undefined) return TIER_LEVEL[key];
  if (key.includes('enterprise') || key.includes('ent')) return 4;
  if (key.includes('seller')) return 3;
  if (key.includes('developer') || key.includes('dev')) return 2;
  return 1;
}

export function canAccessNav(
  navTier: NavTier,
  userTier?: string | null,
  planFeatures?: string[],
  navItemName?: string,
): boolean {
  const level = getTierLevel(userTier);
  if (level >= NAV_REQUIRED_LEVEL[navTier]) return true;

  if (planFeatures?.length && navItemName) {
    const needle = navItemName.toLowerCase();
    return planFeatures.some((f) => {
      const feat = f.toLowerCase();
      return feat.includes(needle) || needle.includes(feat.split(' ')[0]);
    });
  }

  return false;
}

export function tierDisplayName(tier?: string | null, planName?: string | null): string {
  if (planName) return planName;
  if (!tier) return 'Tester';
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}
