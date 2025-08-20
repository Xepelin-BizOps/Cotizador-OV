"use server"
import { prisma } from "@/lib/prisma";

export async function testDB() {
    try {
        const count = await prisma.company.count();
        return { success: true, data: count, message: "Conexión exitosa" }
    } catch (error) {
        console.error("DB connection failed:", error);
        return { success: false, message: "Error de conexión", data: null }
    }
}