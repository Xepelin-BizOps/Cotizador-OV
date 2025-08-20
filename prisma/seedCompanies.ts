import { Country, PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const countryToCurrencyMap = {
    [Country.MEXICO]: 'MXN',
    [Country.CHILE]: 'CLP',
}

async function main() {
    const companiesToSeed = [
        {
            companyName: 'Fer Corp',
            businessIdentifier: '323232-1',
            country: Country.MEXICO,
            email: 'fer@corp.com',
            rfc: 'RFC32311',
            phone: '+553232323',
            users: [
                {
                    fullName: 'Pepe Paz',
                    email: 'peep@corp.com',
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
    ]

    for (const companyData of companiesToSeed) {
        const currencyValue = countryToCurrencyMap[companyData.country]
        const currency = await prisma.currency.findFirst({
            where: { value: currencyValue },
        })

        if (!currency) {
            throw new Error(`Currency "${currencyValue}" no encontrada.`)
        }

        await prisma.company.create({
            data: {
                companyName: companyData.companyName,
                businessIdentifier: companyData.businessIdentifier,
                country: companyData.country,
                email: companyData.email,
                rfc: companyData.rfc,
                phone: companyData.phone,
                currency: {
                    connect: { id: currency.id },
                },
                users: {
                    create: companyData.users,
                },
            },
        })
    }
}

main()
    .then(() => {
        console.log('Seed completado!')
    })
    .catch((e) => {
        console.error('Error durante seed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
