require("dotenv").config({ path: require("path").resolve(__dirname, "../.env.local") });

const { google } = require("googleapis");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function sincronizarDesligamentos() {
  const auth = new google.auth.GoogleAuth({
    keyFile: require("path").resolve(__dirname, "credentials.json"),
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
    .filter((row) => row[1]) // matrícula preenchida
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

  console.log(`Desligamentos encontrados: ${desligamentos.length}`);

  const { error: deleteError } = await supabase
    .from("desligamentos")
    .delete()
    .neq("id", 0);

  if (deleteError) {
    console.error("Erro ao limpar tabela:", deleteError);
    return;
  }

  const { error: insertError } = await supabase
    .from("desligamentos")
    .insert(desligamentos);

  if (insertError) {
    console.error("Erro ao inserir desligamentos:", insertError);
    return;
  }

  console.log("Sincronização de desligamentos concluída com sucesso!");
}

sincronizarDesligamentos();