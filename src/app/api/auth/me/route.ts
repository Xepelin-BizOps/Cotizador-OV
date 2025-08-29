import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const COOKIE_NAME = "session";

export async function GET() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  if (!cookie?.value) {
    return NextResponse.json(
      { success: false, message: "No autorizado – token no encontrado" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    user: { session: "active" },
  });
}
