export const draftPassPricing = {
  pricePerPass: 25, // USD
  currency: 'USD' as const,
  bonuses: [] as { quantity: number; bonus: number }[],
};

// Card Purchase Rewards: every 6 card purchases = 1 free draft pass
export const CARD_PURCHASES_FOR_FREE_DRAFT = 6;
