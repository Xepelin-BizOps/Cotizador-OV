import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    // Monedas
    const currencies = [
        { value: 'MXN' }, //Peso Mexicano
        { value: 'CLP' }, // Peso Chileno
    ]

    for (const currency of currencies) {
        await prisma.currency.upsert({
            where: { value: currency.value },
            update: {},
            create: currency,
        })
    }

    // Categorias de productos, agregar las necesarias
    const categories = [
        { name: 'Electrónica', description: 'Dispositivos electrónicos y gadgets' },
        { name: 'Ropa', description: 'Prendas de vestir y accesorios' },
        { name: 'Hogar', description: 'Productos para el hogar y decoración' },
    ]

    for (const category of categories) {
        await prisma.category.upsert({
            where: { name: category.name },
            update: {},
            create: category,
        })
    }

    console.log('Monedas - categorías seed completado.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
