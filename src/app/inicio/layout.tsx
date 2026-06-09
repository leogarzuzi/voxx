"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";

type UsuarioSistema = {
  nome: string;
  nome_exibicao: string | null;
  perfil: string;
  avatar: string | null;
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [verificando, setVerificando] = useState(true);
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [perfil, setPerfil] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [menuAberto, setMenuAberto] = useState(false);
  const [modalSenhaAberto, setModalSenhaAberto] = useState(false); // controla o modal de senha
  const [senhaAtual, setSenhaAtual] = useState(""); // senha atual digitada
  const [novaSenha, setNovaSenha] = useState(""); // nova senha
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState(""); // confirmação da nova senha
  const [salvandoSenha, setSalvandoSenha] = useState(false); // loading do botão
  const [mensagemSenha, setMensagemSenha] = useState(""); // mensagem do modal

  useEffect(() => {
    async function verificarAcesso() {
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session?.user?.email) {
        router.push("/login");
        return;
      }

      const email = sessionData.session.user.email;

      const { data: usuario, error } = await supabase
        .from("usuarios")
        .select("nome, nome_exibicao, perfil, avatar")
        .eq("email", email)
        .single<UsuarioSistema>();

      if (error || !usuario) {
        router.push("/login");
        return;
      }

      const rotaSolicitacoes = pathname.startsWith("/inicio/solicitacoes");

      if (rotaSolicitacoes && usuario.perfil !== "Admin") {
        router.push("/inicio");
        return;
      }

      setNomeUsuario(
        usuario.nome_exibicao?.trim() ||
          usuario.nome?.trim().split(" ")[0] ||
          "Usuário"
      );

      setPerfil(usuario.perfil);
      setAvatar(usuario.avatar);
      setVerificando(false);
    }

    verificarAcesso();
  }, [router, pathname]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (verificando) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Verificando acesso...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="relative min-h-screen flex-1">
        <div className="fixed top-4 right-4 z-50">
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuAberto(!menuAberto)}
              className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-md border border-gray-200 hover:bg-gray-50 transition"
            >
              {avatar ? (
                <img
                  src={`/avatars/${avatar}.png`}
                  alt="Avatar"
                  className="h-7 w-7 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                  {nomeUsuario.charAt(0).toUpperCase()}
                </div>
              )}

              <span>{nomeUsuario}</span>
              <span className="text-gray-500">⌄</span>
            </button>

            {menuAberto && (
              <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white shadow-xl border border-gray-100 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-800">
                    {nomeUsuario}
                  </p>
                  <p className="text-xs text-gray-400">{perfil}</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMenuAberto(false);
                    router.push("/inicio/perfil");
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  Perfil
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuAberto(false);
                    setModalSenhaAberto(true); // abre o modal de alterar senha
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  Alterar senha
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 font-medium"
                >
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
        {modalSenhaAberto && (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
    <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl border border-gray-100">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            Alterar senha
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Informe sua senha atual e cadastre uma nova senha.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalSenhaAberto(false)}
          className="rounded-full px-3 py-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          ×
        </button>
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Senha atual
          </label>
          <input
            type="password"
            placeholder="Digite sua senha atual"
            value={senhaAtual}
            onChange={(e) => setSenhaAtual(e.target.value)}
            className="w-full h-11 px-4 rounded-xl border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nova senha
          </label>
          <input
            type="password"
            placeholder="Digite a nova senha"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            className="w-full h-11 px-4 rounded-xl border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirmar nova senha
          </label>
          <input
            type="password"
            placeholder="Digite novamente a nova senha"
            value={confirmarNovaSenha}
            onChange={(e) => setConfirmarNovaSenha(e.target.value)}
            className="w-full h-11 px-4 rounded-xl border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <button
          type="button"
          className="w-full h-11 rounded-xl bg-blue-700 text-white font-semibold shadow-lg shadow-blue-200 transition hover:bg-blue-800 active:scale-[0.98]"
        >
          Salvar nova senha
        </button>
      </div>
    </div>
  </div>
)}

        {children}
      </div>
    </div>
  );
}