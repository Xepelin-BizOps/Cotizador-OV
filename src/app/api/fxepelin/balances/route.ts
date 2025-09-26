import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Obtener balances de la base de datos
    let balances = await prisma.userBalance.findMany({
      where: {
        userId: 1 // Por ahora hardcodeado
      }
    });

    // Si no hay balances, crear uno inicial para USD
    if (balances.length === 0) {
      console.log('No balances found, creating initial USD balance...');
      const initialBalance = await prisma.userBalance.create({
        data: {
          userId: 1,
          currency: 'USD',
          balance: 0.00
        }
      });
      balances = [initialBalance];
    }

    // Formatear los balances para el frontend
    const formattedBalances = balances.map(balance => ({
      currency: balance.currency,
      amount: balance.balance
    }));

    console.log('Returning balances:', formattedBalances);
    return NextResponse.json(formattedBalances);
  } catch (error) {
    console.error('Error fetching balances:', error);
    return NextResponse.json(
      { error: 'Failed to fetch balances' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Updating balance:', body);
    
    // Buscar el balance existente
    const existingBalance = await prisma.userBalance.findFirst({
      where: {
        userId: body.userId || 1,
        currency: body.currency
      }
    });

    let newBalance;
    const operation = body.operation || 'set';
    
    if (existingBalance) {
      // Calcular nuevo balance basado en la operación
      const currentBalance = Number(existingBalance.balance);
      switch (operation) {
        case 'add':
          newBalance = currentBalance + body.amount;
          break;
        case 'subtract':
          newBalance = currentBalance - body.amount;
          break;
        case 'set':
        default:
          newBalance = body.amount;
          break;
      }
      
      // Actualizar balance existente
      const updatedBalance = await prisma.userBalance.update({
        where: {
          id: existingBalance.id
        },
        data: {
          balance: newBalance
        }
      });
      
      return NextResponse.json({ 
        success: true, 
        message: 'Balance updated successfully',
        data: updatedBalance
      });
    } else {
      // Crear nuevo balance
      const newBalance = operation === 'add' ? body.amount : body.amount;
      const updatedBalance = await prisma.userBalance.create({
        data: {
          userId: body.userId || 1,
          currency: body.currency,
          balance: newBalance
        }
      });
      
      return NextResponse.json({ 
        success: true, 
        message: 'Balance created successfully',
        data: updatedBalance
      });
    }
  } catch (error) {
    console.error('Error updating balance:', error);
    return NextResponse.json(
      { error: 'Failed to update balance' }, 
      { status: 500 }
    );
  }
}
