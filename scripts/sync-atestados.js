require("dotenv").config({ path: require("path").resolve(__dirname, "../.env.local") });

const { google } = require("googleapis");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function sincronizarAtestados() {
  const auth = new google.auth.GoogleAuth({
    keyFile: require("path").resolve(__dirname, "credentials.json"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  const spreadsheetId = "1did243q7zncd33rsUi8frHLneR5ymFEkEYsejRaZp2Y";

  // NÃO importar DEZ porque é do ano anterior
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

  let todosAtestados = [];

  for (const mes of meses) {
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `'${mes}'!A2:L`,
      });

      const rows = response.data.values || [];

      const atestados = rows
        .filter((row) => row[1]) // matrícula preenchida
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

      console.log(`${mes}: ${atestados.length} atestados encontrados`);

      todosAtestados = [...todosAtestados, ...atestados];

    } catch (error) {
      console.log(`Aba ${mes} não encontrada. Pulando...`);
    }
  }

  console.log(`Total de atestados encontrados: ${todosAtestados.length}`);

  const { error: deleteError } = await supabase
    .from("atestados")
    .delete()
    .neq("id", 0);

  if (deleteError) {
    console.error("Erro ao limpar tabela:", deleteError);
    return;
  }

  const { error: insertError } = await supabase
    .from("atestados")
    .insert(todosAtestados);

  if (insertError) {
    console.error("Erro ao inserir atestados:", insertError);
    return;
  }

  console.log("Sincronização de atestados concluída com sucesso!");
}

sincronizarAtestados();