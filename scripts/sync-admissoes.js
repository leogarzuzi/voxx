require("dotenv").config({ path: require("path").resolve(__dirname, "../.env.local") });

const { google } = require("googleapis");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function sincronizarAdmissoes() {
  const auth = new google.auth.GoogleAuth({
    keyFile: require("path").resolve(__dirname, "credentials.json"),
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
    .filter((row) => row[2]) // nome preenchido
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

  console.log(`Admissões encontradas: ${admissoes.length}`);

  const { error: deleteError } = await supabase
    .from("admissoes")
    .delete()
    .neq("id", 0);

  if (deleteError) {
    console.error("Erro ao limpar tabela:", deleteError);
    return;
  }

  const { error: insertError } = await supabase
    .from("admissoes")
    .insert(admissoes);

  if (insertError) {
    console.error("Erro ao inserir admissões:", insertError);
    return;
  }

  console.log("Sincronização de admissões concluída com sucesso!");
}

sincronizarAdmissoes();