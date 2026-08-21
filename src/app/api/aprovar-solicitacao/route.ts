import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { registrarAuditoria } from "@/lib/auditoria";
import { PERMISSOES } from "@/lib/perfis";
import { temPermissaoNoBanco } from "@/lib/perfisServer";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json(
        { sucesso: false, mensagem: "Não autenticado." },
        { status: 401 }
      );
    }

    const { data: usuarioLogado, error: erroUsuarioLogado } = await supabase
      .from("usuarios")
      .select("perfil, status")
      .eq("email", user.email.toLowerCase())
      .single();

    if (
      erroUsuarioLogado ||
      !usuarioLogado ||
      usuarioLogado.status !== "ativo" ||
      !(await temPermissaoNoBanco(supabase, usuarioLogado.perfil, PERMISSOES.SOLICITACOES))
    ) {
      return NextResponse.json(
        { sucesso: false, mensagem: "Sem permissão." },
        { status: 403 }
      );
    }

    const { solicitacaoId, perfil } = await request.json();

    if (!solicitacaoId || !perfil) {
      return NextResponse.json(
        { sucesso: false, mensagem: "Dados incompletos." },
        { status: 400 }
      );
    }

    if (perfil === "Admin" && usuarioLogado.perfil !== "Admin") {
      return NextResponse.json(
        { sucesso: false, mensagem: "Somente um Admin pode conceder o perfil Admin." },
        { status: 403 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { sucesso: false, mensagem: "Variáveis do Supabase não configuradas." },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data: perfilValido, error: erroPerfis } = await supabaseAdmin
      .from("perfis_acesso")
      .select("nome")
      .eq("nome", perfil)
      .eq("ativo", true)
      .maybeSingle();
    const fallbackValido = ["Admin", "Gerente"].includes(perfil);
    if ((!perfilValido && !erroPerfis) || (erroPerfis && !fallbackValido)) {
      return NextResponse.json(
        { sucesso: false, mensagem: "Perfil inválido ou inativo." },
        { status: 400 }
      );
    }

    const { data: solicitacao, error: erroSolicitacao } = await supabaseAdmin
      .from("solicitacoes_acesso")
      .update({ status: "Processando", perfil })
      .eq("id", solicitacaoId)
      .eq("status", "Pendente")
      .select("id, nome, email, status")
      .maybeSingle();

    if (erroSolicitacao) {
      return NextResponse.json(
        { sucesso: false, mensagem: "Não foi possível iniciar a aprovação." },
        { status: 500 }
      );
    }

    if (!solicitacao) {
      return NextResponse.json(
        {
          sucesso: false,
          mensagem: "Esta solicitação já está sendo processada ou foi finalizada.",
        },
        { status: 409 }
      );
    }

    async function liberarSolicitacao() {
      const { error } = await supabaseAdmin
        .from("solicitacoes_acesso")
        .update({ status: "Pendente", perfil: null })
        .eq("id", solicitacaoId)
        .eq("status", "Processando");

      if (error) console.error("Não foi possível liberar a solicitação:", error);
    }

    const emailNormalizado = solicitacao.email.trim().toLowerCase();

    const { data: convite, error: erroConvite } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(emailNormalizado, {
        data: {
          nome: solicitacao.nome,
          perfil,
        },
        redirectTo: "https://voxx-beryl.vercel.app/definir-senha",
      });

    if (erroConvite) {
      await liberarSolicitacao();
      return NextResponse.json(
        { sucesso: false, mensagem: erroConvite.message },
        { status: 500 }
      );
    }

    const { error: erroUsuario } = await supabaseAdmin.from("usuarios").insert({
      nome: solicitacao.nome,
      email: emailNormalizado,
      perfil,
    });

    if (erroUsuario) {
      if (convite.user?.id) {
        const { error: erroRollbackAuth } = await supabaseAdmin.auth.admin.deleteUser(
          convite.user.id
        );
        if (erroRollbackAuth) {
          console.error("Não foi possível desfazer o convite:", erroRollbackAuth);
        }
      }
      await liberarSolicitacao();
      return NextResponse.json(
        { sucesso: false, mensagem: erroUsuario.message },
        { status: 500 }
      );
    }

    const { error: erroUpdate } = await supabaseAdmin
      .from("solicitacoes_acesso")
      .update({
        status: "Aprovada",
        perfil,
      })
      .eq("id", solicitacaoId)
      .eq("status", "Processando");

    if (erroUpdate) {
      return NextResponse.json(
        { sucesso: false, mensagem: erroUpdate.message },
        { status: 500 }
      );
    }

    await registrarAuditoria({
      usuarioEmail: user.email,
      usuarioId: user.id,
      acao: "APROVACAO_ACESSO",
      modulo: "solicitacoes_acesso",
      detalhes: {
        solicitacaoId,
        nomeAprovado: solicitacao.nome,
        emailAprovado: emailNormalizado,
        perfilConcedido: perfil,
      },
    });

    return NextResponse.json({
      sucesso: true,
      mensagem: "Solicitação aprovada e convite enviado por e-mail.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { sucesso: false, mensagem: "Erro inesperado ao aprovar solicitação." },
      { status: 500 }
    );
  }
}
