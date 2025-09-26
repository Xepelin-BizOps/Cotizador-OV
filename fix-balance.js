const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixBalance() {
  try {
    console.log('Calculating correct balance from transactions...');
    
    // Obtener todas las transacciones del usuario 1
    const transactions = await prisma.fxTransaction.findMany({
      where: { userId: 1 },
      orderBy: { createdAt: 'asc' }
    });
    
    console.log('Found transactions:', transactions.length);
    
    let totalUSD = 0;
    
    // Calcular el balance basado en las transacciones
    transactions.forEach(tx => {
      const amount = Number(tx.amount);
      console.log(`Transaction ${tx.id}: ${tx.type} - ${amount} USD`);
      
      if (tx.type === 'fondeo' || tx.type === 'deposito_usd') {
        // Sumar para depósitos y fondeos
        totalUSD += amount;
        console.log(`  Adding ${amount} USD (total: ${totalUSD})`);
      } else if (tx.type === 'retiro' || tx.type === 'transferencia_internacional') {
        // Restar para retiros y envíos
        totalUSD -= amount;
        console.log(`  Subtracting ${amount} USD (total: ${totalUSD})`);
      }
    });
    
    console.log('Final calculated balance:', totalUSD);
    
    // Actualizar o crear el balance
    const balance = await prisma.userBalance.upsert({
      where: {
        userId_currency: {
          userId: 1,
          currency: 'USD'
        }
      },
      update: {
        balance: totalUSD
      },
      create: {
        userId: 1,
        currency: 'USD',
        balance: totalUSD
      }
    });
    
    console.log('Updated balance in database:', balance);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixBalance();
