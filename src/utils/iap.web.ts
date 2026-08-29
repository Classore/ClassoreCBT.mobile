export const RNIap = {
  initConnection: async () => false,
  endConnection: () => {},
  getProducts: async () => [],
  requestPurchase: async () => {},
  purchaseUpdatedListener: () => ({ remove: () => {} }),
  purchaseErrorListener: () => ({ remove: () => {} }),
  finishTransaction: async () => {},
};
