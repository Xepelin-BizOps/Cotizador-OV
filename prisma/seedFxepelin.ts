import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedFxepelin() {
  console.log('🌱 Seeding FXepelin data...');

  try {
    // Get the first user to associate with FXepelin data
    const firstUser = await prisma.user.findFirst();
    
    if (!firstUser) {
      console.log('❌ No users found. Please run the main seed first.');
      return;
    }

    console.log(`👤 Using user: ${firstUser.email}`);

    // Create initial balances for the user
    const usdBalance = await prisma.userBalance.upsert({
      where: {
        id: 1 // Use a simple ID-based approach for now
      },
      update: {
        userId: firstUser.id,
        currency: 'USD',
        balance: 650.45
      },
      create: {
        userId: firstUser.id,
        currency: 'USD',
        balance: 650.45
      }
    });

    const mxnBalance = await prisma.userBalance.upsert({
      where: {
        id: 2 // Use a simple ID-based approach for now
      },
      update: {
        userId: firstUser.id,
        currency: 'MXN',
        balance: 12384.28
      },
      create: {
        userId: firstUser.id,
        currency: 'MXN',
        balance: 12384.28
      }
    });

    console.log(`💰 Created balances: USD $${usdBalance.balance}, MXN $${mxnBalance.balance}`);

    // Create initial exchange rates
    const usdToMxnRate = await prisma.exchangeRate.upsert({
      where: {
        id: 1
      },
      update: {
        fromCurrency: 'USD',
        toCurrency: 'MXN',
        rate: 18.30
      },
      create: {
        fromCurrency: 'USD',
        toCurrency: 'MXN',
        rate: 18.30
      }
    });

    const mxnToUsdRate = await prisma.exchangeRate.upsert({
      where: {
        id: 2
      },
      update: {
        fromCurrency: 'MXN',
        toCurrency: 'USD',
        rate: 1 / 18.30
      },
      create: {
        fromCurrency: 'MXN',
        toCurrency: 'USD',
        rate: 1 / 18.30
      }
    });

    console.log(`💱 Created exchange rates: 1 USD = ${usdToMxnRate.rate} MXN`);

    // Create sample destination accounts
    const destinationAccount1 = await prisma.fxDestinationAccount.create({
      data: {
        userId: firstUser.id,
        name: 'John Doe',
        accountNumber: '1234567890',
        bank: 'Bank of America',
        country: 'United States',
        accountType: 'Checking Account',
        swiftCode: 'BOFAUS3N',
        iban: 'US64BOFA1234567890'
      }
    });

    const destinationAccount2 = await prisma.fxDestinationAccount.create({
      data: {
        userId: firstUser.id,
        name: 'Maria Garcia',
        accountNumber: '0987654321',
        bank: 'Wells Fargo',
        country: 'United States',
        accountType: 'Savings Account',
        swiftCode: 'WFBIUS6S',
        iban: 'US64WFBI0987654321'
      }
    });

    console.log(`🏦 Created ${2} destination accounts`);

    // Create sample transactions
    const sampleTransactions = [
      {
        userId: firstUser.id,
        type: 'send',
        fromCurrency: 'USD',
        toCurrency: 'USD',
        amount: -250.00,
        exchangeRate: 1.0,
        fee: 5.00,
        status: 'processing',
        description: 'Envío internacional',
        recipient: 'John Doe - Bank of America',
        isInternational: true,
        concept: 'Payment for services',
        referenceNumber: `TR${Date.now().toString().slice(-6)}`,
        trackingKey: `XEPELINbc${Date.now().toString().slice(-8)}e4`,
        internalFolio: `C${Date.now().toString().slice(-8)}5`
      },
      {
        userId: firstUser.id,
        type: 'conversion',
        fromCurrency: 'USD',
        toCurrency: 'MXN',
        amount: 4100.00,
        exchangeRate: 20.50,
        fee: 0.00,
        status: 'completed',
        description: 'Conversión de divisas',
        recipient: 'USD a MXN',
        isInternational: false,
        concept: 'Currency conversion',
        referenceNumber: `CONV${Date.now().toString().slice(-6)}`,
        trackingKey: `XEPELINcv${Date.now().toString().slice(-8)}e4`,
        internalFolio: `C${Date.now().toString().slice(-8)}6`
      },
      {
        userId: firstUser.id,
        type: 'receive',
        fromCurrency: 'USD',
        toCurrency: 'USD',
        amount: 500.00,
        exchangeRate: 1.0,
        fee: 0.00,
        status: 'completed',
        description: 'Recibiste dinero',
        recipient: 'International Client - Wire Transfer',
        isInternational: true,
        concept: 'International wire transfer',
        referenceNumber: `RECV${Date.now().toString().slice(-6)}`,
        trackingKey: `XEPELINrc${Date.now().toString().slice(-8)}e4`,
        internalFolio: `C${Date.now().toString().slice(-8)}7`
      }
    ];

    for (const transactionData of sampleTransactions) {
      await prisma.fxTransaction.create({
        data: transactionData
      });
    }

    console.log(`📊 Created ${sampleTransactions.length} sample transactions`);

    console.log('✅ FXepelin seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding FXepelin data:', error);
    throw error;
  }
}

// Run the seed function
seedFxepelin()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
