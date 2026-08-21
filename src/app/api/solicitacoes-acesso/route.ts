import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { createSupabaseAdminClient, usuarioAtualTemPermissao } from "@/lib/perfisServer";
import { PERMISSOES } from "@/lib/perfis";
import { registrarAuditoria } from "@/lib/auditoria";
import { emailTemFormatoValido } from "@/lib/emailSeguro";

export const dynamic = "force-dynamic";

const tentativas = new Map<string, { quantidade: number; inicio: number }>();
const JANELA = 15 * 60 * 1000;
const LIMITE = 5;

function ipDaRequisicao(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "desconhecido";
}

function excedeuLimite(chave: string) {
  const agora = Date.now();
  const atual = tentativas.get(chave);
  if (!atual || agora - atual.inicio > JANELA) {
    tentativas.set(chave, { quantidade: 1, inicio: agora });
    return false;
  }
  atual.quantidade += 1;
  return atual.quantidade > LIMITE;
}

function emailValido(email: string) {
  return emailTemFormatoValido(email);
}

async function usuarioAutorizado() {
  const supabase = await createSupabaseServerClient();
  const permitido = await usuarioAtualTemPermissao(supabase, PERMISSOES.SOLICITACOES);
  if (!permitido) return null;
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export async function POST(request: Request) {
  const ip = ipDaRequisicao(request);
  if (excedeuLimite(ip)) {
    return Response.json(
      { success: false, error: "Muitas solicitações. Tente novamente mais tarde." },
      { status: 429, headers: { "Retry-After": "900" } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: "Dados inválidos." }, { status: 400 });
  }

  const dados = body as Record<string, unknown>;
  const nome = typeof dados.nome === "string" ? dados.nome.trim().replace(/\s+/g, " ") : "";
  const email = typeof dados.email === "string" ? dados.email.trim().toLowerCase() : "";

  if (nome.length < 3 || nome.length > 120 || !emailValido(email)) {
    return Response.json({ success: false, error: "Nome ou e-mail inválido." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("solicitacoes_acesso").insert({
    nome,
    email,
    status: "Pendente",
  });

  if (error?.code === "23505") {
    return Response.json({ success: false, error: "Já existe uma solicitação para este e-mail." }, { status: 409 });
  }
  if (error) {
    return Response.json({ success: false, error: "Não foi possível enviar a solicitação." }, { status: 500 });
  }

  return Response.json({ success: true }, { status: 201 });
}

export async function GET() {
  if (!(await usuarioAutorizado())) {
    return Response.json({ success: false, error: "Sem permissão." }, { status: 403 });
  }

  const admin = createSupabaseAdminClient();
  const [{ data, error }, { data: perfis }] = await Promise.all([
    admin.from("solicitacoes_acesso").select("id,nome,email,status,perfil,criado_em").order("criado_em", { ascending: false }),
    admin.from("perfis_acesso").select("nome").eq("ativo", true).order("protegido", { ascending: false }).order("nome"),
  ]);

  if (error) return Response.json({ success: false, error: "Não foi possível carregar as solicitações." }, { status: 500 });
  return Response.json({ success: true, solicitacoes: data ?? [], perfis: (perfis ?? []).map((item) => item.nome) });
}

export async function PATCH(request: Request) {
  const usuario = await usuarioAutorizado();
  if (!usuario?.email) {
    return Response.json({ success: false, error: "Sem permissão." }, { status: 403 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const id = typeof body.id === "number" ? body.id : Number(body.id);
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ success: false, error: "Solicitação inválida." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("solicitacoes_acesso")
    .update({ status: "Recusada" })
    .eq("id", id)
    .eq("status", "Pendente")
    .select("id,email")
    .maybeSingle();

  if (error || !data) {
    return Response.json({ success: false, error: "Solicitação não encontrada ou já finalizada." }, { status: 409 });
  }

  await registrarAuditoria({
    usuarioEmail: usuario.email,
    usuarioId: usuario.id,
    acao: "SOLICITACAO_RECUSADA",
    modulo: "solicitacoes_acesso",
    detalhes: { solicitacaoId: data.id, email: data.email },
  });

  return Response.json({ success: true });
}
