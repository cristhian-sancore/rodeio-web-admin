import { getSeasonRanking } from "@/lib/ranking";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const data = await getSeasonRanking();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'Falha ao buscar ranking' }, { status: 500 });
  }
}
