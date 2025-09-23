import { NextRequest, NextResponse } from "next/server";
import { getUFValue, getUFValueByDate } from "@/lib/ufService";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    let ufValue;
    if (date) {
      ufValue = await getUFValueByDate(date);
    } else {
      ufValue = await getUFValue();
    }

    if (!ufValue) {
      return NextResponse.json(
        { 
          success: false, 
          message: "No se pudo obtener el valor de la UF" 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: ufValue,
    });
  } catch (error) {
    console.error("Error in UF API:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Error interno del servidor" 
      },
      { status: 500 }
    );
  }
}
