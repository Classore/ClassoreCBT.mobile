import { api } from './api';

export interface SupportedBank {
  code: string;
  name: string;
}

export interface BankAccount {
  id?: number;
  bank_name: string;
  account_number: string;
  account_name: string;
  is_default?: boolean;
}

export const walletService = {
  getSupportedBanks: async (): Promise<SupportedBank[]> => {
    const response = await api.get('/api/wallet/banks/supported/');
    return response.data;
  },

  verifyBankAccount: async (bank_code: string, account_number: string): Promise<{ account_name: string; account_number: string; bank_code: string }> => {
    const response = await api.post('/api/wallet/banks/verify/', { bank_code, account_number });
    return response.data;
  },

  getSavedBankAccounts: async (): Promise<BankAccount[]> => {
    const response = await api.get('/api/wallet/banks/');
    return response.data.results ? response.data.results : response.data;
  },

  saveBankAccount: async (data: BankAccount): Promise<BankAccount> => {
    const response = await api.post('/api/wallet/banks/', data);
    return response.data;
  },

  getTransactions: async (params?: { type?: string }): Promise<any[]> => {
    const query = new URLSearchParams();
    if (params?.type && params.type !== 'All') {
      query.append('type', params.type.toLowerCase());
    }
    const response = await api.get(`/api/wallet/transactions/?${query.toString()}`);
    return response.data.results ? response.data.results : response.data;
  },

  requestWithdrawal: async (amount: number, bank_account_id: number): Promise<any> => {
    const response = await api.post('/api/wallet/withdrawals/', {
      token_amount: amount,
      bank_account: bank_account_id,
    });
    return response.data;
  }
};
