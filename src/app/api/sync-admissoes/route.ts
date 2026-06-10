import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");

    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return Response.json(
        { success: false, error: "Não autorizado." },
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || "{}"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const spreadsheetId = "1DXhgifVBTnQYroY-9mjc-rn-Kg3AILVq5zt5vMi5se4";

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "'ADMISSÃO'!A2:S",
    });

    const rows = response.data.values || [];

    const admissoes = rows
      .filter((row) => row[2])
      .map((row) => ({
        carimbo: row[0] || null,
        pref: row[1] || null,
        matricula: row[2] || null,
        nome: row[3] || null,
        cargo: row[4] || null,
        ch_edital: row[5] || null,
        alteracao_ch: row[6] || null,
        ch_final: row[7] || null,
        sirg: row[8] || null,
        horario: row[9] || null,
        exercicio: row[10] || null,
        data_nascimento: row[11] || null,
        cpf: row[12] || null,
        pis: row[13] || null,
        edital: row[14] || null,
        email: row[15] || null,
        carta_banco: row[16] || null,
        observacao: row[17] || null,
        status_processamento: row[18] || null,
      }));

    const { error: deleteError } = await supabase
      .from("admissoes")
      .delete()
      .neq("id", 0);

    if (deleteError) {
      return Response.json({
        success: false,
        etapa: "limpar_admissoes",
        error: deleteError,
      });
    }

    const { error: insertError } = await supabase
      .from("admissoes")
      .insert(admissoes);

    if (insertError) {
      return Response.json({
        success: false,
        etapa: "inserir_admissoes",
        error: insertError,
      });
    }

    return Response.json({
      success: true,
      total: admissoes.length,
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: String(error),
    });
  }
}