import api from './api';

export interface TokenPackage {
  id: number;
  name: string;
  price: string;
  currency: string;
  base_tokens: number;
  bonus_tokens: number;
  is_active: boolean;
}

export interface ServiceBundle {
  id: number;
  name: string;
  exam_type: number;
  token_cost: number;
  billing_type: string;
  is_customizable: boolean;
  customization_limit?: number;
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

  initializePaystack: async (packageId: number): Promise<{ authorization_url: string; access_code: string; reference: string }> => {
    const response = await api.post('/api/payments/paystack/initialize/', { package_id: packageId });
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
