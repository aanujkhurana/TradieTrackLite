import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  createEmptyEntitlement,
  loadAdFreeEntitlement,
  saveAdFreeEntitlement,
} from './entitlementStorage';
import {
  purchaseAdFree as purchaseAdFreeWithRevenueCat,
  restoreAdFreePurchase,
} from './revenueCat';

const MonetizationContext = createContext(null);

export function MonetizationProvider({
  children,
  purchaseClient = {
    purchaseAdFree: purchaseAdFreeWithRevenueCat,
    restoreAdFreePurchase,
  },
}) {
  const [entitlement, setEntitlement] = useState(createEmptyEntitlement());
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    loadAdFreeEntitlement()
      .then((stored) => {
        if (mounted) {
          setEntitlement(stored);
        }
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const persistPurchaseState = useCallback(async (nextState) => {
    const stored = await saveAdFreeEntitlement(nextState);
    setEntitlement(stored);
    return stored;
  }, []);

  const purchaseAdFree = useCallback(async () => {
    setIsBusy(true);
    try {
      const nextState = await purchaseClient.purchaseAdFree();
      return await persistPurchaseState(nextState);
    } finally {
      setIsBusy(false);
    }
  }, [persistPurchaseState, purchaseClient]);

  const restorePurchase = useCallback(async () => {
    setIsBusy(true);
    try {
      const nextState = await purchaseClient.restoreAdFreePurchase();
      return await persistPurchaseState(nextState);
    } finally {
      setIsBusy(false);
    }
  }, [persistPurchaseState, purchaseClient]);

  const value = useMemo(
    () => ({
      entitlement,
      isAdFree: entitlement.isAdFree === true,
      isLoading,
      isBusy,
      purchaseAdFree,
      restorePurchase,
    }),
    [entitlement, isBusy, isLoading, purchaseAdFree, restorePurchase]
  );

  return (
    <MonetizationContext.Provider value={value}>
      {children}
    </MonetizationContext.Provider>
  );
}

export function useMonetization() {
  const value = useContext(MonetizationContext);
  if (!value) {
    throw new Error('useMonetization must be used inside MonetizationProvider.');
  }
  return value;
}
