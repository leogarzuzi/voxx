import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { createSupabaseAdminClient } from "@/lib/perfisServer";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  MODULOS_PERFIL,
  assinaturaModulos,
  modulosDasPermissoes,
  normalizarNomePerfil,
  permissoesDosModulos,
} from "@/lib/modulosPerfis";
import type { PerfilConfig } from "@/lib/perfis";

export const dynamic = "force-dynamic";

type PerfilBanco = {
  id: string;
  nome: string;
  nome_normalizado: string;
  ativo: boolean;
  protegido: boolean;
  permissoes: PerfilConfig;
  criado_em: string;
  atualizado_em: string;
};

async function obterAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user?.email) return null;

  const email = auth.user.email.toLowerCase();
  const { data: usuario } = await supabase
    .from("usuarios")
    .select("id, email, perfil, status")
    .eq("email", email)
    .single();

  if (usuario?.perfil !== "Admin" || usuario.status !== "ativo") return null;

  return { authId: auth.user.id, email, usuarioId: usuario.id as string };
}

function validarModulos(valor: unknown) {
  if (!Array.isArray(valor)) return null;
  const idsValidos = new Set(MODULOS_PERFIL.map((modulo) => modulo.id));
  const modulos = [...new Set(valor.filter((item): item is string => typeof item === "string"))];
  return modulos.every((id) => idsValidos.has(id))
    ? modulos.filter((id) => id !== "perfis")
    : null;
}

async function listarComTotais() {
  const admin = createSupabaseAdminClient();
  const [{ data: perfis, error }, { data: usuarios }] = await Promise.all([
    admin.from("perfis_acesso").select("*").order("protegido", { ascending: false }).order("nome"),
    admin.from("usuarios").select("perfil"),
  ]);

  if (error) throw error;

  const totais = new Map<string, number>();
  for (const usuario of usuarios ?? []) {
    totais.set(usuario.perfil, (totais.get(usuario.perfil) ?? 0) + 1);
  }

  return ((perfis ?? []) as PerfilBanco[]).map((perfil) => ({
    ...perfil,
    modulos: modulosDasPermissoes(perfil.permissoes ?? {}),
    totalUsuarios: totais.get(perfil.nome) ?? 0,
  }));
}

async function encontrarPerfilEquivalente(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  modulos: string[],
  ignorarId?: string
) {
  const { data } = await admin.from("perfis_acesso").select("id, nome, permissoes");
  const assinatura = assinaturaModulos(modulos);

  return ((data ?? []) as Array<{ id: string; nome: string; permissoes: PerfilConfig }>).find(
    (perfil) =>
      perfil.id !== ignorarId &&
      assinaturaModulos(modulosDasPermissoes(perfil.permissoes ?? {})) === assinatura
  );
}

