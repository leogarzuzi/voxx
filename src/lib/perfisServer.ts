import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { PERFIS_CONFIG, type PerfilConfig, type Permissao } from "@/lib/perfis";

export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export async function carregarPermissoesPerfil(
  supabase: SupabaseClient,
  perfil: string | null | undefined
): Promise<PerfilConfig> {
  if (!perfil) return {};

  const { data, error } = await supabase
    .from("perfis_acesso")
    .select("permissoes, ativo")
    .eq("nome", perfil)
    .maybeSingle();

  if (!error && data) {
    return data.ativo ? ((data.permissoes ?? {}) as PerfilConfig) : {};
  }

  return PERFIS_CONFIG[perfil as keyof typeof PERFIS_CONFIG] ?? {};
}

export async function temPermissaoNoBanco(
  supabase: SupabaseClient,
  perfil: string | null | undefined,
  permissao: Permissao
) {
  const permissoes = await carregarPermissoesPerfil(supabase, perfil);
  return permissoes[permissao] === true;
}

export async function usuarioAtualTemPermissao(
  supabase: SupabaseClient,
  permissao: Permissao
) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user?.email) return false;

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("perfil, status")
    .eq("email", auth.user.email.toLowerCase())
    .single();

  return Boolean(
    usuario?.status === "ativo" &&
      (await temPermissaoNoBanco(supabase, usuario?.perfil, permissao))
  );
}
