import { api } from './api';

export interface TokenPackage {
  id: number;
  name: string;
  price: string;
  currency: string;
  base_tokens: number;
  bonus_tokens: number;
  is_active: boolean;
}

export interface ServiceConfig {
  id: number;
  name: string;
  action_identifier: string;
  exam_type?: number;
  token_cost: number;
  billing_type: string;
  max_usage?: number;
  is_unlimited: boolean;
}

export interface BundleServiceItem {
  id: number;
  service: ServiceConfig;
  max_usage_override?: number;
  is_unlimited_override?: boolean;
}

export interface ServiceBundle {
  id: number;
  name: string;
  description?: string;
  exam_type?: number;
  token_cost: number;
  billing_type: string;
  is_customizable: boolean;
  customization_limit?: number;
  included_services?: BundleServiceItem[];
  is_popular?: boolean;
  tag?: string;
}

export type BundleStatus = 'active' | 'exhausted' | 'expired' | 'inactive';

export interface MyBundle {
  id: number;
  bundle: ServiceBundle;
  purchase_date: string;
  expiry_date?: string;
  expires_at?: string;
  end_date?: string;
  is_active: boolean;
  is_expired?: boolean;
  is_exhausted?: boolean;
  status?: string;
  remaining_usage?: number;
  remaining_assessments?: number;
  remaining_attempts?: number;
  usage_left?: number;
  usage_count?: number;
  max_usage?: number;
  user_services?: any[];
  services?: any[];
}

export function getBundleStatus(bundle: MyBundle | any): BundleStatus {
  if (!bundle) return 'inactive';

  // 1. Explicit status string from backend
  const rawStatus = (bundle.status || '').toLowerCase().trim();
  if (rawStatus === 'exhausted' || rawStatus === 'depleted') return 'exhausted';
  if (rawStatus === 'expired') return 'expired';
  if (rawStatus === 'inactive') return 'inactive';

  // 2. Explicit boolean flags from backend
  if (bundle.is_exhausted === true) return 'exhausted';
  if (bundle.is_expired === true) return 'expired';

  // 3. Expiration date check against current time
  const expiryStr = bundle.expiry_date || bundle.expires_at || bundle.end_date;
  if (expiryStr) {
    const expiryTime = new Date(expiryStr).getTime();
    if (!isNaN(expiryTime) && expiryTime <= Date.now()) {
      return 'expired';
    }
  }

  // 4. Usage exhaustion checks
  if (typeof bundle.remaining_usage === 'number' && bundle.remaining_usage <= 0) {
    return 'exhausted';
  }
  if (typeof bundle.remaining_assessments === 'number' && bundle.remaining_assessments <= 0) {
    return 'exhausted';
  }
  if (typeof bundle.remaining_attempts === 'number' && bundle.remaining_attempts <= 0) {
    return 'exhausted';
  }
  if (typeof bundle.usage_left === 'number' && bundle.usage_left <= 0) {
    return 'exhausted';
  }
  if (typeof bundle.max_usage === 'number' && typeof bundle.usage_count === 'number' && bundle.usage_count >= bundle.max_usage) {
    return 'exhausted';
  }

  // 5. Per-service usage exhaustion check
  const services = bundle.user_services || bundle.services || bundle.included_services;
  if (Array.isArray(services) && services.length > 0) {
    const limitedServices = services.filter(
      (s: any) => s.is_unlimited === false || s.service?.is_unlimited === false || s.is_unlimited_override === false
    );
    const hasUnlimited = services.some(
      (s: any) => s.is_unlimited === true || s.service?.is_unlimited === true || s.is_unlimited_override === true
    );
    if (limitedServices.length > 0 && !hasUnlimited) {
      const allExhausted = limitedServices.every((s: any) => {
        if (s.is_exhausted === true) return true;
        if (typeof s.remaining_usage === 'number' && s.remaining_usage <= 0) return true;
        if (typeof s.max_usage === 'number' && typeof s.usage_count === 'number' && s.usage_count >= s.max_usage) return true;
        return false;
      });
      if (allExhausted) return 'exhausted';
    }
  }

  // 6. Active flag
  if (bundle.is_active === false) return 'inactive';

  return 'active';
}

export function isBundleActive(bundle: MyBundle | any): boolean {
  return getBundleStatus(bundle) === 'active';
}

