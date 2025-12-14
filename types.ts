export enum DealType {
  NONE = 'None',
  LIGHTNING = 'Lightning Deal',
  DEAL_OF_DAY = 'Deal of the Day',
  PRIME_EXCLUSIVE = 'Prime Exclusive',
  LIMITED_TIME = 'Limited Time Deal'
}

export interface ProductData {
  id: string; // Internal ID for the list
  asin: string;
  title: string;
  currentPrice: number;
  mrp: number;
  currency: string;
  hasCoupon: boolean;
  couponValue?: string; // e.g., "₹500" or "5%"
  dealType: DealType;
  promoText?: string;
  finalPrice: number;
  status: 'active_discount' | 'no_discount' | 'error';
  lastChecked: string;
  imageUrl?: string; // Optional for UI flair
}

export interface ScrapeStats {
  total: number;
  processed: number;
  success: number;
  failed: number;
  discountsFound: number;
}
