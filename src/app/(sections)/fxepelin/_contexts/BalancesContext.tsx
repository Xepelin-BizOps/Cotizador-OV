"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type Currency = 'USD' | 'MXN' | 'USD-BUY' | 'MXN-BUY' | 'USD-SELL' | 'MXN-SELL';

export interface Balance {
  currency: Currency;
  amount: number;
  lastUpdated?: Date;
}

export interface ConversionData {
  fromCurrency: Currency;
  toCurrency: Currency;
  fromAmount: number;
  toAmount: number;
  exchangeRate: number;
  fee: number;
}

interface BalancesContextType {
  balances: Balance[];
  exchangeRates: { [key: string]: number };
  isLoading: boolean;
  isDisconnected: boolean;
  convertCurrency: (data: ConversionData) => Promise<boolean>;
  refreshBalances: () => Promise<void>;
  getCurrentBalance: (currency: Currency) => number;
  getExchangeRate: (from: Currency, to: Currency) => number;
}

const BalancesContext = createContext<BalancesContextType | undefined>(undefined);

export const useBalances = () => {
  const context = useContext(BalancesContext);
  if (!context) {
    throw new Error('useBalances debe usarse dentro de BalancesProvider');
  }
  return context;
};

// Mock data for development - will be replaced with real API calls
const mockBalances: Balance[] = [
  { currency: 'MXN', amount: 12384.28, lastUpdated: new Date() },
  { currency: 'USD', amount: 650.45, lastUpdated: new Date() }
];

// Default exchange rate: 1 USD = 18.3 MXN
// TODO: Replace with real endpoint call to get current exchange rates
const DEFAULT_USD_MXN_RATE = 18.3;

const mockExchangeRates = {
  'USD-MXN': DEFAULT_USD_MXN_RATE,
  'MXN-USD': 1 / DEFAULT_USD_MXN_RATE
};

interface BalancesProviderProps {
  children: ReactNode;
  movimientosContext?: {
    agregarMovimiento: (movimiento: unknown) => void;
  };
}

