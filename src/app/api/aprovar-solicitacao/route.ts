import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

const PERFIS_PERMITIDOS = ["Admin", "Gerente"];

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
      .select("perfil")
      .eq("email", user.email.toLowerCase())
      .single();

    if (erroUsuarioLogado || usuarioLogado?.perfil !== "Admin") {
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

    if (!PERFIS_PERMITIDOS.includes(perfil)) {
      return NextResponse.json(
        { sucesso: false, mensagem: "Perfil inválido." },
        { status: 400 }
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

    const { data: solicitacao, error: erroSolicitacao } = await supabaseAdmin
      .from("solicitacoes_acesso")
      .select("id, nome, email, status")
      .eq("id", solicitacaoId)
      .single();

    if (erroSolicitacao || !solicitacao) {
      return NextResponse.json(
        { sucesso: false, mensagem: "Solicitação não encontrada." },
        { status: 404 }
      );
    }

    if (solicitacao.status !== "Pendente") {
      return NextResponse.json(
        { sucesso: false, mensagem: "Esta solicitação já foi finalizada." },
        { status: 400 }
      );
    }

    const emailNormalizado = solicitacao.email.trim().toLowerCase();

    const { error: erroConvite } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(emailNormalizado, {
        data: {
          nome: solicitacao.nome,
          perfil,
        },
        redirectTo: "https://voxx-beryl.vercel.app/definir-senha",
      });

    if (erroConvite) {
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
      .eq("id", solicitacaoId);

    if (erroUpdate) {
      return NextResponse.json(
        { sucesso: false, mensagem: erroUpdate.message },
        { status: 500 }
      );
    }

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