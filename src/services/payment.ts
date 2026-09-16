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

export interface MyBundle {
  id: number;
  bundle: ServiceBundle;
  purchase_date: string;
  expiry_date?: string;
  is_active: boolean;
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