export async function GET() {
  const usuarioAdmin = await obterAdmin();
  if (!usuarioAdmin) {
    return Response.json({ success: false, error: "Sem permissão." }, { status: 403 });
  }

  try {
    return Response.json({ success: true, perfis: await listarComTotais() });
  } catch (error) {
    return Response.json(
      { success: false, error: `Não foi possível carregar os perfis: ${String(error)}` },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const usuarioAdmin = await obterAdmin();
  if (!usuarioAdmin) {
    return Response.json({ success: false, error: "Sem permissão." }, { status: 403 });
  }

  const body = await request.json();
  const nome = typeof body.nome === "string" ? body.nome.trim().replace(/\s+/g, " ") : "";
  const modulos = validarModulos(body.modulos);

  if (nome.length < 2 || nome.length > 60) {
    return Response.json({ success: false, error: "Informe um nome entre 2 e 60 caracteres." }, { status: 400 });
  }
  if (!modulos?.length) {
    return Response.json({ success: false, error: "Selecione pelo menos um módulo." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const nomeNormalizado = normalizarNomePerfil(nome);
  const { data: nomeExistente } = await admin
    .from("perfis_acesso")
    .select("nome")
    .eq("nome_normalizado", nomeNormalizado)
    .maybeSingle();

  if (nomeExistente) {
    return Response.json({ success: false, error: `Já existe o perfil “${nomeExistente.nome}”.` }, { status: 409 });
  }

  const equivalente = await encontrarPerfilEquivalente(admin, modulos);
  if (equivalente) {
    return Response.json(
      { success: false, error: `Essa combinação de módulos já pertence ao perfil “${equivalente.nome}”.` },
      { status: 409 }
    );
  }

  const { data: perfil, error } = await admin
    .from("perfis_acesso")
    .insert({
      nome,
      nome_normalizado: nomeNormalizado,
      ativo: true,
      protegido: false,
      permissoes: permissoesDosModulos(modulos),
    })
    .select("id, nome")
    .single();

  if (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }

  await registrarAuditoria({
    usuarioEmail: usuarioAdmin.email,
    usuarioId: usuarioAdmin.authId,
    acao: "PERFIL_CRIADO",
    modulo: "perfis",
    detalhes: { perfilId: perfil.id, nome: perfil.nome, modulos },
  });

  return Response.json({ success: true, perfil }, { status: 201 });
}

export async function PATCH(request: Request) {
  const usuarioAdmin = await obterAdmin();
  if (!usuarioAdmin) {
    return Response.json({ success: false, error: "Sem permissão." }, { status: 403 });
  }

  const body = await request.json();
  const id = typeof body.id === "string" ? body.id : "";
  const admin = createSupabaseAdminClient();
  const { data: atual } = await admin.from("perfis_acesso").select("*").eq("id", id).single<PerfilBanco>();

  if (!atual) {
    return Response.json({ success: false, error: "Perfil não encontrado." }, { status: 404 });
  }

  const nome = typeof body.nome === "string" ? body.nome.trim().replace(/\s+/g, " ") : atual.nome;
  const modulos = body.modulos === undefined ? modulosDasPermissoes(atual.permissoes) : validarModulos(body.modulos);
  const ativo = typeof body.ativo === "boolean" ? body.ativo : atual.ativo;

  if (atual.protegido && (nome !== atual.nome || !ativo)) {
    return Response.json({ success: false, error: "O perfil Admin não pode ser renomeado ou inativado." }, { status: 400 });
  }
  if (nome.length < 2 || nome.length > 60 || !modulos?.length) {
    return Response.json({ success: false, error: "Informe um nome válido e selecione ao menos um módulo." }, { status: 400 });
  }

  const modulosFinais = atual.protegido ? MODULOS_PERFIL.map((modulo) => modulo.id) : modulos;
  if ((!ativo && atual.ativo) || nome !== atual.nome) {
    const { count } = await admin.from("usuarios").select("id", { count: "exact", head: true }).eq("perfil", atual.nome);
    if ((count ?? 0) > 0) {
      const acao = nome !== atual.nome ? "renomear" : "inativar";
      return Response.json({ success: false, error: `Não é possível ${acao}: ${count} usuário(s) utilizam este perfil.` }, { status: 409 });
    }
  }

  const nomeNormalizado = normalizarNomePerfil(nome);
  const { data: nomeExistente } = await admin
    .from("perfis_acesso")
    .select("id, nome")
    .eq("nome_normalizado", nomeNormalizado)
    .neq("id", id)
    .maybeSingle();
  if (nomeExistente) {
    return Response.json({ success: false, error: `Já existe o perfil “${nomeExistente.nome}”.` }, { status: 409 });
  }

  const equivalente = await encontrarPerfilEquivalente(admin, modulosFinais, id);
  if (equivalente) {
    return Response.json({ success: false, error: `Essa combinação de módulos já pertence ao perfil “${equivalente.nome}”.` }, { status: 409 });
  }

  const { error } = await admin
    .from("perfis_acesso")
    .update({
      nome,
      nome_normalizado: nomeNormalizado,
      ativo,
      permissoes: permissoesDosModulos(modulosFinais),
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return Response.json({ success: false, error: error.message }, { status: 500 });

  await registrarAuditoria({
    usuarioEmail: usuarioAdmin.email,
    usuarioId: usuarioAdmin.authId,
    acao: "PERFIL_ALTERADO",
    modulo: "perfis",
    detalhes: { perfilId: id, nomeAnterior: atual.nome, nomeNovo: nome, ativoAnterior: atual.ativo, ativoNovo: ativo, modulos: modulosFinais },
  });

  return Response.json({ success: true });
}

export async function DELETE(request: Request) {
  const usuarioAdmin = await obterAdmin();
  if (!usuarioAdmin) {
    return Response.json({ success: false, error: "Sem permissão." }, { status: 403 });
  }

  const { id } = await request.json();
  const admin = createSupabaseAdminClient();
  const { data: perfil } = await admin.from("perfis_acesso").select("id, nome, protegido").eq("id", id).single();

  if (!perfil) return Response.json({ success: false, error: "Perfil não encontrado." }, { status: 404 });
  if (perfil.protegido) return Response.json({ success: false, error: "O perfil Admin não pode ser excluído." }, { status: 400 });

  const { count } = await admin.from("usuarios").select("id", { count: "exact", head: true }).eq("perfil", perfil.nome);
  if ((count ?? 0) > 0) {
    return Response.json({ success: false, error: `Este perfil possui ${count} usuário(s). Transfira-os antes de excluir.` }, { status: 409 });
  }

  const { error } = await admin.from("perfis_acesso").delete().eq("id", id);
  if (error) return Response.json({ success: false, error: error.message }, { status: 500 });

  await registrarAuditoria({
    usuarioEmail: usuarioAdmin.email,
    usuarioId: usuarioAdmin.authId,
    acao: "PERFIL_EXCLUIDO",
    modulo: "perfis",
    detalhes: { perfilId: id, nome: perfil.nome },
  });

  return Response.json({ success: true });
}
