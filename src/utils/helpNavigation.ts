import { router } from 'expo-router';

export interface RouteTarget {
  pathname: string;
  params?: Record<string, any>;
}

class HelpNavigationHistory {
  private stack: RouteTarget[] = [];

  push(route: RouteTarget) {
    if (this.stack.length === 0 || this.stack[this.stack.length - 1].pathname !== route.pathname) {
      this.stack.push(route);
    }
  }

  pop(): RouteTarget | undefined {
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
  extraParams?: Record<string, any>,
  currentRouteParams?: Record<string, any>
) => {
  helpNavHistory.push({ pathname: currentRoute, params: currentRouteParams });
  router.push({
    pathname: target as any,
    params: {
      from: currentRoute,
      from_params: currentRouteParams ? JSON.stringify(currentRouteParams) : undefined,
      ...extraParams,
    },
  });
};

export const handleHelpBack = (
  fromParam?: string,
  defaultFallback: string = '/(tabs)/profile',
  fromParamsJson?: string
) => {
  // If we pushed the screen onto the navigation stack, pop back to keep the exact live state
  if (router.canGoBack()) {
    router.back();
    return;
  }

  let parsedFromParams: Record<string, any> | undefined;
  if (fromParamsJson) {
    try {
      parsedFromParams = JSON.parse(fromParamsJson);
    } catch (e) {
      console.warn('Could not parse fromParamsJson in handleHelpBack:', e);
    }
  }

  if (fromParam) {
    router.replace({
      pathname: fromParam as any,
      params: parsedFromParams,
    });
    return;
  }

  if (helpNavHistory.canGoBack()) {
    const prev = helpNavHistory.pop();
    if (prev) {
      router.replace({
        pathname: prev.pathname as any,
        params: prev.params,
      });
      return;
    }
  }

  router.replace(defaultFallback as any);
};