export const paymentService = {
  getTokenPackages: async (): Promise<TokenPackage[]> => {
    const response = await api.get('/api/admin/token-packages/');
    return response.data.results ? response.data.results : response.data;
  },

  getServiceBundles: async (): Promise<ServiceBundle[]> => {
    try {
      const response = await api.get('/api/admin/service-bundles/');
      const data = response.data.results ? response.data.results : response.data;
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch (e) {
      console.warn('Failed to fetch service bundles from API, falling back to defaults:', e);
    }
    // Return curated bundles fallback
    return [
      {
        id: 18,
        name: 'Full JAMB Package',
        description: 'Best for 2026 candidates\nChoose your 4 UTME subjects\nUnlimited practice',
        token_cost: 6,
        billing_type: 'monthly',
        is_customizable: true,
        customization_limit: 4,
        tag: '',
        is_popular: false,
        included_services: [
          { id: 1, service: { id: 72, name: 'JAMB Use of English', action_identifier: 'jamb_eng', token_cost: 2, billing_type: 'monthly', is_unlimited: true }, is_unlimited_override: true },
          { id: 2, service: { id: 73, name: 'JAMB Mathematics', action_identifier: 'jamb_math', token_cost: 2, billing_type: 'monthly', is_unlimited: true }, is_unlimited_override: true },
          { id: 3, service: { id: 76, name: 'JAMB Biology', action_identifier: 'jamb_bio', token_cost: 2, billing_type: 'monthly', is_unlimited: true }, is_unlimited_override: true },
          { id: 4, service: { id: 75, name: 'JAMB Chemistry', action_identifier: 'jamb_chem', token_cost: 2, billing_type: 'monthly', is_unlimited: true }, is_unlimited_override: true },
          { id: 5, service: { id: 74, name: 'JAMB Physics', action_identifier: 'jamb_phys', token_cost: 2, billing_type: 'monthly', is_unlimited: true }, is_unlimited_override: true },
        ]
      },
      {
        id: 2,
        name: 'IELTS Bundle',
        description: 'Listening, Reading, Speaking & Writing\nListening & Reading Unlimited\nSpeaking: 3 assessments\nWriting: 3 assessments',
        token_cost: 100,
        billing_type: 'monthly',
        is_customizable: false,
        tag: 'Popular',
        is_popular: true,
        included_services: [
          { id: 6, service: { id: 5, name: 'Listening', action_identifier: 'ielts_listening', token_cost: 30, billing_type: 'monthly', is_unlimited: true }, is_unlimited_override: true },
          { id: 7, service: { id: 6, name: 'Reading', action_identifier: 'ielts_reading', token_cost: 30, billing_type: 'monthly', is_unlimited: true }, is_unlimited_override: true },
          { id: 8, service: { id: 7, name: 'Speaking', action_identifier: 'ielts_speaking', token_cost: 25, billing_type: 'monthly', max_usage: 3, is_unlimited: false }, max_usage_override: 4, is_unlimited_override: false },
          { id: 9, service: { id: 8, name: 'Writing', action_identifier: 'ielts_writing', token_cost: 25, billing_type: 'monthly', max_usage: 3, is_unlimited: false }, max_usage_override: 4, is_unlimited_override: false },
        ]
      }
    ];
  },

  getServiceBundleById: async (bundleId: number): Promise<ServiceBundle> => {
    const response = await api.get(`/api/admin/service-bundles/${bundleId}/`);
    return response.data;
  },

  getServiceConfigs: async (): Promise<ServiceConfig[]> => {
    try {
      const response = await api.get('/api/admin/service-configs/');
      const data = response.data.results ? response.data.results : response.data;
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch (e) {
      console.warn('Failed to fetch service configs from API, falling back to defaults:', e);
    }
    return [
      { id: 101, name: 'JAMB Mathematics', action_identifier: 'jamb_math_single', token_cost: 2, billing_type: 'monthly', is_unlimited: true },
      { id: 102, name: 'Extra Speaking Assessment', action_identifier: 'extra_speaking', token_cost: 15, billing_type: 'one_time', max_usage: 1, is_unlimited: false },
      { id: 103, name: 'Extra Writing Assessment', action_identifier: 'extra_writing', token_cost: 10, billing_type: 'one_time', max_usage: 1, is_unlimited: false },
    ];
  },

  initializePaystack: async (packageId: number): Promise<{ authorization_url: string; access_code: string; reference: string }> => {
    const response = await api.post('/api/payments/paystack/initialize/', { package_id: packageId });
    return response.data;
  },

  initializeFlutterwave: async (packageId: number): Promise<{ authorization_url: string; reference: string }> => {
    const response = await api.post('/api/payments/flutterwave/initialize/', { package_id: packageId });
    return response.data;
  },

  verifyAppleIAP: async (transactionId: string): Promise<any> => {
    const response = await api.post('/api/payments/apple-iap/verify/', { transaction_id: transactionId });
    return response.data;
  },

  getMyBundles: async (): Promise<MyBundle[]> => {
    const response = await api.get('/api/auth/my-bundles/');
    return response.data.results ? response.data.results : response.data;
  },

  purchaseBundle: async (bundleId: number, selectedServiceIds?: number[]): Promise<any> => {
    const response = await api.post('/api/payments/purchase-bundle/', {
      bundle_id: bundleId,
      selected_service_ids: selectedServiceIds,
    });
    return response.data;
  },
};
