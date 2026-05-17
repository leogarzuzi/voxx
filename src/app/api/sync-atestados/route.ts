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

    const spreadsheetId = "1did243q7zncd33rsUi8frHLneR5ymFEkEYsejRaZp2Y";

    const meses = [
      "JAN",
      "FEV",
      "MAR",
      "ABR",
      "MAI",
      "JUN",
      "JUL",
      "AGO",
      "SET",
      "OUT",
      "NOV",
    ];

    let todosAtestados: any[] = [];

    for (const mes of meses) {
      try {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `'${mes}'!A2:L`,
        });

        const rows = response.data.values || [];

        const atestados = rows
          .filter((row) => row[1])
          .map((row) => ({
            pref: row[0] || null,
            matricula: row[1] || null,
            nome: row[2] || null,
            funcao: row[3] || null,
            data_inicial: row[4] || null,
            data_final: row[5] || null,
            escala_trabalho: row[6] || null,
            qtd_dias_abonados: row[7] || null,
            qtd_plantoes_abonados: row[8] || null,
            cid: row[9] || null,
            observacao: row[10] || null,
            carimbo: row[11] || null,
            mes: mes,
          }));

        todosAtestados = [...todosAtestados, ...atestados];
      } catch (error) {
          console.log(`Erro ao ler aba ${mes}:`, error);
      }
    }

    const { error: deleteError } = await supabase
      .from("atestados")
      .delete()
      .neq("id", 0);

    if (deleteError) {
      return Response.json({
        success: false,
        etapa: "limpar_atestados",
        error: deleteError,
      });
    }

    const { error: insertError } = await supabase
      .from("atestados")
      .insert(todosAtestados);

    if (insertError) {
      return Response.json({
        success: false,
        etapa: "inserir_atestados",
        error: insertError,
      });
    }

    return Response.json({
      success: true,
      total: todosAtestados.length,
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: String(error),
    });
  }
}