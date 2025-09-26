const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugBalance() {
  try {
    console.log('Checking user_balances table...');
    
    // Verificar si existe un balance para el usuario 1
    const existingBalance = await prisma.userBalance.findFirst({
      where: { userId: 1, currency: 'USD' }
    });
    
    console.log('Existing USD balance:', existingBalance);
    
    if (!existingBalance) {
      console.log('Creating initial USD balance...');
      const newBalance = await prisma.userBalance.create({
        data: {
          userId: 1,
          currency: 'USD',
          balance: 0.00
        }
      });
      console.log('Created balance:', newBalance);
    }
    
    // Verificar todas las transacciones de fondeo
    const fondeoTransactions = await prisma.fxTransaction.findMany({
      where: { 
        userId: 1,
        type: 'fondeo'
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('Fondeo transactions:', fondeoTransactions);
    
    // Calcular el total de USD de fondeos
    const totalFondeoUSD = fondeoTransactions.reduce((sum, tx) => {
      return sum + Number(tx.amount);
    }, 0);
    
    console.log('Total fondeo USD:', totalFondeoUSD);
    
    // Actualizar el balance con el total
    const updatedBalance = await prisma.userBalance.upsert({
      where: {
        userId_currency: {
          userId: 1,
          currency: 'USD'
        }
      },
      update: {
        balance: totalFondeoUSD
      },
      create: {
        userId: 1,
        currency: 'USD',
        balance: totalFondeoUSD
      }
    });
    
    console.log('Updated balance:', updatedBalance);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugBalance();
