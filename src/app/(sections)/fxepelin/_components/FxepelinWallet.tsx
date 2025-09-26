"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/app/(sections)/fxepelin/_components/ui/button";
import { Card, CardContent } from "@/app/(sections)/fxepelin/_components/ui/card";
import { Input } from "@/app/(sections)/fxepelin/_components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/(sections)/fxepelin/_components/ui/dialog";
import { Label } from "@/app/(sections)/fxepelin/_components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/(sections)/fxepelin/_components/ui/select";
import { useMovimientos } from "@/app/(sections)/fxepelin/_contexts/MovimientosContext";
import { useBalances, Currency } from "@/app/(sections)/fxepelin/_contexts/BalancesContext";
import { useToast } from "@/app/(sections)/fxepelin/_hooks/use-toast";
import { jsPDF } from "jspdf";
import { 
  ArrowUpIcon, 
  ArrowDownIcon, 
  ArrowUpRightIcon,
  ArrowDownRightIcon,
  EyeIcon,
  EyeOffIcon,
  DownloadIcon,
  GlobeIcon,
  ArrowRightLeftIcon,
  CalendarIcon,
  ClockIcon,
  SearchIcon,
  RefreshCwIcon,
  CopyIcon,
  CheckIcon,
  PlusIcon,
  XIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from "lucide-react";

export default function FxepelinWallet(): React.JSX.Element {
  const { movimientos, agregarMovimiento } = useMovimientos();
  const { getCurrentBalance, refreshBalances } = useBalances();
  const { toast } = useToast();
  const [montosOcultos, setMontosOcultos] = useState(false);
  
  // Estados para el flujo de retiro
  const [mostrarRetirar, setMostrarRetirar] = useState(false);
  const [montoRetirar, setMontoRetirar] = useState('');
  const [procesandoRetiro, setProcesandoRetiro] = useState(false);
  
  // Estados para el flujo de ingreso/cotización
  const [mostrarCotizacion, setMostrarCotizacion] = useState(false);
  const [montoUSD, setMontoUSD] = useState('');
  const [montoMXN, setMontoMXN] = useState('');
  const [operacionSeleccionada, setOperacionSeleccionada] = useState<'depositar' | 'cobrar' | null>(null);
  const [campoCopiado, setCampoCopiado] = useState<string | null>(null);
  
  // Estados para el flujo de envío
  const [mostrarEnvio, setMostrarEnvio] = useState(false);
  const [pasoEnvio, setPasoEnvio] = useState<'monto' | 'destino' | 'confirmacion' | 'procesando' | 'exito'>('monto');
  const [montoEnvio, setMontoEnvio] = useState('');
  const [busquedaCuentas, setBusquedaCuentas] = useState('');
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState<any>(null);
  const [conceptoEnvio, setConceptoEnvio] = useState('');
  
  const { getExchangeRate, isDisconnected } = useBalances();
  const [tiempoRestante, setTiempoRestante] = useState(30); // Tiempo restante para actualización

  // Función helper para mostrar tipo de cambio o "desconectado"
  const getExchangeRateDisplay = (from: Currency, to: Currency, fallback: number = 18.3): string => {
    if (isDisconnected) {
      return "desconectado";
    }
    const rate = getExchangeRate(from, to);
    return typeof rate === 'number' ? rate.toFixed(2) : fallback.toFixed(2);
  };

  // Función helper para obtener el valor numérico del tipo de cambio (para cálculos)
  const getExchangeRateValue = (from: Currency, to: Currency, fallback: number = 18.3): number => {
    if (isDisconnected) {
      return fallback;
    }
    const rate = getExchangeRate(from, to);
    return typeof rate === 'number' ? rate : fallback;
  };
  
  // Estados para el modal de nueva cuenta
  const [mostrarModalNuevaCuenta, setMostrarModalNuevaCuenta] = useState(false);
  const [nuevaCuenta, setNuevaCuenta] = useState({
    nombre: '',
    numeroCuenta: '',
    banco: '',
    tipoCuenta: '',
    routing: ''
  });

  // Estados para el procesamiento de depósito
  const [procesandoDeposito, setProcesandoDeposito] = useState(false);

  // Estados para paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const movimientosPorPagina = 5;

  // Estados para modal de detalles
  const [movimientoSeleccionado, setMovimientoSeleccionado] = useState<any>(null);
  const [mostrarDetalles, setMostrarDetalles] = useState(false);

  // Estado para el movimiento completo del envío
  const [movimientoCompleto, setMovimientoCompleto] = useState<any>(null);
  
  // Estados para descarga de estado de balances
  const [modalDescargaAbierto, setModalDescargaAbierto] = useState(false);
  const [mesSeleccionado, setMesSeleccionado] = useState('');
  const [balanceSeleccionado, setBalanceSeleccionado] = useState('USD');

  const balanceUSD = getCurrentBalance('USD');
  const balanceMXN = getCurrentBalance('MXN');

  // Cálculos de paginación
  const totalPaginas = Math.ceil(movimientos.length / movimientosPorPagina);
  const movimientosPaginados = movimientos.slice(
    (paginaActual - 1) * movimientosPorPagina,
    paginaActual * movimientosPorPagina
  );

  // Funciones de paginación
  const irAPagina = (pagina: number) => {
    setPaginaActual(Math.max(1, Math.min(pagina, totalPaginas)));
  };

  const paginaAnterior = () => {
    if (paginaActual > 1) {
      setPaginaActual(paginaActual - 1);
    }
  };

  const paginaSiguiente = () => {
    if (paginaActual < totalPaginas) {
      setPaginaActual(paginaActual + 1);
    }
  };

  // Reloj de 30 segundos que cuenta hacia atrás y actualiza precios
  useEffect(() => {
    if (mostrarRetirar || mostrarCotizacion) {
      // Reiniciar el timer cuando se abre cualquier sección
      setTiempoRestante(30);
      
      const interval = setInterval(() => {
        setTiempoRestante((prev) => {
          if (prev <= 1) {
            // Actualizar precios cuando llegue a 0
            refreshBalances().catch(console.error);
            return 30; // Reiniciar a 30
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    } else {
      // Resetear cuando se cierra la sección
      setTiempoRestante(30);
    }
  }, [mostrarRetirar, mostrarCotizacion]);

  // Datos de cuentas
  const cuentaSTP = {
    clabe: '324555846298885211',
    banco: 'STP',
    beneficiario: 'XEPELIN SAPI DE CV',
    terminacion: '5211'
  };
  
  const cuentaUSD = {
    numeroCuenta: '8312146554',
    routing: '084009519',
    swift: 'SILIUSXX',
    banco: 'Silvergate Bank',
    beneficiario: 'XEPELIN SAPI DE CV',
    direccion: '4250 Executive Square, Suite 300, La Jolla, CA 92037'
  };

  // Cuentas agendadas de ejemplo
  const cuentasAgendadas = [
    { id: '1', nombre: 'John Doe', banco: 'Bank of America', numeroCuenta: '****1234', pais: 'USA' },
    { id: '2', nombre: 'María García', banco: 'Santander', numeroCuenta: '****5678', pais: 'México' },
    { id: '3', nombre: 'Carlos López', banco: 'BBVA', numeroCuenta: '****9012', pais: 'México' }
  ];

  const formatAmount = (amount: number, currency: string) => {
    if (montosOcultos) return "••••••";
    return `${amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${currency}`;
  };

  const getTransactionIcon = (tipo: string) => {
    switch (tipo) {
      case 'transferencia_internacional':
        return <GlobeIcon className="w-4 h-4" />;
      case 'retiro':
        return <ArrowUpRightIcon className="w-4 h-4" />;
      case 'fondeo':
        return <ArrowDownIcon className="w-4 h-4" />;
      case 'deposito_usd':
        return <ArrowDownRightIcon className="w-4 h-4" />;
      case 'recibo':
        return <ArrowDownRightIcon className="w-4 h-4" />;
      default:
        return <ArrowUpRightIcon className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (movimiento: any) => {
    if (movimiento.rechazado) {
      return (
        <div className="flex items-center gap-1 text-red-500 text-xs">
          <span className="w-3 h-3 rounded-full bg-red-500 flex items-center justify-center text-white text-[10px]">×</span>
          Rechazado
        </div>
      );
    }
    if (movimiento.enProceso) {
      return (
        <div className="flex items-center gap-1 text-orange-500 text-xs">
          <div className="w-2 h-2 rounded-full bg-orange-500"></div>
          En proceso
        </div>
      );
    }
    return null;
  };

  // Funciones para el flujo de retiro
  const handleRetirar = () => {
    const nuevoEstado = !mostrarRetirar;
    setMostrarRetirar(nuevoEstado);
    setMostrarCotizacion(false);
    setMostrarEnvio(false);
    setMontoRetirar('');
    setProcesandoRetiro(false);
  };

  const handleCambioRetirar = (valor: string) => {
    const valorNum = parseFloat(valor) || 0;
    if (valorNum <= balanceUSD && valorNum >= 0) {
      setMontoRetirar(valor);
    }
  };

  const confirmarRetiro = async () => {
    if (!montoRetirar || parseFloat(montoRetirar) <= 0) return;
    setProcesandoRetiro(true);
    
    setTimeout(async () => {
      const montoUSDRetirado = parseFloat(montoRetirar);
      // Para retirar: usar sell_rate (USD -> MXN)
      const tipoCambioVenta = getExchangeRateValue('USD', 'MXN-SELL', 18.3);
      const montoMXNRecibido = montoUSDRetirado * tipoCambioVenta;
      setProcesandoRetiro(false);
      
      const now = new Date();
      const fecha = now.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
      const hora = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true });

      const movimientoData = {
        fecha,
        tipo: "retiro" as const,
        descripcion: "Retiro de USD",
        destinatario: "a cuenta STP terminación 5211",
        monto: -montoUSDRetirado,
        moneda: "USD" as const,
        hora,
        montoRetiradoUSD: montoUSDRetirado,
        montoRecibidoMXN: montoMXNRecibido,
        tipoCambio: tipoCambioVenta
      };

      // Guardar en la base de datos
      await guardarMovimientoEnBD(movimientoData);
      
      // Restar del balance
      await actualizarBalanceEnBD(montoUSDRetirado, 'USD', 'subtract');

      // Agregar al contexto local
      agregarMovimiento(movimientoData);

      toast({
        title: "✅ Retiro exitoso!",
        description: `Se retiraron $${typeof montoUSDRetirado === 'number' ? montoUSDRetirado.toFixed(2) : 'N/A'} USD. Recibirás $${typeof montoMXNRecibido === 'number' ? montoMXNRecibido.toLocaleString('es-MX', { minimumFractionDigits: 2 }) : 'N/A'} MXN en tu cuenta STP terminación 5211`,
      });
      
      setMontoRetirar('');
      setMostrarRetirar(false);
      refreshBalances().catch(console.error);
    }, 3000);
  };

  // Funciones para el flujo de ingreso/cotización
  const handleIngresar = () => {
    const nuevoEstado = !mostrarCotizacion;
    setMostrarCotizacion(nuevoEstado);
    setMostrarRetirar(false);
    setMostrarEnvio(false);
    setMontoUSD('');
    setMontoMXN('');
    setOperacionSeleccionada(null);
  };

  const handleCambioUSD = (valor: string) => {
    setMontoUSD(valor);
    if (valor && !isNaN(parseFloat(valor)) && !isDisconnected) {
      // Para depositar: usuario ingresa USD, calculamos cuántos MXN necesita
      // Usar USD-MXN-BUY (cuántos MXN se necesitan para comprar 1 USD)
      const tipoCambioCompra = getExchangeRateValue('USD', 'MXN-BUY', 18.4);
      const mxn = (parseFloat(valor) * tipoCambioCompra).toFixed(2);
      setMontoMXN(mxn);
    } else {
      setMontoMXN('');
    }
  };

  const handleCambioMXN = (valor: string) => {
    setMontoMXN(valor);
    if (valor && !isNaN(parseFloat(valor)) && !isDisconnected) {
      // Para depositar: usuario ingresa MXN, calculamos cuántos USD recibirá
      // Usar USD-MXN-BUY (cuántos MXN se necesitan para comprar 1 USD)
      const tipoCambioCompra = getExchangeRateValue('USD', 'MXN-BUY', 18.4);
      const usd = (parseFloat(valor) / tipoCambioCompra).toFixed(2);
      setMontoUSD(usd);
    } else {
      setMontoUSD('');
    }
  };

  // Funciones para el flujo de envío
  const handleEnviar = () => {
    const nuevoEstado = !mostrarEnvio;
    setMostrarEnvio(nuevoEstado);
    setMostrarCotizacion(false);
    setMostrarRetirar(false);
    
    if (nuevoEstado) {
      setPasoEnvio('monto');
      setMontoEnvio('');
      setCuentaSeleccionada(null);
      setConceptoEnvio('');
    }
  };

  const handleSiguientePasoEnvio = () => {
    if (pasoEnvio === 'monto') setPasoEnvio('destino');
    else if (pasoEnvio === 'destino') setPasoEnvio('confirmacion');
  };

  const handlePasoAnteriorEnvio = () => {
    if (pasoEnvio === 'destino') setPasoEnvio('monto');
    else if (pasoEnvio === 'confirmacion') setPasoEnvio('destino');
  };

  const confirmarEnvio = async () => {
    if (!montoEnvio || !cuentaSeleccionada) return;
    
    setPasoEnvio('procesando');
    
    setTimeout(async () => {
      const now = new Date();
      const fecha = now.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
      const hora = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true });

      const movimientoData = {
        fecha,
        tipo: "transferencia_internacional" as const,
        descripcion: "Transferencia Internacional",
        destinatario: `a ${cuentaSeleccionada.nombre} - ${cuentaSeleccionada.banco}`,
        monto: -parseFloat(montoEnvio),
        moneda: "USD" as const,
        hora,
        internacional: true,
        enProceso: true,
        concepto: conceptoEnvio
      };

      // Guardar en la base de datos
      await guardarMovimientoEnBD(movimientoData);
      
      // Restar del balance
      await actualizarBalanceEnBD(parseFloat(montoEnvio), 'USD', 'subtract');

      // Agregar al contexto local
      agregarMovimiento(movimientoData);

      const movimientoCompleto = {
        ...movimientoData
      };

      toast({
        title: "✅ Envío exitoso!",
        description: `Se enviaron $${typeof parseFloat(montoEnvio) === 'number' ? parseFloat(montoEnvio).toFixed(2) : 'N/A'} USD a ${cuentaSeleccionada.nombre}`,
      });
      
      setPasoEnvio('exito');
      
      // Guardar el movimiento completo para poder generar el PDF después
      setMovimientoCompleto(movimientoCompleto);
      refreshBalances().catch(console.error);
    }, 3000);
  };

  // Funciones para el modal de nueva cuenta
  const handleAgregarCuenta = () => {
    if (!nuevaCuenta.nombre || !nuevaCuenta.numeroCuenta || !nuevaCuenta.banco) {
      toast({
        title: "Error",
        description: "Por favor, completa todos los campos requeridos.",
        variant: "destructive",
      });
      return;
    }

    // Agregar la nueva cuenta a la lista (en una app real, esto sería una llamada a la API)
    const cuentaNueva = {
      id: Date.now().toString(),
      nombre: nuevaCuenta.nombre,
      banco: nuevaCuenta.banco,
      numeroCuenta: nuevaCuenta.numeroCuenta,
      pais: 'USA' // Por defecto para cuentas USD
    };

    // Aquí se agregaría la cuenta a la lista de cuentas agendadas
    // Por ahora solo mostramos el toast de confirmación
    toast({
      title: "✅ Cuenta agregada",
      description: `Se agregó la cuenta de ${nuevaCuenta.nombre}`,
    });

    // Limpiar el formulario y cerrar el modal
    setNuevaCuenta({
      nombre: '',
      numeroCuenta: '',
      banco: '',
      tipoCuenta: '',
      routing: ''
    });
    setMostrarModalNuevaCuenta(false);
  };

  // Funciones para detalles de movimiento
  const handleVerDetalles = (movimiento: any) => {
    setMovimientoSeleccionado(movimiento);
    setMostrarDetalles(true);
  };

  const handleCerrarDetalles = () => {
    setMostrarDetalles(false);
    setMovimientoSeleccionado(null);
  };

  // Función para generar opciones de meses
  const generarOpcionesMeses = () => {
    const opciones = [];
    const ahora = new Date();
    
    for (let i = 0; i < 12; i++) {
      const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      const mes = fecha.getMonth() + 1;
      const año = fecha.getFullYear();
      const nombreMes = fecha.toLocaleDateString('es-ES', { month: 'long' });
      
      opciones.push({
        valor: `${mes}-${año}`,
        etiqueta: `${nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)} ${año}`
      });
    }
    
    return opciones;
  };

  const opcionesMeses = generarOpcionesMeses();

  // Función para descargar estado de balances
  const handleDescargarEstado = async () => {
    if (!mesSeleccionado) {
      toast({
        title: "Error",
        description: "Por favor selecciona un mes y año",
        variant: "destructive",
      });
      return;
    }
    
    const opcionSeleccionada = opcionesMeses.find(op => op.valor === mesSeleccionado);
    if (!opcionSeleccionada) return;
    
    // Obtener movimientos para el período seleccionado
    const partes = mesSeleccionado.split('-');
    const mesNum = parseInt(partes[0] || '0');
    const anioNum = parseInt(partes[1] || '0');
    const inicioMes = new Date(anioNum, mesNum - 1, 1);
    const finMes = new Date(anioNum, mesNum, 0);
    
    const movimientosPeriodo = movimientos.filter(mov => {
      const fechaMov = new Date(mov.fecha);
      return fechaMov >= inicioMes && fechaMov <= finMes;
    }).filter(mov => mov.moneda === 'USD');
    
    // Calcular saldos reales basados en el balance actual y movimientos
    const balanceActual = getCurrentBalance('USD');
    
    // Obtener todos los movimientos para calcular correctamente
    const todosMovimientos = movimientos
      .filter(mov => mov.moneda === 'USD')
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
    
    // Calcular saldo inicial robusto usando balance actual y movimientos posteriores
    let saldoInicial = balanceActual;
    
    // Deshacer movimientos posteriores al período para obtener saldo al final del período
    for (const mov of todosMovimientos) {
      const fechaMov = new Date(mov.fecha);
      if (fechaMov > finMes) {
        if (mov.tipo === 'deposito_usd' || mov.tipo === 'fondeo') {
          saldoInicial -= mov.monto;
        } else if (mov.tipo === 'transferencia_internacional' || mov.tipo === 'retiro') {
          saldoInicial += mov.monto;
        }
      }
    }
    
    const saldoFinalCalculado = saldoInicial;
    
    // Ahora deshacer movimientos del período para obtener saldo inicial
    for (let i = movimientosPeriodo.length - 1; i >= 0; i--) {
      const mov = movimientosPeriodo[i];
      if (mov.tipo === 'deposito_usd' || mov.tipo === 'fondeo') {
        saldoInicial -= mov.monto;
      } else if (mov.tipo === 'transferencia_internacional' || mov.tipo === 'retiro') {
        saldoInicial += mov.monto;
      }
    }
    
    // Ordenar movimientos del período por fecha
    const movimientosOrdenados = movimientosPeriodo.sort((a, b) => 
      new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    );
    
    // Calcular movimientos del período con saldo corriente
    const movimientosConSaldo: (typeof movimientosPeriodo[0] & { saldoResultante: number })[] = [];
    let saldoAcumulado = saldoInicial;
    
    for (const mov of movimientosOrdenados) {
      if (mov.tipo === 'deposito_usd' || mov.tipo === 'fondeo') {
        saldoAcumulado += mov.monto;
      } else if (mov.tipo === 'transferencia_internacional' || mov.tipo === 'retiro') {
        saldoAcumulado -= mov.monto;
      }
      movimientosConSaldo.push({ ...mov, saldoResultante: saldoAcumulado });
    }
    
    // Calcular totales del período
    const totalAbonos = movimientosPeriodo
      .filter(m => m.tipo === 'deposito_usd' || m.tipo === 'fondeo')
      .reduce((sum, m) => sum + m.monto, 0);
    
    const totalRetiros = movimientosPeriodo
      .filter(m => m.tipo === 'transferencia_internacional' || m.tipo === 'retiro')
      .reduce((sum, m) => sum + m.monto, 0);
    
    const saldoFinalPeriodo = saldoFinalCalculado;
    
    // Calcular saldo promedio diario correcto
    const diasEnMes = new Date(anioNum, mesNum, 0).getDate();
    let saldoPromedioPeriodo = saldoInicial;
    
    if (movimientosConSaldo.length > 0) {
      let sumaSaldosDiarios = 0;
      let saldoDelDia = saldoInicial;
      
      for (let dia = 1; dia <= diasEnMes; dia++) {
        const fechaDia = new Date(anioNum, mesNum - 1, dia);
        
        // Aplicar movimientos de este día
        for (const mov of movimientosConSaldo) {
          const fechaMov = new Date(mov.fecha);
          if (fechaMov.toDateString() === fechaDia.toDateString()) {
            saldoDelDia = mov.saldoResultante;
          }
        }
        
        sumaSaldosDiarios += saldoDelDia;
      }
      
      saldoPromedioPeriodo = sumaSaldosDiarios / diasEnMes;
    }
    
    // Generar PDF del estado de balances estilo profesional
    const doc = new jsPDF();
    
    // Configurar colores
    const primaryColor = [85, 94, 238]; // #555EEE
    const textColor = [51, 51, 51];
    const lightGray = [128, 128, 128];
    const darkGray = [64, 64, 64];
    const borderColor = [200, 200, 200];
    
    let currentY = 20;
    
    // Header principal estilo banco profesional
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Fechas del período en la esquina superior derecha
    const diasEnPeriodo = new Date(anioNum, mesNum, 0).getDate();
    const fechaInicioFormato = `${opcionSeleccionada?.etiqueta.split(' ')[0]} 01, ${anioNum}`;
    const fechaFinFormato = `${opcionSeleccionada?.etiqueta.split(' ')[0]} ${diasEnPeriodo}, ${anioNum}`;
    doc.text(`${fechaInicioFormato} hasta ${fechaFinFormato}`, 200, currentY, { align: 'right' });
    
    // Logo de Xepelin (texto por ahora)
    doc.setFontSize(16);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('xepelin', 20, currentY);
    
    currentY += 15;
    
    // Título del documento
    doc.setFontSize(14);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text('Estado de Cuenta', 20, currentY);
    
    currentY += 10;
    
    // Información del período
    doc.setFontSize(10);
    doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.text(`Período: ${fechaInicioFormato} - ${fechaFinFormato}`, 20, currentY);
    doc.text(`Moneda: ${balanceSeleccionado}`, 20, currentY + 5);
    
    currentY += 20;
    
    // Resumen de saldos
    doc.setFontSize(12);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text('Resumen de Saldos', 20, currentY);
    
    currentY += 10;
    
    // Tabla de resumen
    const addRow = (label: string, value: string, isBold = false) => {
      doc.setFontSize(10);
      if (isBold) {
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setFont('helvetica', 'normal');
      }
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.text(label, 20, currentY);
      doc.text(value, 150, currentY, { align: 'right' });
      currentY += 6;
    };
    
    addRow('Saldo Inicial:', `$${saldoInicial.toFixed(2)} ${balanceSeleccionado}`);
    addRow('Total Abonos:', `$${totalAbonos.toFixed(2)} ${balanceSeleccionado}`);
    addRow('Total Retiros:', `$${totalRetiros.toFixed(2)} ${balanceSeleccionado}`);
    addRow('Saldo Final:', `$${saldoFinalPeriodo.toFixed(2)} ${balanceSeleccionado}`, true);
    addRow('Saldo Promedio:', `$${saldoPromedioPeriodo.toFixed(2)} ${balanceSeleccionado}`);
    
    currentY += 15;
    
    // Detalle de movimientos
    doc.setFontSize(12);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text('Detalle de Movimientos', 20, currentY);
    
    currentY += 10;
    
    // Header de tabla
    doc.setFontSize(8);
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.setFont('helvetica', 'bold');
    
    // Dibujar línea superior
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.line(20, currentY - 2, 190, currentY - 2);
    
    doc.text('Fecha', 20, currentY);
    doc.text('Descripción', 50, currentY);
    doc.text('Abono', 120, currentY);
    doc.text('Retiro', 150, currentY);
    doc.text('Saldo', 170, currentY);
    
    currentY += 5;
    
    // Dibujar línea debajo del header
    doc.line(20, currentY - 2, 190, currentY - 2);
    
    // Movimientos
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    
    for (const mov of movimientosConSaldo) {
      const fecha = new Date(mov.fecha).toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit', 
        year: '2-digit' 
      });
      
      let descripcion = '';
      if (mov.tipo === 'deposito_usd') descripcion = 'Depósito USD';
      else if (mov.tipo === 'fondeo') descripcion = 'Fondeo desde STP';
      else if (mov.tipo === 'transferencia_internacional') descripcion = 'Transferencia Internacional';
      else if (mov.tipo === 'retiro') descripcion = 'Retiro USD';
      
      const abono = (mov.tipo === 'deposito_usd' || mov.tipo === 'fondeo') ? mov.monto : 0;
      const retiro = (mov.tipo === 'transferencia_internacional' || mov.tipo === 'retiro') ? mov.monto : 0;
      
      doc.text(fecha, 20, currentY);
      doc.text(descripcion, 50, currentY);
      doc.text(abono > 0 ? `$${abono.toFixed(2)}` : '', 120, currentY, { align: 'right' });
      doc.text(retiro > 0 ? `$${retiro.toFixed(2)}` : '', 150, currentY, { align: 'right' });
      doc.text(`$${mov.saldoResultante.toFixed(2)}`, 170, currentY, { align: 'right' });
      
      currentY += 5;
      
      // Nueva página si es necesario
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }
    }
    
    // Dibujar línea final
    doc.line(20, currentY - 2, 190, currentY - 2);
    
    // Footer
    const pageHeight = doc.internal.pageSize.height;
    currentY = pageHeight - 30;
    
    doc.setFontSize(7);
    doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.text('XPN Tech, S.A. de C.V., Sociedad Financiera Popular', 20, currentY);
    doc.text('Ciudad de México, México. +52 55 5351 8313', 20, currentY + 5);
    doc.text('Para dudas y aclaraciones: CONDUSEF 01 800 999 80 80', 20, currentY + 10);
    
    // Guardar PDF
    doc.save(`estado-balances-${balanceSeleccionado.toLowerCase()}-${opcionSeleccionada?.etiqueta.replace(/\s+/g, '-').toLowerCase()}.pdf`);
    
    setModalDescargaAbierto(false);
    
    toast({
      title: "Éxito",
      description: "Estado de balances descargado correctamente",
    });
  };

  const handleCerrarModalDescarga = () => {
    setModalDescargaAbierto(false);
    setBalanceSeleccionado('USD');
    setMesSeleccionado('');
  };

  // Funciones para sincronizar con la base de datos
  const guardarMovimientoEnBD = async (movimiento: any) => {
    try {
      const response = await fetch('/api/fxepelin/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...movimiento,
          userId: 1, // Por ahora hardcodeado, en producción vendría del contexto de autenticación
        }),
      });

      if (!response.ok) {
        throw new Error('Error al guardar el movimiento');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al guardar movimiento:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el movimiento en la base de datos",
        variant: "destructive",
      });
    }
  };

  const actualizarBalanceEnBD = async (monto: number, moneda: string, operacion: 'add' | 'subtract' | 'set' = 'set') => {
    try {
      const response = await fetch('/api/fxepelin/balances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 1, // Por ahora hardcodeado
          currency: moneda,
          amount: monto,
          operation: operacion,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el balance');
      }

      return await response.json();
    } catch (error) {
      console.error('Error al actualizar balance:', error);
    }
  };

  // Función para generar PDF del comprobante
  const generarComprobantePDF = (movimiento: any) => {
    const doc = new jsPDF();
    
    // Configurar fuentes y colores
    const primaryColor = [85, 94, 238]; // #555EEE
    const textColor = [51, 51, 51];
    const lightGray = [128, 128, 128];
    
    // Header con logo y título Xepelin
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 25, 'F');
    
    // Título del comprobante
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('xepelin', 20, 17);
    
    // Título del comprobante
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'normal');
    doc.text('Comprobante de transferencia', 20, 45);
    
    // Monto principal
    const montoFormateado = Math.abs(movimiento.monto).toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(`$${montoFormateado} ${movimiento.moneda}`, 20, 65);
    
    // Información principal en dos columnas
    let y = 85;
    const leftCol = 20;
    const rightCol = 120;
    
    // Función para agregar fila de información
    const addRow = (label: string, value: string, isLeft = true) => {
      const x = isLeft ? leftCol : rightCol;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.text(label, x, y);
      
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFontSize(10);
      doc.text(value, x, y + 5);
      
      if (!isLeft) y += 15;
    };
    
    // Generar datos específicos según el tipo
    const numeroReferencia = `TR${Date.now().toString().slice(-6)}`;
    const fechaCompleta = new Date().toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }) + ` • ${movimiento.hora}`;
    
    // Información básica
    addRow('Tipo de operación', movimiento.descripcion, true);
    addRow('Fecha', fechaCompleta, false);
    
    addRow('Número de referencia', numeroReferencia, true);
    addRow('Estado', movimiento.enProceso ? 'En proceso' : 'Completada', false);
    
    // Información específica según el tipo
    if (movimiento.tipo === 'retiro') {
      addRow('USD retirado', `$${typeof movimiento.montoRetiradoUSD === 'number' ? movimiento.montoRetiradoUSD.toFixed(2) : 'N/A'}`, true);
      addRow('MXN recibido', `$${movimiento.montoRecibidoMXN?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, false);
      
      addRow('Destino', movimiento.destinatario, true);
        addRow('Tipo de cambio', `$${typeof movimiento.tipoCambio === 'number' ? movimiento.tipoCambio.toFixed(2) : 'N/A'}`, false);
    } else if (movimiento.tipo === 'fondeo') {
      addRow('MXN recibido', `$${movimiento.montoRecibidoMXN?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, true);
      addRow('USD convertido', `$${typeof movimiento.montoConvertidoUSD === 'number' ? movimiento.montoConvertidoUSD.toFixed(2) : 'N/A'}`, false);
      
      addRow('Origen', movimiento.destinatario, true);
        addRow('Tipo de cambio', `$${typeof movimiento.tipoCambio === 'number' ? movimiento.tipoCambio.toFixed(2) : 'N/A'}`, false);
    } else if (movimiento.tipo === 'transferencia_internacional') {
      addRow('Destinatario', movimiento.destinatario, true);
      addRow('Concepto', movimiento.concepto || 'Transferencia internacional', false);
      
      addRow('Tipo', 'Transferencia Internacional', true);
      addRow('Moneda', movimiento.moneda, false);
    } else if (movimiento.tipo === 'deposito_usd' || movimiento.tipo === 'recibo') {
      addRow('Origen', movimiento.destinatario, true);
      addRow('Tipo', movimiento.descripcion, false);
    }
    
    // Footer con información de la operadora
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.text(
      'Operadora Falcon, S.A.P.I. de C.V., SOFOM, E.N.R. Campos Elíseos No. 403, Int. Piso 7, Polanco, Polanco II Secc, Miguel Hidalgo, C.P. 11530',
      20,
      pageHeight - 20
    );
    doc.text('Ciudad de México, México. +52 55 5351 8313.', 20, pageHeight - 15);
    
    // Guardar el PDF
    const fileName = `comprobante-${movimiento.tipo}-${numeroReferencia}.pdf`;
    doc.save(fileName);
    
    toast({
      title: "✅ Comprobante descargado",
      description: `Se descargó el comprobante: ${fileName}`,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Transferencias Internacionales</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel izquierdo - Balances */}
          <div className="lg:col-span-1">
            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Balances disponibles</h2>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setMontosOcultos(!montosOcultos)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      {montosOcultos ? <EyeOffIcon className="w-4 h-4 text-gray-400" /> : <EyeIcon className="w-4 h-4 text-gray-400" />}
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <CalendarIcon className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* Balance USD */}
                <div className="mb-6">
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {formatAmount(balanceUSD, 'USD')}
                  </div>
                  <div className="text-sm text-gray-500">Saldo disponible</div>
                </div>

                {/* Botones de acción - Alineados horizontalmente */}
                <div className="grid grid-cols-3 gap-2 mb-6">
                  <Button 
                    variant={mostrarRetirar ? "default" : "outline"}
                    className={`justify-center gap-1 h-10 text-xs ${
                      mostrarRetirar 
                        ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={handleRetirar}
                  >
                    <ArrowRightLeftIcon className="w-3 h-3" />
                    Retirar
                  </Button>
                  
                  <Button 
                    variant={mostrarCotizacion ? "default" : "outline"}
                    className={`justify-center gap-1 h-10 text-xs ${
                      mostrarCotizacion 
                        ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={handleIngresar}
                  >
                    <ArrowDownIcon className="w-3 h-3" />
                    Ingresar
                  </Button>
                  
                  <Button 
                    variant={mostrarEnvio ? "default" : "outline"}
                    className={`justify-center gap-1 h-10 text-xs ${
                      mostrarEnvio 
                        ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={handleEnviar}
                  >
                    <ArrowUpIcon className="w-3 h-3" />
                    Enviar
                  </Button>
                </div>

                {/* Formulario de Retiro */}
                {mostrarRetirar && (
                  <div className="space-y-4">
                     <div className="flex items-center justify-between">
                       <h3 className="text-lg font-semibold text-gray-900">Retirar USD a MXN</h3>
                       <div className="flex items-center gap-4">
                         <div className="text-right">
                           <div className="text-sm font-medium text-gray-900">
                             1 USD = ${getExchangeRateDisplay('USD', 'MXN-SELL')} MXN
                           </div>
                           <div className="text-xs text-gray-500 mt-1">
                             Para retirar (USD → MXN)
                           </div>
                           {isDisconnected && (
                             <div className="text-xs text-red-500 mt-1">
                               ⚠️ API desconectada
                             </div>
                           )}
                         </div>
                        <div className="relative w-8 h-8">
                          <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 36 36">
                            {/* Círculo de fondo */}
                            <path
                              className="text-gray-200"
                              stroke="currentColor"
                              strokeWidth="3"
                              fill="none"
                              d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            {/* Círculo de progreso */}
                            <path
                              className="text-purple-600"
                              stroke="currentColor"
                              strokeWidth="3"
                              fill="none"
                              strokeLinecap="round"
                              strokeDasharray={`${(tiempoRestante / 30) * 100}, 100`}
                              d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                          </svg>
                          {/* Número en el centro */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-bold text-gray-700">
                              {tiempoRestante}
                            </span>
                          </div>
                        </div>
                       </div>
                     </div>

                    {!procesandoRetiro ? (
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Cantidad a retirar (USD)
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 sm:text-sm">$</span>
                            </div>
                            <Input
                              type="number"
                              value={montoRetirar}
                              onChange={(e) => handleCambioRetirar(e.target.value)}
                              placeholder="0.00"
                              max={balanceUSD}
                              className="pl-7 pr-12"
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 sm:text-sm">USD</span>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Máximo disponible: ${typeof balanceUSD === 'number' ? balanceUSD.toFixed(2) : 'N/A'} USD
                          </div>
                        </div>

                         {montoRetirar && parseFloat(montoRetirar) > 0 && (
                           <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                             <div className="text-sm text-green-700 mb-2">Recibirás:</div>
                             <div className="text-2xl font-bold text-green-800">
                               ${isDisconnected ? "desconectado" : (parseFloat(montoRetirar) * getExchangeRateValue('USD', 'MXN-SELL', 18.3)).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                             </div>
                             <div className="text-sm text-green-600 mt-1">
                               En tu cuenta STP terminación 5211
                             </div>
                           </div>
                         )}

                        <Button
                          onClick={confirmarRetiro}
                          disabled={!montoRetirar || parseFloat(montoRetirar) <= 0 || parseFloat(montoRetirar) > balanceUSD || isDisconnected}
                          className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                        >
                          {isDisconnected ? "API Desconectada" : "Confirmar Retiro"}
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="inline-flex items-center gap-2 text-orange-600">
                          <ClockIcon className="w-5 h-5 animate-spin" />
                          <span className="font-medium">Procesando retiro...</span>
                        </div>
                        <div className="text-sm text-gray-500 mt-2">
                          Convirtiendo ${montoRetirar} USD a MXN
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Pantalla de Procesamiento de Depósito */}
                {procesandoDeposito && (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center gap-2 text-orange-600 mb-4">
                      <ClockIcon className="w-6 h-6 animate-spin" />
                      <span className="text-lg font-medium">Procesando envío...</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Enviando ${montoUSD} USD a tu cuenta
                    </div>
                  </div>
                )}

                {/* Formulario de Ingreso/Cotización */}
                {mostrarCotizacion && !procesandoDeposito && (
                  <div className="space-y-4">
                     <div className="flex items-center justify-between">
                       <h3 className="text-lg font-semibold text-gray-900">USD ↔ MXN</h3>
                       <div className="flex items-center gap-4">
                         <div className="text-right">
                           <div className="text-sm font-medium text-gray-900">
                             1 USD = ${getExchangeRateDisplay('USD', 'MXN-BUY')} MXN
                           </div>
                           <div className="text-xs text-gray-500 mt-1">
                             Para depositar (MXN → USD)
                           </div>
                           {isDisconnected && (
                             <div className="text-xs text-red-500 mt-1">
                               ⚠️ API desconectada
                             </div>
                           )}
                         </div>
                        <div className="relative w-8 h-8">
                          <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 36 36">
                            {/* Círculo de fondo */}
                            <path
                              className="text-gray-200"
                              stroke="currentColor"
                              strokeWidth="3"
                              fill="transparent"
                              strokeDasharray="100"
                              strokeDashoffset="0"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            {/* Círculo de progreso */}
                            <path
                              className="text-blue-500"
                              stroke="currentColor"
                              strokeWidth="3"
                              fill="transparent"
                              strokeDasharray="100"
                              strokeDashoffset={100 - (tiempoRestante / 30) * 100}
                              strokeLinecap="round"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              style={{
                                transition: 'stroke-dashoffset 1s ease-in-out'
                              }}
                            />
                          </svg>
                          {/* Número en el centro */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-bold text-gray-700 font-tabular" style={{fontSize: '10px'}}>{tiempoRestante}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Botones de operación */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        onClick={() => setOperacionSeleccionada('depositar')}
                        variant={operacionSeleccionada === 'depositar' ? 'default' : 'outline'}
                        className={operacionSeleccionada === 'depositar' ? 'bg-purple-600 hover:bg-purple-700' : 'border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white'}
                      >
                        Depositar
                      </Button>
                      <Button 
                        onClick={() => setOperacionSeleccionada('cobrar')}
                        variant={operacionSeleccionada === 'cobrar' ? 'default' : 'outline'}
                        className={operacionSeleccionada === 'cobrar' ? 'bg-purple-600 hover:bg-purple-700' : 'border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white'}
                      >
                        Cobrar
                      </Button>
                    </div>

                    {/* Contenido según operación seleccionada */}
                    {operacionSeleccionada === 'depositar' && (
                      <div className="space-y-4 pt-2">
                        <h4 className="font-medium text-gray-900">Depositar USD (fondear en MXN)</h4>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">Cantidad en USD</label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-sm">$</span>
                              </div>
                              <Input
                                type="number"
                                value={montoUSD}
                                onChange={(e) => handleCambioUSD(e.target.value)}
                                placeholder="0.00"
                                className="pl-7 pr-12"
                              />
                              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-sm">USD</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-center">
                            <ArrowRightLeftIcon className="w-4 h-4 text-gray-400 rotate-90" />
                          </div>

                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">Tienes que transferir:</label>
                            <div className="p-3 bg-gray-50 rounded-lg border">
                              <div className="text-lg font-semibold text-gray-900">
                                ${montoMXN ? parseFloat(montoMXN).toLocaleString('es-MX', { minimumFractionDigits: 2 }) : '0.00'} MXN
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Datos de cuenta STP */}
                        {montoMXN && parseFloat(montoMXN) > 0 && (
                          <div className="space-y-3 pt-2">
                            <h5 className="font-medium text-gray-900">Transfiere a esta cuenta STP:</h5>
                            
                            <div className="space-y-2">
                              <div className="flex justify-between items-center p-3 bg-gray-50 rounded border">
                                <div>
                                  <span className="text-sm text-gray-600">CLABE:</span>
                                  <div className="font-mono font-semibold">{cuentaSTP.clabe}</div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    navigator.clipboard.writeText(cuentaSTP.clabe);
                                    setCampoCopiado('clabe-stp');
                                    setTimeout(() => setCampoCopiado(null), 2000);
                                    toast({
                                      title: "Copiado",
                                      description: "CLABE copiado al portapapeles",
                                    });
                                  }}
                                >
                                  {campoCopiado === 'clabe-stp' ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                                </Button>
                              </div>

                              <div className="flex justify-between items-center p-3 bg-gray-50 rounded border">
                                <div>
                                  <span className="text-sm text-gray-600">Beneficiario:</span>
                                  <div className="font-semibold">{cuentaSTP.beneficiario}</div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    navigator.clipboard.writeText(cuentaSTP.beneficiario);
                                    setCampoCopiado('beneficiario-stp');
                                    setTimeout(() => setCampoCopiado(null), 2000);
                                    toast({
                                      title: "Copiado",
                                      description: "Beneficiario copiado al portapapeles",
                                    });
                                  }}
                                >
                                  {campoCopiado === 'beneficiario-stp' ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                                </Button>
                              </div>

                              <div className="flex justify-between items-center p-3 bg-gray-50 rounded border">
                                <div>
                                  <span className="text-sm text-gray-600">Banco:</span>
                                  <div className="font-semibold">{cuentaSTP.banco}</div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    navigator.clipboard.writeText(cuentaSTP.banco);
                                    setCampoCopiado('banco-stp');
                                    setTimeout(() => setCampoCopiado(null), 2000);
                                    toast({
                                      title: "Copiado",
                                      description: "Banco copiado al portapapeles",
                                    });
                                  }}
                                >
                                  {campoCopiado === 'banco-stp' ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                                </Button>
                              </div>
                            </div>

                            {/* Botón "Ya transferí" */}
                            <div className="pt-4 border-t">
                              <Button
                                 onClick={async () => {
                                   setProcesandoDeposito(true);
                                   
                                   // Simular procesamiento por 3 segundos
                                   setTimeout(async () => {
                                     const montoMXNRecibido = parseFloat(montoMXN);
                                     const tipoCambioUsado = getExchangeRateValue('USD', 'MXN-BUY', 18.4);
                                     // Calcular USD reales basado en MXN recibidos y tipo de cambio
                                     const montoUSDConvertido = montoMXNRecibido / tipoCambioUsado;
                                     
                                     const now = new Date();
                                     const fecha = now.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
                                     const hora = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true });

                                     const movimientoData = {
                                       fecha,
                                       tipo: "fondeo" as const,
                                       descripcion: "Fondeo desde STP",
                                       destinatario: "desde cuenta STP",
                                       monto: montoUSDConvertido,
                                       moneda: "USD" as const,
                                       hora,
                                       montoRecibidoMXN: montoMXNRecibido,
                                       montoConvertidoUSD: montoUSDConvertido,
                                       tipoCambio: tipoCambioUsado
                                     };

                                     // Guardar en la base de datos
                                     await guardarMovimientoEnBD(movimientoData);
                                     
                                     // Actualizar balance sumando solo el monto convertido
                                     await actualizarBalanceEnBD(montoUSDConvertido, 'USD', 'add');

                                     // Agregar al contexto local
                                     agregarMovimiento(movimientoData);

                                     setMontoUSD('');
                                     setMontoMXN('');
                                     setProcesandoDeposito(false);
                                     setMostrarCotizacion(false);
                                     setOperacionSeleccionada(null);
                                     
                                     // Refrescar balances después de actualizar la base de datos
                                     await refreshBalances();
                                     
                                     toast({
                                       title: "✅ Fondeo registrado",
                                       description: `Se recibieron $${typeof montoMXNRecibido === 'number' ? montoMXNRecibido.toLocaleString('es-MX', { minimumFractionDigits: 2 }) : 'N/A'} MXN y se convirtieron a $${typeof montoUSDConvertido === 'number' ? montoUSDConvertido.toFixed(2) : 'N/A'} USD`,
                                     });
                                   }, 3000);
                                 }}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                              >
                                Ya transferí
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {operacionSeleccionada === 'cobrar' && (
                      <div className="space-y-4 pt-2">
                        <h4 className="font-medium text-gray-900">Cobrar USD</h4>
                        <p className="text-sm text-gray-600">Comparte estos datos para recibir USD en tu cuenta:</p>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded border">
                            <div>
                              <span className="text-sm text-gray-600">Número de cuenta:</span>
                              <div className="font-mono font-semibold">{cuentaUSD.numeroCuenta}</div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(cuentaUSD.numeroCuenta);
                                setCampoCopiado('cuenta-usd');
                                setTimeout(() => setCampoCopiado(null), 2000);
                                toast({
                                  title: "Copiado",
                                  description: "Número de cuenta copiado al portapapeles",
                                });
                              }}
                            >
                              {campoCopiado === 'cuenta-usd' ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                            </Button>
                          </div>

                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded border">
                            <div>
                              <span className="text-sm text-gray-600">Routing Number:</span>
                              <div className="font-mono font-semibold">{cuentaUSD.routing}</div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(cuentaUSD.routing);
                                setCampoCopiado('routing-usd');
                                setTimeout(() => setCampoCopiado(null), 2000);
                                toast({
                                  title: "Copiado",
                                  description: "Routing Number copiado al portapapeles",
                                });
                              }}
                            >
                              {campoCopiado === 'routing-usd' ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                            </Button>
                          </div>

                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded border">
                            <div>
                              <span className="text-sm text-gray-600">SWIFT/BIC:</span>
                              <div className="font-mono font-semibold">{cuentaUSD.swift}</div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(cuentaUSD.swift);
                                setCampoCopiado('swift-usd');
                                setTimeout(() => setCampoCopiado(null), 2000);
                                toast({
                                  title: "Copiado",
                                  description: "SWIFT/BIC copiado al portapapeles",
                                });
                              }}
                            >
                              {campoCopiado === 'swift-usd' ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                            </Button>
                          </div>

                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded border">
                            <div>
                              <span className="text-sm text-gray-600">Beneficiario:</span>
                              <div className="font-semibold">{cuentaUSD.beneficiario}</div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(cuentaUSD.beneficiario);
                                setCampoCopiado('beneficiario-usd');
                                setTimeout(() => setCampoCopiado(null), 2000);
                                toast({
                                  title: "Copiado",
                                  description: "Beneficiario copiado al portapapeles",
                                });
                              }}
                            >
                              {campoCopiado === 'beneficiario-usd' ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                            </Button>
                          </div>

                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded border">
                            <div>
                              <span className="text-sm text-gray-600">Banco y dirección:</span>
                              <div className="font-semibold">{cuentaUSD.banco}</div>
                              <div className="text-sm text-gray-500">{cuentaUSD.direccion}</div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(`${cuentaUSD.banco}, ${cuentaUSD.direccion}`);
                                setCampoCopiado('banco-usd');
                                setTimeout(() => setCampoCopiado(null), 2000);
                                toast({
                                  title: "Copiado",
                                  description: "Información del banco copiada al portapapeles",
                                });
                              }}
                            >
                              {campoCopiado === 'banco-usd' ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>

                        {/* Botón de confirmación para simular recepción de USD */}
                        <div className="pt-4 border-t">
                           <Button
                             onClick={async () => {
                               const now = new Date();
                               const fecha = now.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
                               const hora = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true });

                               // Simular recepción de USD (monto aleatorio para demo)
                               const montoRecibido = Math.floor(Math.random() * 1000) + 100; // Entre $100 y $1100 USD

                               const movimientoData = {
                                 fecha,
                                 tipo: "deposito_usd" as const,
                                 descripcion: "Depósito USD",
                                 destinatario: "desde International Client - Wire Transfer",
                                 monto: montoRecibido,
                                 moneda: "USD" as const,
                                 hora,
                                 internacional: true
                               };

                               // Guardar en la base de datos
                               await guardarMovimientoEnBD(movimientoData);
                               
                               // Sumar al balance
                               await actualizarBalanceEnBD(montoRecibido, 'USD', 'add');

                               // Agregar al contexto local
                               agregarMovimiento(movimientoData);

                               toast({
                                 title: "✅ Depósito recibido",
                                 description: `Se recibieron $${typeof montoRecibido === 'number' ? montoRecibido.toFixed(2) : 'N/A'} USD en tu cuenta`,
                               });

                               // Refrescar balances después de actualizar la base de datos
                               await refreshBalances();
                             }}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            Simular recepción de USD
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Formulario de Envío */}
                {mostrarEnvio && (
                  <div className="space-y-4">
                    {pasoEnvio === 'monto' && (
                      <>
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900">Enviar USD</h3>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">
                            ¿Cuánto quieres enviar?
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 sm:text-sm">$</span>
                            </div>
                            <Input
                              type="number"
                              value={montoEnvio}
                              onChange={(e) => {
                                const valor = parseFloat(e.target.value) || 0;
                                if (valor <= balanceUSD && valor >= 0) {
                                  setMontoEnvio(e.target.value);
                                }
                              }}
                              placeholder="0.00"
                              max={balanceUSD}
                              className="pl-7 pr-12"
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 sm:text-sm">USD</span>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Máximo disponible: ${typeof balanceUSD === 'number' ? balanceUSD.toFixed(2) : 'N/A'} USD
                          </div>
                        </div>

                        <Button
                          onClick={handleSiguientePasoEnvio}
                          disabled={!montoEnvio || parseFloat(montoEnvio) <= 0 || parseFloat(montoEnvio) > balanceUSD}
                          className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                        >
                          Continuar
                        </Button>
                      </>
                    )}

                    {pasoEnvio === 'destino' && (
                      <>
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900">¿A quién quieres transferirle?</h3>
                          <Button
                            onClick={handlePasoAnteriorEnvio}
                            variant="ghost"
                            size="sm"
                          >
                            ← Atrás
                          </Button>
                        </div>

                        <div className="relative">
                          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            type="text"
                            placeholder="Buscar cuenta o beneficiario..."
                            value={busquedaCuentas}
                            onChange={(e) => setBusquedaCuentas(e.target.value)}
                            className="pl-10"
                          />
                        </div>

                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {cuentasAgendadas
                            .filter(cuenta => 
                              cuenta.nombre.toLowerCase().includes(busquedaCuentas.toLowerCase()) ||
                              cuenta.banco.toLowerCase().includes(busquedaCuentas.toLowerCase())
                            )
                            .map((cuenta) => (
                              <div
                                key={cuenta.id}
                                onClick={() => setCuentaSeleccionada(cuenta)}
                                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                  cuentaSeleccionada?.id === cuenta.id
                                    ? 'border-purple-600 bg-purple-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <div className="font-medium text-gray-900">{cuenta.nombre}</div>
                                <div className="text-sm text-gray-500">{cuenta.banco} • {cuenta.numeroCuenta}</div>
                                <div className="text-xs text-gray-400">{cuenta.pais}</div>
                              </div>
                            ))}
                        </div>

                        {/* Agregar nueva cuenta */}
                        <Button
                          onClick={() => setMostrarModalNuevaCuenta(true)}
                          variant="outline"
                          className="w-full border-dashed border-purple-600 text-purple-600 hover:bg-purple-600/10"
                        >
                          <PlusIcon className="w-4 h-4 mr-2" />
                          Agregar nueva cuenta
                        </Button>

                        {cuentaSeleccionada && (
                          <Button
                            onClick={handleSiguientePasoEnvio}
                            className="w-full bg-purple-600 hover:bg-purple-700"
                          >
                            Continuar
                          </Button>
                        )}
                      </>
                    )}

                    {pasoEnvio === 'confirmacion' && (
                      <>
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900">Confirmar envío</h3>
                          <Button
                            onClick={handlePasoAnteriorEnvio}
                            variant="ghost"
                            size="sm"
                          >
                            ← Atrás
                          </Button>
                        </div>

                        <div className="space-y-4">
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="text-sm text-gray-600">Enviarás</div>
                            <div className="text-2xl font-bold text-gray-900">${typeof parseFloat(montoEnvio) === 'number' ? parseFloat(montoEnvio).toFixed(2) : 'N/A'} USD</div>
                          </div>

                          <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="text-sm text-gray-600">A</div>
                            <div className="font-medium text-gray-900">{cuentaSeleccionada?.nombre}</div>
                            <div className="text-sm text-gray-500">{cuentaSeleccionada?.banco} • {cuentaSeleccionada?.numeroCuenta}</div>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">Concepto (opcional)</label>
                            <Input
                              value={conceptoEnvio}
                              onChange={(e) => setConceptoEnvio(e.target.value)}
                              placeholder="Descripción del envío"
                            />
                          </div>

                          <Button
                            onClick={confirmarEnvio}
                            className="w-full bg-purple-600 hover:bg-purple-700"
                          >
                            Confirmar Envío
                          </Button>
                        </div>
                      </>
                    )}

                    {pasoEnvio === 'procesando' && (
                      <div className="text-center py-8">
                        <div className="inline-flex items-center gap-2 text-orange-600">
                          <ClockIcon className="w-5 h-5 animate-spin" />
                          <span className="font-medium">Procesando envío...</span>
                        </div>
                        <div className="text-sm text-gray-500 mt-2">
                          Enviando ${montoEnvio} USD a {cuentaSeleccionada?.nombre}
                        </div>
                      </div>
                    )}

                    {pasoEnvio === 'exito' && (
                      <div className="text-center py-8">
                        <div className="text-green-600 text-4xl mb-4">✅</div>
                        <div className="font-medium text-gray-900 mb-2">¡Envío exitoso!</div>
                        <div className="text-sm text-gray-500 mb-6">
                          Se enviaron ${montoEnvio} USD a {cuentaSeleccionada?.nombre}
                        </div>
                        <div className="space-y-3">
                          <Button
                            onClick={() => generarComprobantePDF(movimientoCompleto)}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            <DownloadIcon className="w-4 h-4 mr-2" />
                            Descargar comprobante
                          </Button>
                          <Button
                            onClick={() => {
                              setMostrarEnvio(false);
                              setPasoEnvio('monto');
                              setMovimientoCompleto(null);
                            }}
                            variant="outline"
                            className="w-full"
                          >
                            Finalizar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Panel derecho - Movimientos */}
          <div className="lg:col-span-2">
            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Movimientos</h2>
                  <Button 
                    variant="outline" 
                    className="gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                    onClick={() => setModalDescargaAbierto(true)}
                  >
                    <DownloadIcon className="w-4 h-4" />
                    Descargar estado de balances
                  </Button>
                </div>

                {/* Lista de movimientos */}
                <div className="space-y-4">
                  {movimientosPaginados.map((movimiento) => (
                    <div 
                      key={movimiento.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => handleVerDetalles(movimiento)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {getTransactionIcon(movimiento.tipo)}
                          {movimiento.internacional && <GlobeIcon className="w-4 h-4 text-gray-400" />}
                        </div>
                        
                        <div>
                          <div className="font-medium text-gray-900">
                            {movimiento.descripcion}
                          </div>
                          <div className="text-sm text-gray-500">
                            {movimiento.destinatario}
                          </div>
                          {movimiento.tipo === 'retiro' && (
                            <div className="text-xs text-gray-400">
                              Retirado: ${typeof movimiento.montoRetiradoUSD === 'number' ? movimiento.montoRetiradoUSD.toFixed(2) : 'N/A'} USD → Recibido: ${movimiento.montoRecibidoMXN?.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                            </div>
                          )}
                          {movimiento.tipo === 'fondeo' && (
                            <div className="text-xs text-gray-400">
                              Recibido: ${movimiento.montoRecibidoMXN?.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN → Convertido: ${typeof movimiento.montoConvertidoUSD === 'number' ? movimiento.montoConvertidoUSD.toFixed(2) : 'N/A'} USD
                            </div>
                          )}
                          {movimiento.tipo === 'transferencia_internacional' && (
                            <div className="text-xs text-gray-400">
                              Transferencia internacional
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(movimiento)}
                          <div className="text-right">
                            <div className={`font-medium ${
                              movimiento.monto > 0 ? 'text-green-600' : 'text-gray-900'
                            }`}>
                              {movimiento.monto > 0 ? '+' : ''}{formatAmount(Math.abs(movimiento.monto), movimiento.moneda)}
                            </div>
                            <div className="text-xs text-gray-400">
                              {movimiento.fecha} • {movimiento.hora}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Paginación */}
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button 
                    onClick={paginaAnterior}
                    disabled={paginaActual === 1}
                    className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeftIcon className="w-4 h-4 text-gray-400" />
                  </button>
                  
                  {/* Números de página */}
                  {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pagina) => (
                    <button
                      key={pagina}
                      onClick={() => irAPagina(pagina)}
                      className={`w-8 h-8 rounded text-sm font-medium ${
                        pagina === paginaActual
                          ? 'bg-purple-600 text-white'
                          : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      {pagina}
                    </button>
                  ))}
                  
                  <button 
                    onClick={paginaSiguiente}
                    disabled={paginaActual === totalPaginas}
                    className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Modal de nueva cuenta */}
        <Dialog open={mostrarModalNuevaCuenta} onOpenChange={setMostrarModalNuevaCuenta}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Agregar nueva cuenta</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="nombre-beneficiario">Nombre del beneficiario</Label>
                <Input 
                  id="nombre-beneficiario" 
                  placeholder="Ingresa el nombre completo"
                  value={nuevaCuenta.nombre}
                  onChange={(e) => setNuevaCuenta({...nuevaCuenta, nombre: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="numero-cuenta">Número de cuenta</Label>
                <Input 
                  id="numero-cuenta" 
                  placeholder="Ingresa el número de cuenta"
                  value={nuevaCuenta.numeroCuenta}
                  onChange={(e) => setNuevaCuenta({...nuevaCuenta, numeroCuenta: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="banco">Banco</Label>
                <select 
                  id="banco"
                  value={nuevaCuenta.banco}
                  onChange={(e) => setNuevaCuenta({...nuevaCuenta, banco: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">Selecciona el banco</option>
                  <option value="Chase Bank">Chase Bank</option>
                  <option value="Wells Fargo">Wells Fargo</option>
                  <option value="Bank of America">Bank of America</option>
                  <option value="Citibank">Citibank</option>
                  <option value="JPMorgan Chase">JPMorgan Chase</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="tipo-cuenta">Tipo de cuenta</Label>
                <select 
                  id="tipo-cuenta"
                  value={nuevaCuenta.tipoCuenta}
                  onChange={(e) => setNuevaCuenta({...nuevaCuenta, tipoCuenta: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">Selecciona el tipo</option>
                  <option value="corriente">Cuenta corriente</option>
                  <option value="ahorros">Cuenta de ahorros</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="routing">Routing Number</Label>
                <Input 
                  id="routing" 
                  placeholder="Ingresa el routing number"
                  value={nuevaCuenta.routing}
                  onChange={(e) => setNuevaCuenta({...nuevaCuenta, routing: e.target.value})}
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setMostrarModalNuevaCuenta(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleAgregarCuenta}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  Agregar cuenta
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Detalles de Movimiento */}
        {mostrarDetalles && movimientoSeleccionado && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg mx-auto bg-white shadow-xl rounded-3xl relative max-h-[90vh] overflow-y-auto">
              {/* Botón X para cerrar */}
              <button
                onClick={handleCerrarDetalles}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XIcon className="w-6 h-6" />
              </button>

              <CardContent className="p-8 pt-12">
                {/* Monto y estado */}
                <div className="text-center mb-8">
                  <div className={`text-4xl font-bold mb-2 ${
                    movimientoSeleccionado.monto < 0 ? 'text-gray-900' : 'text-green-600'
                  }`}>
                    {movimientoSeleccionado.monto < 0 ? '- ' : '+ '}${Math.abs(movimientoSeleccionado.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })} {movimientoSeleccionado.moneda}
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    {movimientoSeleccionado.enProceso ? (
                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full whitespace-nowrap">
                        <ClockIcon className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">En proceso</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CheckCircleIcon className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-600">Completada</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Detalles del movimiento */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-4">
                      {movimientoSeleccionado.tipo === 'recibo' || movimientoSeleccionado.tipo === 'deposito_usd' ? 'Recibiste dinero de:' : 'Enviaste dinero a:'}
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Descripción</span>
                        <span className="text-sm font-medium text-right">
                          {movimientoSeleccionado.descripcion}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Destinatario/Origen</span>
                        <span className="text-sm font-medium text-right">
                          {movimientoSeleccionado.destinatario}
                        </span>
                      </div>

                      {movimientoSeleccionado.tipo === 'retiro' && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">USD retirado</span>
                            <span className="text-sm font-medium">${typeof movimientoSeleccionado.montoRetiradoUSD === 'number' ? movimientoSeleccionado.montoRetiradoUSD.toFixed(2) : 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">MXN recibido</span>
                            <span className="text-sm font-medium">${movimientoSeleccionado.montoRecibidoMXN?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                          </div>
                        </>
                      )}

                      {movimientoSeleccionado.tipo === 'fondeo' && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">MXN recibido</span>
                            <span className="text-sm font-medium">${movimientoSeleccionado.montoRecibidoMXN?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">USD convertido</span>
                            <span className="text-sm font-medium">${typeof movimientoSeleccionado.montoConvertidoUSD === 'number' ? movimientoSeleccionado.montoConvertidoUSD.toFixed(2) : 'N/A'}</span>
                          </div>
                        </>
                      )}

                      {movimientoSeleccionado.tipo === 'transferencia_internacional' && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Concepto</span>
                            <span className="text-sm font-medium">{movimientoSeleccionado.concepto || 'Transferencia internacional'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Tipo</span>
                            <span className="text-sm font-medium">Transferencia Internacional</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Información de la transferencia */}
                  <div className="border-t pt-6">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Fecha</span>
                        <span className="text-sm font-medium">{movimientoSeleccionado.fecha} • {movimientoSeleccionado.hora}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Moneda</span>
                        <span className="text-sm font-medium">{movimientoSeleccionado.moneda}</span>
                      </div>
                      {movimientoSeleccionado.tipoCambio && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Tipo de cambio</span>
                          <span className="text-sm font-medium">${typeof movimientoSeleccionado.tipoCambio === 'number' ? movimientoSeleccionado.tipoCambio.toFixed(2) : 'N/A'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex gap-3 mt-8 pt-6 border-t">
                  <Button
                    variant="outline"
                    className="flex-1 text-purple-600 border-purple-600 hover:bg-purple-600/5"
                    onClick={() => window.open('mailto:soporte@xepelin.com?subject=Consulta sobre movimiento ' + movimientoSeleccionado.id)}
                  >
                    ¿Necesitas ayuda?
                  </Button>
                  <Button
                    onClick={() => generarComprobantePDF(movimientoSeleccionado)}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <DownloadIcon className="w-4 h-4 mr-2" />
                    Descargar comprobante
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Modal de descarga de estado de balances */}
      <Dialog open={modalDescargaAbierto} onOpenChange={handleCerrarModalDescarga}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Descargar estado de balances</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Selección de período */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Selecciona el período
              </label>
              <select 
                value={mesSeleccionado} 
                onChange={(e) => setMesSeleccionado(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecciona mes y año</option>
                {opcionesMeses.map((opcion) => (
                  <option key={opcion.valor} value={opcion.valor}>
                    {opcion.etiqueta}
                  </option>
                ))}
              </select>
            </div>

            {/* Mensaje para reportes más antiguos */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700">
                <strong>¿Necesitas un reporte más antiguo?</strong><br />
                Para estados de balances anteriores a los últimos 12 meses, contáctanos al soporte.
              </p>
            </div>

            {/* Botones */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={handleCerrarModalDescarga}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleDescargarEstado}
                disabled={!mesSeleccionado}
                className="flex-1 bg-[#555EEE] hover:bg-[#555EEE]/90"
              >
                Descargar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}