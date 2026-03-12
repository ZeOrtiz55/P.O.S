import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { TBL_TECNICOS } from "@/lib/constants";

export async function GET() {
  const { data } = await supabase.from(TBL_TECNICOS).select("*");
  const nomes = (data || []).map((t) => t.UsuNome || "Técnico").sort();
  return NextResponse.json(nomes);
}
