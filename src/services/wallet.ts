import api from './api';

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
    const response = await api.get('/api/user/wallet/banks/supported/');
    return response.data;
  },

  verifyBankAccount: async (bank_code: string, account_number: string): Promise<{ account_name: string; account_number: string; bank_code: string }> => {
    const response = await api.post('/api/user/wallet/banks/verify/', { bank_code, account_number });
    return response.data;
  },

  getSavedBankAccounts: async (): Promise<BankAccount[]> => {
    const response = await api.get('/api/user/wallet/banks/');
    return response.data.results ? response.data.results : response.data;
  },

  saveBankAccount: async (data: BankAccount): Promise<BankAccount> => {
    const response = await api.post('/api/user/wallet/banks/', data);
    return response.data;
  }
};
