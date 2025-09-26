"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface ArchivoEvidencia {
  nombre: string;
  tamaño: number;
  tipo: string;
}

export interface CuentaDestino {
  nombre?: string;
  banco?: string;
  numeroCuenta?: string;
  tipo?: string;
  pais?: string;
}

export interface Movimiento {
  id: string;
  fecha: string;
  tipo: 'transferencia_internacional' | 'retiro' | 'fondeo' | 'deposito_usd' | 'recibo';
  descripcion: string;
  destinatario: string;
  monto: number;
  moneda: 'USD' | 'MXN';
  hora: string;
  internacional?: boolean;
  pendiente?: boolean;
  enProceso?: boolean;
  rechazado?: boolean;
  // Para retiros: USD retirado y MXN recibido
  montoRetiradoUSD?: number;
  montoRecibidoMXN?: number;
  // Para fondeos: USD convertido
  montoConvertidoUSD?: number;
  // Para transferencias internacionales
  concepto?: string;
  archivosEvidencia?: ArchivoEvidencia[];
  cuentaDestino?: CuentaDestino;
  // Tipo de cambio usado
  tipoCambio?: number;
}

interface MovimientosContextType {
  movimientos: Movimiento[];
  agregarMovimiento: (movimiento: Omit<Movimiento, 'id'>) => void;
  cargarMovimientos: () => Promise<void>;
  isLoading: boolean;
}

const MovimientosContext = createContext<MovimientosContextType | undefined>(undefined);

export const useMovimientos = () => {
  const context = useContext(MovimientosContext);
  if (!context) {
    throw new Error('useMovimientos debe usarse dentro de MovimientosProvider');
  }
  return context;
};

const movimientosIniciales: Movimiento[] = [
  {
    id: "1",
    fecha: "03 jul",
    tipo: "transferencia_internacional",
    descripcion: "Transferencia Internacional",
    destinatario: "a John Doe - Bank of America",
    monto: -250.00,
    moneda: "USD",
    hora: "2:30 p.m.",
    internacional: true,
    enProceso: true,
    concepto: "Pago de servicios"
  },
  {
    id: "ret1",
    fecha: "03 jul",
    tipo: "retiro",
    descripcion: "Retiro de USD",
    destinatario: "a cuenta STP terminación 5211",
    monto: -200.00,
    moneda: "USD",
    montoRetiradoUSD: 200.00,
    montoRecibidoMXN: 4100.00,
    tipoCambio: 20.50,
    hora: "1:15 p.m."
  },
  {
    id: "fond1",
    fecha: "03 jul",
    tipo: "fondeo",
    descripcion: "Fondeo desde STP",
    destinatario: "desde cuenta STP",
    monto: 100.00,
    moneda: "USD",
    montoRecibidoMXN: 2050.00,
    montoConvertidoUSD: 100.00,
    tipoCambio: 20.50,
    hora: "12:05 a.m."
  },
  {
    id: "dep1",
    fecha: "02 jul",
    tipo: "deposito_usd",
    descripcion: "Depósito USD",
    destinatario: "desde International Client - Wire Transfer",
    monto: 500.00,
    moneda: "USD",
    hora: "3:20 p.m.",
    internacional: true
  },
  {
    id: "rec1",
    fecha: "02 jul",
    tipo: "recibo",
    descripcion: "Recibiste dinero",
    destinatario: "de PRESAS Y MORAS DE LOS VOLCAN...",
    monto: 1000.00,
    moneda: "USD",
    hora: "10:05 a.m."
  }
];

export const MovimientosProvider = ({ children }: { children: ReactNode }) => {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const cargarMovimientos = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/fxepelin/transactions');
      const data = await response.json();
      
      if (data.success) {
        // Asegurar que todos los campos numéricos se parseen correctamente
        const movimientosParseados = data.data.map((movimiento: any) => ({
          ...movimiento,
          monto: Number(movimiento.monto),
          montoRetiradoUSD: movimiento.montoRetiradoUSD ? Number(movimiento.montoRetiradoUSD) : undefined,
          montoRecibidoMXN: movimiento.montoRecibidoMXN ? Number(movimiento.montoRecibidoMXN) : undefined,
          montoConvertidoUSD: movimiento.montoConvertidoUSD ? Number(movimiento.montoConvertidoUSD) : undefined,
          tipoCambio: movimiento.tipoCambio ? Number(movimiento.tipoCambio) : undefined
        }));
        setMovimientos(movimientosParseados);
      } else {
        console.error('Error loading transactions:', data.error);
        // Fallback a datos mock si hay error
        setMovimientos(movimientosIniciales);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      setMovimientos(movimientosIniciales);
    } finally {
      setIsLoading(false);
    }
  };

  const agregarMovimiento = (nuevoMovimiento: Omit<Movimiento, 'id'>) => {
    const movimiento: Movimiento = {
      ...nuevoMovimiento,
      id: Date.now().toString()
    };
    
    setMovimientos(prev => [movimiento, ...prev]);
  };

  // Cargar movimientos al inicializar
  useEffect(() => {
    cargarMovimientos();
  }, []);

  return (
    <MovimientosContext.Provider value={{ movimientos, agregarMovimiento, cargarMovimientos, isLoading }}>
      {children}
    </MovimientosContext.Provider>
  );
};
