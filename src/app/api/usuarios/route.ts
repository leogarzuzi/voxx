import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { registrarAuditoria } from "@/lib/auditoria";

export const dynamic = "force-dynamic";

const PERFIS_PERMITIDOS = ["Admin", "Gerente"];
const STATUS_PERMITIDOS = ["ativo", "inativo"];

export async function PATCH(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    // busca o usuário logado no Supabase Auth
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return Response.json(
        { success: false, error: "Não autenticado." },
        { status: 401 }
      );
    }

    const emailAdmin = user.email.toLowerCase();

    // confere se quem está tentando alterar é Admin ativo
    const { data: usuarioLogado } = await supabase
      .from("usuarios")
      .select("id, nome, email, perfil, status")
      .eq("email", emailAdmin)
      .single();

    if (
      !usuarioLogado ||
      usuarioLogado.perfil !== "Admin" ||
      usuarioLogado.status !== "ativo"
    ) {
      return Response.json(
        { success: false, error: "Sem permissão." },
        { status: 403 }
      );
    }

    const body = await request.json();

    const usuarioId = body.usuarioId as string;
    const novoPerfil = body.perfil as string | undefined;
    const novoStatus = body.status as string | undefined;

    if (!usuarioId) {
      return Response.json(
        { success: false, error: "Usuário não informado." },
        { status: 400 }
      );
    }

    if (novoPerfil && !PERFIS_PERMITIDOS.includes(novoPerfil)) {
      return Response.json(
        { success: false, error: "Perfil inválido." },
        { status: 400 }
      );
    }

    if (novoStatus && !STATUS_PERMITIDOS.includes(novoStatus)) {
      return Response.json(
        { success: false, error: "Status inválido." },
        { status: 400 }
      );
    }

    // usa service role apenas no backend para alterar usuários
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // busca o usuário que será alterado
    const { data: usuarioAlvo, error: erroBusca } = await supabaseAdmin
      .from("usuarios")
      .select("id, nome, email, perfil, status")
      .eq("id", usuarioId)
      .single();

    if (erroBusca || !usuarioAlvo) {
      return Response.json(
        { success: false, error: "Usuário não encontrado." },
        { status: 404 }
      );
    }

    // impede o Admin de inativar ou rebaixar a si mesmo sem querer
    if (usuarioAlvo.email?.toLowerCase() === emailAdmin) {
      return Response.json(
        {
          success: false,
          error: "Você não pode alterar seu próprio perfil ou status por aqui.",
        },
        { status: 400 }
      );
    }

    const dadosParaAtualizar: {
      perfil?: string;
      status?: string;
    } = {};

    if (novoPerfil) {
      dadosParaAtualizar.perfil = novoPerfil;
    }

    if (novoStatus) {
      dadosParaAtualizar.status = novoStatus;
    }

    const { error: erroUpdate } = await supabaseAdmin
      .from("usuarios")
      .update(dadosParaAtualizar)
      .eq("id", usuarioId);

    if (erroUpdate) {
      return Response.json(
        { success: false, error: erroUpdate.message },
        { status: 500 }
      );
    }

    // registra a alteração na auditoria
    await registrarAuditoria({
      usuarioEmail: emailAdmin,
      usuarioId: user.id,
      acao: "ALTERACAO_USUARIO",
      modulo: "usuarios",
      detalhes: {
        usuarioAlterado: usuarioAlvo.email,
        nomeAlterado: usuarioAlvo.nome,
        perfilAnterior: usuarioAlvo.perfil,
        perfilNovo: novoPerfil || usuarioAlvo.perfil,
        statusAnterior: usuarioAlvo.status,
        statusNovo: novoStatus || usuarioAlvo.status,
      },
    });

    return Response.json({
      success: true,
      mensagem: "Usuário atualizado com sucesso.",
    });
  } catch (error) {
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}