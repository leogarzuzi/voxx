import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || "{}"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const spreadsheetId = "1DXhgifVBTnQYroY-9mjc-rn-Kg3AILVq5zt5vMi5se4";

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "'DESLIGAMENTO'!A2:O",
    });

    const rows = response.data.values || [];

    const desligamentos = rows
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
        data_desligamento: row[10] || null,
        tipo_desligamento: row[11] || null,
        data_aso: row[12] || null,
        data_homologacao: row[13] || null,
        status_processamento: row[14] || null,
      }));

    const { error: deleteError } = await supabase
      .from("desligamentos")
      .delete()
      .neq("id", 0);

    if (deleteError) {
      return Response.json({
        success: false,
        etapa: "limpar_desligamentos",
        error: deleteError,
      });
    }

    const { error: insertError } = await supabase
      .from("desligamentos")
      .insert(desligamentos);

    if (insertError) {
      return Response.json({
        success: false,
        etapa: "inserir_desligamentos",
        error: insertError,
      });
    }

    return Response.json({
      success: true,
      total: desligamentos.length,
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: String(error),
    });
  }
}