export const BalancesProvider = ({ children, movimientosContext }: BalancesProviderProps) => {
  const [balances, setBalances] = useState<Balance[]>([]);
  const [exchangeRates, setExchangeRates] = useState({
    'USD-MXN': DEFAULT_USD_MXN_RATE,
    'MXN-USD': 1 / DEFAULT_USD_MXN_RATE,
    'USD-MXN-BUY': DEFAULT_USD_MXN_RATE + 0.1,
    'MXN-USD-SELL': 1 / (DEFAULT_USD_MXN_RATE - 0.1),
    'USD-MXN-SELL': DEFAULT_USD_MXN_RATE - 0.1,
    'MXN-USD-BUY': 1 / (DEFAULT_USD_MXN_RATE + 0.1)
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isDisconnected, setIsDisconnected] = useState(false);

  const getCurrentBalance = (currency: Currency): number => {
    const balance = balances.find(b => b.currency === currency);
    const amount = balance?.amount;
    console.log('getCurrentBalance:', { currency, balance, amount, type: typeof amount });
    
    if (typeof amount === 'number') {
      return amount;
    } else if (typeof amount === 'string') {
      const parsed = parseFloat(amount);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  const getExchangeRate = (from: Currency, to: Currency): number => {
    if (from === to) return 1;
    
    // Manejar casos especiales con sufijos
    if (to.includes('-BUY') || to.includes('-SELL')) {
      const key = `${from}-${to}` as keyof typeof exchangeRates;
      const rate = exchangeRates[key];
      return typeof rate === 'number' ? rate : 1;
    }
    
    const key = `${from}-${to}` as keyof typeof exchangeRates;
    const rate = exchangeRates[key];
    return typeof rate === 'number' ? rate : 1;
  };

  const convertCurrency = async (data: ConversionData): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Validate that user has enough balance
      const fromBalance = getCurrentBalance(data.fromCurrency);
      if (fromBalance < data.fromAmount) {
        throw new Error('Saldo insuficiente');
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update balances locally (in real app, this would be handled by backend)
      setBalances(prevBalances => 
        prevBalances.map(balance => {
          if (balance.currency === data.fromCurrency) {
            return {
              ...balance,
              amount: balance.amount - data.fromAmount - data.fee,
              lastUpdated: new Date()
            };
          }
          if (balance.currency === data.toCurrency) {
            return {
              ...balance,
              amount: balance.amount + data.toAmount,
              lastUpdated: new Date()
            };
          }
          return balance;
        })
      );

      // Add conversion transaction to movements (if context is available)
      if (movimientosContext?.agregarMovimiento) {
        const now = new Date();
        const fecha = now.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }).replace('.', '');
        const hora = now.toLocaleTimeString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true
        });

        movimientosContext.agregarMovimiento({
          fecha,
          tipo: 'conversion' as const,
          descripcion: 'Conversión de divisas',
          destinatario: `${data.fromCurrency} a ${data.toCurrency}`,
          monto: data.toAmount,
          moneda: data.toCurrency,
          hora,
          montoOriginal: -data.fromAmount,
          monedaOriginal: data.fromCurrency,
          tipoCambio: data.exchangeRate
        });
      }

      return true;
    } catch (error) {
      console.error('Error converting currency:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const cargarBalances = async (): Promise<void> => {
    try {
      setIsLoading(true);
      console.log('Loading balances from API...');
      const response = await fetch('/api/fxepelin/balances');
      const data = await response.json();
      
      console.log('API response:', data);
      
      if (Array.isArray(data)) {
        const formattedBalances = data.map((balance: any) => ({
          currency: balance.currency,
          amount: typeof balance.amount === 'string' ? parseFloat(balance.amount) : balance.amount,
          lastUpdated: new Date()
        }));
        console.log('Formatted balances:', formattedBalances);
        setBalances(formattedBalances);
      } else if (data && data.currency && data.amount !== undefined) {
        // Manejar respuesta de objeto único
        const formattedBalance = {
          currency: data.currency,
          amount: typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount,
          lastUpdated: new Date()
        };
        console.log('Formatted balance (single object):', formattedBalance);
        setBalances([formattedBalance]);
      } else {
        console.error('Error loading balances:', data.error);
        console.log('Using mock balances as fallback');
        setBalances(mockBalances);
      }
    } catch (error) {
      console.error('Error loading balances:', error);
      console.log('Using mock balances as fallback');
      setBalances(mockBalances);
    } finally {
      setIsLoading(false);
    }
  };

  const cargarTiposCambio = async (): Promise<void> => {
    try {
      // TEMPORALMENTE DESHABILITADO - Usar solo datos mock
      console.log('Using mock exchange rates (Bridge API disabled)');
      
      // Usar datos mock con variación realista
      const baseRate = DEFAULT_USD_MXN_RATE;
      const variation = (Math.random() - 0.5) * 0.5; // ±0.25 MXN
      const currentRate = baseRate + variation;
      
      // Simular buy_rate y sell_rate con spread típico
      const buyRate = currentRate + 0.1;  // Más alto para comprar USD
      const sellRate = currentRate - 0.1; // Más bajo para vender USD
      
      const updatedRates = {
        'USD-MXN': currentRate,
        'MXN-USD': 1 / currentRate,
        'USD-MXN-BUY': buyRate, // Para depositar (MXN -> USD)
        'MXN-USD-SELL': 1 / sellRate, // Para retirar (USD -> MXN)
        'USD-MXN-SELL': sellRate, // Para retirar (USD -> MXN)
        'MXN-USD-BUY': 1 / buyRate // Para depositar (MXN -> USD)
      };
      setExchangeRates(updatedRates);
      setIsDisconnected(false);
      console.log('Mock exchange rates updated:', updatedRates);
      
    } catch (error) {
      console.error('Error loading exchange rates:', error);
      setIsDisconnected(true);
      // Fallback a datos mock si hay error
      const currentRate = DEFAULT_USD_MXN_RATE + (Math.random() - 0.5) * 0.2;
      const updatedRates = {
        'USD-MXN': currentRate,
        'MXN-USD': 1 / currentRate,
        'USD-MXN-BUY': currentRate,
        'MXN-USD-SELL': 1 / currentRate,
        'USD-MXN-SELL': currentRate,
        'MXN-USD-BUY': 1 / currentRate
      };
      setExchangeRates(updatedRates);
    }
  };

  const refreshBalances = async (): Promise<void> => {
    console.log('Refreshing balances...');
    await cargarBalances();
    await cargarTiposCambio();
    console.log('Balances refreshed successfully');
  };

  // Cargar balances y tipos de cambio al inicializar
  useEffect(() => {
    cargarBalances();
    cargarTiposCambio();
  }, []);

  // Update exchange rates periodically
  useEffect(() => {
    const interval = setInterval(() => {
      cargarTiposCambio();
    }, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <BalancesContext.Provider value={{
      balances,
      exchangeRates,
      isLoading,
      isDisconnected,
      convertCurrency,
      refreshBalances,
      getCurrentBalance,
      getExchangeRate
    }}>
      {children}
    </BalancesContext.Provider>
  );
};
