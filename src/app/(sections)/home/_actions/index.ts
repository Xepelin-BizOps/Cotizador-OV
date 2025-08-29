'use server'

import { prisma } from '@/lib/prisma'
import { QuotationStatus } from '@prisma/client';
import dayjs from 'dayjs';
import { verifyToken } from '../../auth/_fetures/action';
import { transformToIdAndValueSelectOptions, transformToSelectOptions } from '@/utils/transformToSelectOptions';

export const getCategories = async () => {

    const cetegories = await prisma.category.findMany({
        orderBy: { name: 'asc' },
    })

    return transformToSelectOptions(cetegories)
}

export async function getCurrenciesCatalog(): Promise<{ label: string, value: string }[]> {
    const currencies = await prisma.currency.findMany({});

    return transformToIdAndValueSelectOptions(currencies);
}

export async function getCompanyProductCatalog(companyId: number): Promise<{ label: string, value: number }[]> {
    const products = await prisma.product.findMany({
        where: { companyId },
        select: { id: true, name: true, sku: true, price: true },
        orderBy: { name: "asc" },
    });

    return products.map((p) => ({
        value: p.id,
        label: `${p.name} - ${p.sku} - ${p.price}`,
    }));
}


export async function getCompanyClientCatalog(companyId: number): Promise<{ label: string, value: number }[]> {
    const clients = await prisma.client.findMany({
        where: { companyId },
        select: { id: true, fullName: true, companyName: true },
        //   orderBy: { name: "asc" },
    });

    return clients.map((client) => ({
        value: client.id,
        label: client.companyName || client.fullName || "",
    }));
}

function getPercentageChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
}

export async function getStats() {
    try {

        // validar que tenga un token para poder traer los datos
        const user = await verifyToken();

        if (!user) {
            return {
                success: false,
                message: "No autorizado - token no encontrado. Válida tu sesión nuevamente",
                data: [],
            };
        }

        // Accedemos al company id del user
        const companyId = user.companyId;

        const now = dayjs();
        const last30DaysStart = now.subtract(30, "day").startOf("day").toDate();
        const prev30DaysStart = now.subtract(60, "day").startOf("day").toDate();
        const prev30DaysEnd = now.subtract(30, "day").endOf("day").toDate();

        // Obtener moneda de la empresa
        const company = await prisma.company.findUnique({
            where: { id: companyId },
            include: { currency: true },
        });

        const currency = company?.currency?.value || "No tiene";

        // ------- Total Cotizado (últimos 30 días)
        const { _sum: currentQuotedSum } = await prisma.quotation.aggregate({
            _sum: { totalAmount: true },
            where: {
                companyId,
                quotationDate: { gte: last30DaysStart },
            },
        });
        const totalQuoted = currentQuotedSum.totalAmount?.toNumber() || 0;

        // ------- Total Cotizado (30-60 días atrás)
        const { _sum: prevQuotedSum } = await prisma.quotation.aggregate({
            _sum: { totalAmount: true },
            where: {
                companyId,
                quotationDate: {
                    gte: prev30DaysStart,
                    lte: prev30DaysEnd,
                },
            },
        });
        const previousTotal = prevQuotedSum.totalAmount?.toNumber() || 0;
        const percentageChange = getPercentageChange(totalQuoted, previousTotal);

        // ------- Total Vendido (últimos 30 días)
        const validStatuses = [
            QuotationStatus.CONFIRMED,
            QuotationStatus.PARTIAL_PAYMENT,
            QuotationStatus.PAID,
        ];
        const { _sum: currentSoldSum } = await prisma.quotation.aggregate({
            _sum: { totalAmount: true },
            where: {
                companyId,
                quotationDate: { gte: last30DaysStart },
                status: { in: validStatuses },
            },
        });
        const currentSold = currentSoldSum.totalAmount?.toNumber() || 0;

        // ------- Total Vendido (30-60 días atrás)
        const { _sum: prevSoldSum } = await prisma.quotation.aggregate({
            _sum: { totalAmount: true },
            where: {
                companyId,
                quotationDate: {
                    gte: prev30DaysStart,
                    lte: prev30DaysEnd,
                },
                status: { in: validStatuses },
            },
        });
        const previousSold = prevSoldSum.totalAmount?.toNumber() || 0;
        const percentagetotalSold = getPercentageChange(currentSold, previousSold);

        // ------- Por Cobrar (últimos 30 días)
        const { _sum: amountToCollectSum } = await prisma.quotation.aggregate({
            _sum: { totalAmount: true },
            where: {
                companyId,
                quotationDate: { gte: last30DaysStart },
                status: { in: [QuotationStatus.CONFIRMED] },
            },
        });
        const amountToCollect = amountToCollectSum.totalAmount?.toNumber() || 0;

        // ------- Tasa de Conversión
        const conversionRate = totalQuoted
            ? (currentSold / totalQuoted) * 100
            : 0;

        // ------- Clientes Activos
        const activeClientsCount = await prisma.quotation.groupBy({
            by: ["clientId"],
            where: {
                companyId,
                quotationDate: { gte: last30DaysStart },
                status: { in: validStatuses },
            },
            _count: { clientId: true },
        }).then((res) => res.length);

        return {
            success: true,
            data: [
                {
                    label: "Total Cotizado",
                    value: totalQuoted,
                    currency,
                    change: percentageChange,
                },
                {
                    label: "Total Vendido",
                    value: currentSold,
                    currency,
                    change: percentagetotalSold,
                },
                {
                    label: "Por Cobrar",
                    value: amountToCollect,
                    currency,
                    change: null,
                },
                {
                    label: "Tasa Conversión",
                    value: `${conversionRate.toFixed(2)}%`,
                    currency: null,
                    change: null,
                },
                {
                    label: "Clientes Activos",
                    value: activeClientsCount,
                    currency: null,
                    change: null,
                },
            ],
            message: "Estadísticas obtenidas"
        }

    } catch (error) {
        console.error(error);
        return {
            success: false,
            message: error instanceof Error ? error.message : "No se pudieron obtener estadísticas",
            data: [],
        };
    }
}



