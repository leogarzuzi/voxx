"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { PERFIS_CONFIG } from "@/lib/perfis";
import { useTema } from "@/contexts/TemaContext";

type UsuarioSistema = {
  nome: string;
  nome_exibicao: string | null;
  perfil: string;
  status: string; // verifica se esta ativo
  avatar: string | null;
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { temaDia } = useTema();

  const [verificando, setVerificando] = useState(true);
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [perfil, setPerfil] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null); // referencia do menu do usuario
  const [modalSenhaAberto, setModalSenhaAberto] = useState(false); // controla o modal de senha
  const [senhaAtual, setSenhaAtual] = useState(""); // senha atual digitada
  const [novaSenha, setNovaSenha] = useState(""); // nova senha
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState(""); // confirmaÃ§Ã£o da nova senha
  const [salvandoSenha, setSalvandoSenha] = useState(false); // loading do botÃ£o
  const [mensagemSenha, setMensagemSenha] = useState(""); // mensagem do modal
  const [emailUsuario, setEmailUsuario] = useState(""); // e-mail do usuÃ¡rio logado pra trocar a senha
  const [mostrarSenhaAtual, setMostrarSenhaAtual] = useState(false); // mostra/oculta senha atual
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false); // mostra/oculta nova senha
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false); // mostra/oculta confirmaÃ§Ã£o
  const [carregandoRota, setCarregandoRota] = useState(false); // loading ao trocar de mÃ³dulo



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
        .select("nome, nome_exibicao, perfil, status, avatar")
        .eq("email", email)
        .single<UsuarioSistema>();

      if (error || !usuario) {
        router.push("/login");
        return;
      }

      // bloqueia usuÃ¡rio inativo antes de carregar qualquer tela do sistema
      if (usuario.status !== "ativo") {
        await supabase.auth.signOut(); // encerra a sessÃ£o mesmo que o login ainda exista no Supabase Auth
        router.push("/login");
        return;
      }

      // rotas protegidas por perfil
      const rotaSolicitacoes = pathname.startsWith("/inicio/solicitacoes"); // somente Admin
      const rotaAuditoria = pathname.startsWith("/inicio/auditoria"); // somente Admin

      const permissoes =
        PERFIS_CONFIG[usuario.perfil as keyof typeof PERFIS_CONFIG]; // pega permissÃµes do perfil

      // bloqueia SolicitaÃ§Ãµes para quem nÃ£o tem permissÃ£o
      if (rotaSolicitacoes && !permissoes?.solicitacoes) {
        router.push("/inicio");
        return;
      }

      // bloqueia Auditoria para quem nÃ£o for Admin
      if (rotaAuditoria && usuario.perfil !== "Admin") {
        router.push("/inicio");
        return;
      }

      setNomeUsuario(
        usuario.nome_exibicao?.trim() ||
          usuario.nome?.trim().split(" ")[0] ||
          "UsuÃ¡rio"
      );

      setPerfil(usuario.perfil);
      setAvatar(usuario.avatar);
      setVerificando(false);
    }

    verificarAcesso();
  }, [router, pathname]);

  // remove o loading quando a nova rota terminar de carregar
  useEffect(() => {
    setCarregandoRota(false);
  }, [pathname]);

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
    <div className={`text-xs ${ok ? "text-emerald-300" : "text-slate-500"}`}>
      {ok ? "âœ“" : "â€¢"} {texto}
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

  const temMinimo = novaSenha.length >= 8; // mÃ­nimo de caracteres
  const temMaiuscula = /[A-Z]/.test(novaSenha); // letra maiÃºscula
  const temNumero = /[0-9]/.test(novaSenha); // nÃºmero
  const temEspecial = /[^A-Za-z0-9]/.test(novaSenha); // caractere especial

  if (!temMinimo || !temMaiuscula || !temNumero || !temEspecial) {
    setMensagemSenha(
      "A senha deve ter pelo menos 8 caracteres, 1 letra maiÃºscula, 1 nÃºmero e 1 caractere especial."
    );
    return;
  }

  if (novaSenha !== confirmarNovaSenha) {
    setMensagemSenha("As senhas nÃ£o coincidem.");
    return;
  }

  setSalvandoSenha(true); // inicia carregamento

  const { error: loginError } = await supabase.auth.signInWithPassword({
    email: emailUsuario,
    password: senhaAtual,
  }); // confere se a senha atual estÃ¡ certa

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
  setConfirmarNovaSenha(""); // limpa confirmaÃ§Ã£o

  setTimeout(() => {
    setModalSenhaAberto(false); // fecha modal
    setMensagemSenha(""); // limpa mensagem
  }, 1200);
}
  
  if (verificando) {
    return (
      <div className={temaDia ? "min-h-screen flex items-center justify-center bg-[#f4f7fb]" : "min-h-screen flex items-center justify-center bg-[#11141b]"}>
        <img
          src="/logo-simbolo.png"
          alt="VOXX"
          className="h-24 w-24 animate-pulse object-contain" // tamanho do logo
        />
      </div>
    );
  }

  return (
    <div className={temaDia ? "flex min-h-screen overflow-x-hidden bg-[#f4f7fb]" : "flex min-h-screen overflow-x-hidden bg-[#11141b]"}>
      <div className="sticky top-0 h-screen shrink-0">
        <Sidebar
          perfil={perfil}
          onNavigate={() => setCarregandoRota(true)}
        />
      </div>

      <div className={temaDia ? "relative min-h-screen min-w-0 flex-1 overflow-x-hidden bg-[#f4f7fb]" : "relative min-h-screen min-w-0 flex-1 overflow-x-hidden bg-[#11141b]"}>
        {/* loading visual ao trocar de mÃ³dulo */}
        {carregandoRota && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/20 backdrop-blur-[1.5px]">
            <img
              src="/logo-simbolo.png"
              alt="Carregando VOXX"
              className="h-20 w-20 animate-pulse object-contain drop-shadow-2xl"
            />
          </div>
        )}
        <div className="fixed right-4 top-4 z-50">
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuAberto(!menuAberto)}
              className="group flex items-center gap-3 rounded-full border border-white/10 bg-[#171a23]/90 px-3 py-2 text-sm font-semibold text-slate-100 shadow-[0_18px_50px_rgba(0,0,0,0.32)] backdrop-blur-xl transition hover:border-white/20 hover:bg-[#202532]"
            >
              {avatar ? (
                <img
                  src={`/avatars/${avatar}.png`}
                  alt="Avatar"
                  className="h-10 w-10 rounded-full object-cover ring-2 ring-white/10"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-400/15 text-sm font-bold text-blue-100 ring-1 ring-blue-300/25">
                  {nomeUsuario.charAt(0).toUpperCase()}
                </div>
              )}

              <span className="max-w-28 truncate">{nomeUsuario}</span>
              <svg
                className={`h-4 w-4 text-slate-400 transition group-hover:text-white ${
                  menuAberto ? "rotate-90 text-white" : ""
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
              <div className="absolute right-0 mt-3 w-64 overflow-hidden rounded-[24px] border border-white/10 bg-[#171a23]/95 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                <div className="border-b border-white/10 bg-white/[0.035] px-4 py-4">
                  <p className="text-sm font-semibold text-white">
                    {nomeUsuario}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">{perfil}</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMenuAberto(false);
                    router.push("/inicio/perfil");
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-slate-200 transition hover:bg-white/[0.07] hover:text-white"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-400/10 text-blue-200 ring-1 ring-blue-300/15">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <path d="M8 7a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z" stroke="currentColor" strokeWidth="2" />
                      <path d="M4 21a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </span>
                  Perfil
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuAberto(false);
                    setModalSenhaAberto(true); // abre o modal de alterar senha
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-slate-200 transition hover:bg-white/[0.07] hover:text-white"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-400/10 text-purple-200 ring-1 ring-purple-300/15">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <path d="M7 11V8a5 5 0 0 1 10 0v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <path d="M5 11h14v10H5V11Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                    </svg>
                  </span>
                  Alterar senha
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 border-t border-white/10 px-4 py-3 text-left text-sm font-semibold text-red-200 transition hover:bg-red-400/10 hover:text-red-100"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-400/10 text-red-200 ring-1 ring-red-300/15">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <path d="M10 17l5-5-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <path d="M21 3v18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </span>
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
        {modalSenhaAberto && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/65 px-4 backdrop-blur-sm"
            onMouseDown={() => setModalSenhaAberto(false)} // fecha clicando fora
          >
            <div
              className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#171a23] p-7 text-slate-100 shadow-[0_28px_90px_rgba(0,0,0,0.5)]"
              onMouseDown={(e) => e.stopPropagation()} // impede fechar clicando dentro
            >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
            SeguranÃ§a
          </p>
          <h2 className="mt-2 text-xl font-bold text-white">
            Alterar senha
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Informe sua senha atual e cadastre uma nova senha.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalSenhaAberto(false)}
          className="rounded-full px-3 py-1 text-slate-500 transition hover:bg-white/10 hover:text-white"
        >
          Ã—
        </button>
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">
            Senha atual
          </label>
          <div className="relative">
          <input
            type={mostrarSenhaAtual ? "text" : "password"}
            placeholder="Digite sua senha atual"
            value={senhaAtual}
            onChange={(e) => setSenhaAtual(e.target.value)}
            className="h-11 w-full rounded-xl border border-white/10 bg-[#202532] px-4 pr-12 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-blue-300/40 focus:ring-2 focus:ring-blue-300/15"
          />

          <button
            type="button"
            onClick={() => setMostrarSenhaAtual(!mostrarSenhaAtual)}
            className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center text-slate-500 transition hover:text-white"
          >
            <IconeOlho aberto={mostrarSenhaAtual} />
          </button>
        </div>

        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">
            Nova senha
          </label>
          <div className="relative">
          <input
            type={mostrarNovaSenha ? "text" : "password"}
            placeholder="Digite a nova senha"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            className="h-11 w-full rounded-xl border border-white/10 bg-[#202532] px-4 pr-12 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-blue-300/40 focus:ring-2 focus:ring-blue-300/15"
          />

          <button
            type="button"
            onClick={() => setMostrarNovaSenha(!mostrarNovaSenha)}
            className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center text-slate-500 transition hover:text-white"
          >
            <IconeOlho aberto={mostrarNovaSenha} />
          </button>
        </div>

        </div>
            
        <div className="mt-2 grid grid-cols-1 gap-1">
          <RequisitoSenha ok={novaSenha.length >= 8} texto="MÃ­nimo de 8 caracteres" />
          <RequisitoSenha ok={/[A-Z]/.test(novaSenha)} texto="Uma letra maiÃºscula" />
          <RequisitoSenha ok={/[0-9]/.test(novaSenha)} texto="Um nÃºmero" />
          <RequisitoSenha ok={/[^A-Za-z0-9]/.test(novaSenha)} texto="Um caractere especial" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">
            Confirmar nova senha
          </label>
          <div className="relative">
        <input
          type={mostrarConfirmarSenha ? "text" : "password"}
          placeholder="Digite novamente a nova senha"
          value={confirmarNovaSenha}
          onChange={(e) => setConfirmarNovaSenha(e.target.value)}
          className="h-11 w-full rounded-xl border border-white/10 bg-[#202532] px-4 pr-12 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-blue-300/40 focus:ring-2 focus:ring-blue-300/15"
        />

        <button
          type="button"
          onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
          className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center text-slate-500 transition hover:text-white"
        >
          <IconeOlho aberto={mostrarConfirmarSenha} />
        </button>
      </div>
        </div>

        <button
          type="button"
          onClick={handleAlterarSenha}
          disabled={salvandoSenha}
          className="h-11 w-full rounded-xl bg-white text-sm font-bold text-slate-950 shadow-[0_16px_40px_rgba(255,255,255,0.08)] transition hover:bg-slate-200 active:scale-[0.98] disabled:opacity-60"
        >
          {salvandoSenha ? "Salvando..." : "Salvar nova senha"}
        </button>
        {mensagemSenha && (
          <div className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-center text-sm text-slate-200">
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

