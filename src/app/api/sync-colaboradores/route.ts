import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const auth = new google.auth.GoogleAuth({
      keyFile: path.resolve(process.cwd(), "scripts/credentials.json"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const spreadsheetId = "1DXhgifVBTnQYroY-9mjc-rn-Kg3AILVq5zt5vMi5se4";

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "'BASE DE DADOS'!A2:K",
    });

    const rows = response.data.values || [];

    const colaboradores = rows
      .filter((row) => row[1])
      .map((row) => ({
        pref: row[0] || null,
        matricula: row[1] || null,
        nome: row[2] || null,
        cargo: row[3] || null,
        carga_horaria: row[4] || null,
        exercicio: row[5] || null,
        cpf: row[6] || null,
        pis: row[7] || null,
        data_nascimento: row[8] || null,
        email: row[9] || null,
        observacao: row[10] || null,
      }));

    const { error: deleteError } = await supabase
      .from("colaboradores")
      .delete()
      .neq("id", 0);

    if (deleteError) {
      return Response.json({ success: false, error: deleteError });
    }

    const { error: insertError } = await supabase
      .from("colaboradores")
      .insert(colaboradores);

    if (insertError) {
      return Response.json({ success: false, error: insertError });
    }

    return Response.json({
      success: true,
      total: colaboradores.length,
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: String(error),
    });
  }
}