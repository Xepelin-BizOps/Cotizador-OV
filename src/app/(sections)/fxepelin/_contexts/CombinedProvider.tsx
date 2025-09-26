"use client";

import React, { ReactNode } from 'react';
import { BalancesProvider } from './BalancesContext';
import { MovimientosProvider } from './MovimientosContext';

interface CombinedProviderProps {
  children: ReactNode;
}

export const CombinedProvider = ({ children }: CombinedProviderProps) => {
  return (
    <MovimientosProvider>
      <BalancesProvider>
        {children}
      </BalancesProvider>
    </MovimientosProvider>
  );
};
