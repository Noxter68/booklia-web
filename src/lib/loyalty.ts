// Mirror of backend/src/modules/bookings/pricing.helper.ts.
// Keep both in sync if the surcharge rule changes.

export interface PricingTier {
  thresholdWeeks: number;
  surchargeCents: number;
}

export interface LoyaltyComputation {
  surchargeCents: number;
  appliedTierWeeks: number | null;
  weeksSinceLast: number | null;
  daysSinceLast: number | null;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_WEEK = 7 * MS_PER_DAY;

/**
 * Picks the highest matching tier whose threshold is <= the elapsed weeks
 * since the last completed booking. First-time bookings or scheduledAt in
 * the past return no surcharge.
 */
export function computeLoyaltySurcharge(
  tiers: PricingTier[],
  lastCompletedAt: Date | null,
  scheduledAt: Date,
): LoyaltyComputation {
  if (!lastCompletedAt || tiers.length === 0) {
    return {
      surchargeCents: 0,
      appliedTierWeeks: null,
      weeksSinceLast: null,
      daysSinceLast: null,
    };
  }
  const elapsedMs = scheduledAt.getTime() - lastCompletedAt.getTime();
  if (elapsedMs <= 0) {
    return {
      surchargeCents: 0,
      appliedTierWeeks: null,
      weeksSinceLast: null,
      daysSinceLast: null,
    };
  }
  const weeksSinceLast = elapsedMs / MS_PER_WEEK;
  const daysSinceLast = Math.floor(elapsedMs / MS_PER_DAY);

  let matched: PricingTier | null = null;
  for (const tier of tiers) {
    if (weeksSinceLast >= tier.thresholdWeeks) {
      if (!matched || tier.thresholdWeeks > matched.thresholdWeeks) {
        matched = tier;
      }
    }
  }

  return matched
    ? {
        surchargeCents: matched.surchargeCents,
        appliedTierWeeks: matched.thresholdWeeks,
        weeksSinceLast,
        daysSinceLast,
      }
    : {
        surchargeCents: 0,
        appliedTierWeeks: null,
        weeksSinceLast,
        daysSinceLast,
      };
}
