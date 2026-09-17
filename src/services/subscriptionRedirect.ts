export interface PendingTestRedirect {
  pathname: string;
  params?: Record<string, any>;
  autoStart?: boolean;
}

let pendingRedirectMemory: PendingTestRedirect | null = null;

export const subscriptionRedirect = {
  setPendingRedirect: (redirect: PendingTestRedirect | null) => {
    pendingRedirectMemory = redirect;
  },
  getPendingRedirect: (): PendingTestRedirect | null => {
    return pendingRedirectMemory;
  },
  clearPendingRedirect: () => {
    pendingRedirectMemory = null;
  },
};
