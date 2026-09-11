import { router } from 'expo-router';

class HelpNavigationHistory {
  private stack: string[] = [];

  push(currentRoute: string) {
    if (this.stack.length === 0 || this.stack[this.stack.length - 1] !== currentRoute) {
      this.stack.push(currentRoute);
    }
  }

  pop(): string | undefined {
    return this.stack.pop();
  }

  canGoBack(): boolean {
    return this.stack.length > 0;
  }

  clear() {
    this.stack = [];
  }
}

export const helpNavHistory = new HelpNavigationHistory();

export const navigateWithFrom = (
  target: string,
  currentRoute: string,
  extraParams?: Record<string, any>
) => {
  helpNavHistory.push(currentRoute);
  router.push({
    pathname: target as any,
    params: {
      from: currentRoute,
      ...extraParams,
    },
  });
};

export const handleHelpBack = (
  fromParam?: string,
  defaultFallback: string = '/(tabs)/profile'
) => {
  if (fromParam) {
    router.replace(fromParam as any);
    return;
  }
  if (helpNavHistory.canGoBack()) {
    const prev = helpNavHistory.pop();
    if (prev) {
      router.replace(prev as any);
      return;
    }
  }
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace(defaultFallback as any);
};
