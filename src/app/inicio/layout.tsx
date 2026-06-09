"use client";

import { useEffect, useRef, useState } from "react";
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
  const menuRef = useRef<HTMLDivElement>(null); // referencia do menu do usuario
  const [modalSenhaAberto, setModalSenhaAberto] = useState(false); // controla o modal de senha
  const [senhaAtual, setSenhaAtual] = useState(""); // senha atual digitada
  const [novaSenha, setNovaSenha] = useState(""); // nova senha
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState(""); // confirmação da nova senha
  const [salvandoSenha, setSalvandoSenha] = useState(false); // loading do botão
  const [mensagemSenha, setMensagemSenha] = useState(""); // mensagem do modal
  const [emailUsuario, setEmailUsuario] = useState(""); // e-mail do usuário logado pra trocar a senha

  const [mostrarSenhaAtual, setMostrarSenhaAtual] = useState(false); // mostra/oculta senha atual
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false); // mostra/oculta nova senha
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false); // mostra/oculta confirmação



  useEffect(() => {
    async function verificarAcesso() {
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session?.user?.email) {
        router.push("/login");
        return;
      }

      const email = sessionData.session.user.email?.trim().toLowerCase();

      setEmailUsuario(email); // guarda o e-mail para validar senha atual

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
  // fecha menu ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setMenuAberto(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

    // fecha menu e modal com ESC
  useEffect(() => {
    function handleEsc(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuAberto(false);
        setModalSenhaAberto(false);
      }
    }

    document.addEventListener("keydown", handleEsc);

    return () => {
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

function IconeOlho({ aberto }: { aberto: boolean }) {
  return aberto ? (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  ) : (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none">
      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M2 12s3.5-6 10-6c2.1 0 3.9.6 5.4 1.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M21.8 12.6S18.4 18 12 18c-2 0-3.8-.5-5.2-1.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M9.9 9.9A3 3 0 0 0 14.1 14.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function RequisitoSenha({
  ok,
  texto,
}: {
  ok: boolean;
  texto: string;
}) {
  return (
    <div className={`text-xs ${ok ? "text-green-600" : "text-gray-400"}`}>
      {ok ? "✓" : "•"} {texto}
    </div>
  );
}

  // valida os campos antes de trocar a senha
async function handleAlterarSenha() {
  setMensagemSenha("");

  if (!senhaAtual.trim()) {
    setMensagemSenha("Informe sua senha atual.");
    return;
  }

  if (!novaSenha.trim()) {
    setMensagemSenha("Informe a nova senha.");
    return;
  }

  const temMinimo = novaSenha.length >= 8; // mínimo de caracteres
  const temMaiuscula = /[A-Z]/.test(novaSenha); // letra maiúscula
  const temNumero = /[0-9]/.test(novaSenha); // número
  const temEspecial = /[^A-Za-z0-9]/.test(novaSenha); // caractere especial

  if (!temMinimo || !temMaiuscula || !temNumero || !temEspecial) {
    setMensagemSenha(
      "A senha deve ter pelo menos 8 caracteres, 1 letra maiúscula, 1 número e 1 caractere especial."
    );
    return;
  }

  if (novaSenha !== confirmarNovaSenha) {
    setMensagemSenha("As senhas não coincidem.");
    return;
  }

  setSalvandoSenha(true); // inicia carregamento

  const { error: loginError } = await supabase.auth.signInWithPassword({
    email: emailUsuario,
    password: senhaAtual,
  }); // confere se a senha atual está certa

  if (loginError) {
    setSalvandoSenha(false);
    setMensagemSenha("Senha atual incorreta.");
    return;
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: novaSenha,
  }); // troca a senha

  setSalvandoSenha(false);

  if (updateError) {
    setMensagemSenha("Erro ao alterar senha. Tente novamente.");
    return;
  }

  setMensagemSenha("Senha alterada com sucesso.");

  setSenhaAtual(""); // limpa senha atual
  setNovaSenha(""); // limpa nova senha
  setConfirmarNovaSenha(""); // limpa confirmação

  setTimeout(() => {
    setModalSenhaAberto(false); // fecha modal
    setMensagemSenha(""); // limpa mensagem
  }, 1200);
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
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuAberto(!menuAberto)}
              className="flex items-center gap-3 rounded-full bg-white px-5 py-3 text-base font-semibold text-gray-700 shadow-md border border-gray-200 hover:bg-gray-50 transition"
            >
              {avatar ? (
                <img
                  src={`/avatars/${avatar}.png`}
                  alt="Avatar"
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                  {nomeUsuario.charAt(0).toUpperCase()}
                </div>
              )}

              <span>{nomeUsuario}</span>
              <svg
                className={`h-4 w-4 text-gray-500 transition ${
                  menuAberto ? "rotate-90" : ""
                }`}
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M9 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
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
          <div className="relative">
          <input
            type={mostrarSenhaAtual ? "text" : "password"}
            placeholder="Digite sua senha atual"
            value={senhaAtual}
            onChange={(e) => setSenhaAtual(e.target.value)}
            className="w-full h-11 px-4 pr-12 rounded-xl border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />

          <button
            type="button"
            onClick={() => setMostrarSenhaAtual(!mostrarSenhaAtual)}
            className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center text-gray-500 hover:text-gray-700"
          >
            <IconeOlho aberto={mostrarSenhaAtual} />
          </button>
        </div>

        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nova senha
          </label>
          <div className="relative">
          <input
            type={mostrarNovaSenha ? "text" : "password"}
            placeholder="Digite a nova senha"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            className="w-full h-11 px-4 pr-12 rounded-xl border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />

          <button
            type="button"
            onClick={() => setMostrarNovaSenha(!mostrarNovaSenha)}
            className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center text-gray-500 hover:text-gray-700"
          >
            <IconeOlho aberto={mostrarNovaSenha} />
          </button>
        </div>

        </div>
            
        <div className="mt-2 grid grid-cols-1 gap-1">
          <RequisitoSenha ok={novaSenha.length >= 8} texto="Mínimo de 8 caracteres" />
          <RequisitoSenha ok={/[A-Z]/.test(novaSenha)} texto="Uma letra maiúscula" />
          <RequisitoSenha ok={/[0-9]/.test(novaSenha)} texto="Um número" />
          <RequisitoSenha ok={/[^A-Za-z0-9]/.test(novaSenha)} texto="Um caractere especial" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirmar nova senha
          </label>
          <div className="relative">
        <input
          type={mostrarConfirmarSenha ? "text" : "password"}
          placeholder="Digite novamente a nova senha"
          value={confirmarNovaSenha}
          onChange={(e) => setConfirmarNovaSenha(e.target.value)}
          className="w-full h-11 px-4 pr-12 rounded-xl border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />

        <button
          type="button"
          onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
          className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center text-gray-500 hover:text-gray-700"
        >
          <IconeOlho aberto={mostrarConfirmarSenha} />
        </button>
      </div>
        </div>

        <button
          type="button"
          onClick={handleAlterarSenha}
          disabled={salvandoSenha}
          className="w-full h-11 rounded-xl bg-blue-700 text-white font-semibold shadow-lg shadow-blue-200 transition hover:bg-blue-800 active:scale-[0.98]"
        >
          {salvandoSenha ? "Salvando..." : "Salvar nova senha"}
        </button>
        {mensagemSenha && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-center">
            {mensagemSenha}
          </div>
        )}
      </div>
    </div>
  </div>
)}

        {children}
      </div>
    </div>
  );
}