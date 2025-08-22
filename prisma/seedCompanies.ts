import { Country, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ✅ Usa Partial<Record<Country, string>> para no requerir TODOS los países del enum
const countryToCurrencyMap: Partial<Record<Country, string>> = {
  [Country.MEXICO]: 'MXN',
  [Country.CHILE]: 'CLP',
  // Si tienes más países en tu enum, agrégalos cuando los necesites:
  // [Country.ARGENTINA]: 'ARS',
};

// Si tu tabla de Currency tiene más campos (name, symbol), puedes agregarlos aquí.
const currenciesToEnsure = [
  { value: 'MXN' },
  { value: 'CLP' },
  // { value: 'ARS' },
];

async function ensureCurrencies() {
  for (const c of currenciesToEnsure) {
    // Idempotente: crea si no existe
    const found = await prisma.currency.findFirst({ where: { value: c.value } });
    if (!found) {
      await prisma.currency.create({ data: c });
      console.log(`Currency creada: ${c.value}`);
    }
  }
}

async function main() {
  // 1) Asegura monedas necesarias
  await ensureCurrencies();

  // 2) Empresas a sembrar (puedes agregar/editar libremente)
  const companiesToSeed = [
    {
      companyName: 'Prueba',
      businessIdentifier: 'AGM150318F76', // idealmente UNIQUE en tu esquema
      country: Country.MEXICO,
      email: 'qa+130@xepelin.com',
      rfc: 'AGM150318F76',
      phone: '+553232323',
      users: [
        {
          fullName: 'QA 130',
          email: 'qa+130@xepelin.com', // idealmente UNIQUE en tu esquema
        },
      ],
    },
    {
      companyName: 'Globex S.A.',
      businessIdentifier: '88299321-0',
      country: Country.MEXICO,
      email: 'globex@example.com',
      rfc: 'RFC987654',
      phone: '555-4321',
      users: [
        {
          fullName: 'Carlos Gómez',
          email: 'carlos@globex.com',
        },
      ],
    },
  ];

  for (const companyData of companiesToSeed) {
    const currencyValue = countryToCurrencyMap[companyData.country];

    if (!currencyValue) {
      throw new Error(
        `Currency no definida para el país ${companyData.country} en countryToCurrencyMap`
      );
    }

    // Busca la moneda (ya garantizamos que exista)
    const currency = await prisma.currency.findFirst({
      where: { value: currencyValue },
    });

    if (!currency) {
      throw new Error(`Currency "${currencyValue}" no encontrada. Verifica ensureCurrencies().`);
    }

    // 3) Crea/actualiza la empresa
    // Nota: el where asume que businessIdentifier es UNIQUE
    const company = await prisma.company.upsert({
      where: { businessIdentifier: companyData.businessIdentifier },
      update: {
        companyName: companyData.companyName,
        country: companyData.country,
        email: companyData.email,
        rfc: companyData.rfc,
        phone: companyData.phone,
        currency: { connect: { id: currency.id } },
      },
      create: {
        companyName: companyData.companyName,
        businessIdentifier: companyData.businessIdentifier,
        country: companyData.country,
        email: companyData.email,
        rfc: companyData.rfc,
        phone: companyData.phone,
        currency: { connect: { id: currency.id } },
      },
    });

    // 4) Crea/actualiza usuarios y los conecta a la empresa
    for (const u of companyData.users) {
      await prisma.user.upsert({
        where: { email: u.email },
        update: {
          fullName: u.fullName,
          company: { connect: { id: company.id } },
        },
        create: {
          fullName: u.fullName,
          email: u.email,
          company: { connect: { id: company.id } },
        },
      });
    }

    console.log(`Empresa lista: ${company.companyName} (${currencyValue})`);
  }
}

main()
  .then(() => {
    console.log('Seed completado!');
  })
  .catch((e) => {
    console.error('Error durante seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
