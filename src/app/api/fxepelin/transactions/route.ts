import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Obtener transacciones de la base de datos
    const transactions = await prisma.fxTransaction.findMany({
      where: {
        userId: 1 // Por ahora hardcodeado
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Formatear las transacciones para el frontend
    const formattedTransactions = transactions.map(tx => ({
      id: tx.id.toString(),
      fecha: tx.createdAt.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
      tipo: tx.type,
      descripcion: tx.description,
      destinatario: tx.recipient || '',
      monto: Number(tx.amount),
      moneda: tx.toCurrency || 'USD',
      hora: tx.createdAt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true }),
      internacional: tx.isInternational || false,
      enProceso: tx.status === 'PENDING',
      concepto: tx.concept || '',
      tipoCambio: tx.exchangeRate ? Number(tx.exchangeRate) : 0,
      montoRetiradoUSD: tx.withdrawnAmountUSD ? Number(tx.withdrawnAmountUSD) : 0,
      montoRecibidoMXN: tx.receivedAmountMXN ? Number(tx.receivedAmountMXN) : 0,
      montoConvertidoUSD: tx.convertedAmountUSD ? Number(tx.convertedAmountUSD) : 0
    }));

    return NextResponse.json({ success: true, data: formattedTransactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Creating transaction:', body);
    
    // Crear la transacción en la base de datos
    const transaction = await prisma.fxTransaction.create({
      data: {
        userId: body.userId || 1,
        type: body.tipo,
        description: body.descripcion,
        recipient: body.destinatario,
        amount: body.monto,
        toCurrency: body.moneda,
        isInternational: body.internacional || false,
        status: body.enProceso ? 'PENDING' : 'COMPLETED',
        concept: body.concepto || '',
        exchangeRate: body.tipoCambio,
        withdrawnAmountUSD: body.montoRetiradoUSD || null,
        receivedAmountMXN: body.montoRecibidoMXN || null,
        convertedAmountUSD: body.montoConvertidoUSD || null
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Transaction created successfully',
      data: transaction
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json({ success: false, error: 'Failed to create transaction' }, { status: 500 });
  }
}
