import { NextResponse } from "next/server";
import { verifyToken } from "@/app/(sections)/auth/_fetures/action";
import { getCompanyById } from "@/app/(sections)/home/_feature/company/actions";

export async function GET() {
  try {
    console.log("🔍 Debug /api/auth/me: Starting...");
    const { companyId } = await verifyToken();
    
    // Fallback temporal: si companyId es 0, usar 4 (Chile)
    const finalCompanyId = companyId === 0 ? 4 : companyId;
    
    console.log("🔍 Debug /api/auth/me:", {
      originalCompanyId: companyId,
      finalCompanyId: finalCompanyId
    });
    
    // Obtener datos reales de la empresa
    console.log("🔍 Debug /api/auth/me: Calling getCompanyById...");
    const companyResult = await getCompanyById(finalCompanyId);
    
    console.log("🔍 Debug /api/auth/me: getCompanyById result:", {
      success: companyResult.success,
      hasData: !!companyResult.data,
      company: companyResult.data
    });
    
    if (!companyResult.success || !companyResult.data) {
      throw new Error("No se pudo obtener información de la empresa");
    }
    
    const company = companyResult.data;
    
    const response = {
      success: true,
      user: { 
        session: "active",
        companyId: finalCompanyId,
        id: 1, // ID del usuario (puedes ajustar esto según tu lógica)
        email: company.email || "user@example.com",
        currency: {
          id: 1,
          value: company.country === "CHILE" ? "CLP" : "MXN"
        },
        company: {
          name: company.companyName,
          country: company.country,
          address: company.address,
          rfc: company.rfc,
          phone: company.phone,
          logoBase64: company.logoBase64
        }
      },
    };
    
    console.log("🔍 Debug /api/auth/me: Returning response:", response);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error("🔍 Debug /api/auth/me: Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : "No autorizado" 
      },
      { status: 401 }
    );
  }
}
