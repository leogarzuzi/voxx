"use client";

import { useState } from "react";
import { useTema } from "@/contexts/TemaContext";

type Usuario = {
  id: string;
  nome: string | null;
  email: string;
  perfil: string;
  status: string;
  criado_em: string | null;
};

type UsuariosTabelaProps = {
  usuariosIniciais: Usuario[];
  emailLogado: string;
  perfisDisponiveis: string[];
};

function statusClass(status: string, temaDia: boolean) {
  if (status === "ativo") {
    return temaDia ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-emerald-300/30 bg-emerald-300/12 text-emerald-100";
  }

  return temaDia ? "border-red-200 bg-red-50 text-red-700" : "border-red-300/30 bg-red-400/12 text-red-100";
}

export default function UsuariosTabela({
  usuariosIniciais,
  emailLogado,
  perfisDisponiveis,
}: UsuariosTabelaProps) {
  const { temaDia } = useTema();
  const [usuarios, setUsuarios] = useState<Usuario[]>(usuariosIniciais);
  const [salvandoId, setSalvandoId] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState("");
  const [usuarioParaInativar, setUsuarioParaInativar] =
    useState<Usuario | null>(null);

  async function atualizarUsuario({
    usuarioId,
    perfil,
    status,
  }: {
    usuarioId: string;
    perfil?: string;
    status?: string;
  }) {
    setMensagem("");
    setSalvandoId(usuarioId);

    const response = await fetch("/api/usuarios", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        usuarioId,
        perfil,
        status,
      }),
    });

    const resultado = await response.json();

    setSalvandoId(null);

    if (!response.ok || !resultado.success) {
      setMensagem(resultado.error || "Erro ao atualizar usuário.");
      return false;
    }

    setUsuarios((usuariosAtuais) =>
      usuariosAtuais.map((usuario) => {
        if (usuario.id !== usuarioId) return usuario;

        return {
          ...usuario,
          perfil: perfil || usuario.perfil,
          status: status || usuario.status,
        };
      })
    );

    setMensagem("Usuário atualizado com sucesso.");
    return true;
  }

  async function alterarPerfil(usuarioId: string, novoPerfil: string) {
    await atualizarUsuario({
      usuarioId,
      perfil: novoPerfil,
    });
  }

  async function confirmarInativacao() {
    if (!usuarioParaInativar) return;

    await atualizarUsuario({
      usuarioId: usuarioParaInativar.id,
      status: "inativo",
    });

    setUsuarioParaInativar(null);
  }

  async function alterarStatus(usuario: Usuario) {
    const novoStatus = usuario.status === "ativo" ? "inativo" : "ativo";

    if (novoStatus === "inativo") {
      setUsuarioParaInativar(usuario);
      return;
    }

    await atualizarUsuario({
      usuarioId: usuario.id,
      status: novoStatus,
    });
  }

  return (
    <>
      <section className={temaDia ? "mt-6 overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.08)]" : "mt-6 overflow-hidden rounded-[26px] border border-white/10 bg-[#171a23] shadow-[0_22px_70px_rgba(0,0,0,0.28)]"}>
        <div className={temaDia ? "flex flex-col gap-2 border-b border-slate-200 px-6 py-5 md:flex-row md:items-end md:justify-between" : "flex flex-col gap-2 border-b border-white/10 px-6 py-5 md:flex-row md:items-end md:justify-between"}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Acessos
            </p>
            <h2 className={temaDia ? "mt-1 text-xl font-bold text-slate-950" : "mt-1 text-xl font-bold text-white"}>
              Usuários cadastrados
            </h2>
            <p className={temaDia ? "mt-1 text-sm text-slate-500" : "mt-1 text-sm text-slate-400"}>
              Ajuste perfis e bloqueie acessos quando necessário.
            </p>
          </div>

          <div className={temaDia ? "rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700" : "rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-slate-200"}>
            {usuarios.length} usuário{usuarios.length === 1 ? "" : "s"}
          </div>
        </div>

        {mensagem && (
          <div
            className={`m-4 rounded-2xl border px-4 py-3 text-sm ${
              mensagem.includes("sucesso")
                ? temaDia
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-emerald-300/25 bg-emerald-300/10 text-emerald-100"
                : temaDia
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-red-300/25 bg-red-400/10 text-red-100"
            }`}
          >
            {mensagem}
          </div>
        )}

        <div className="space-y-2 p-4">
          {usuarios.length === 0 ? (
            <div className={temaDia ? "rounded-2xl border border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500" : "rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-10 text-center text-sm text-slate-400"}>
              Nenhum usuário encontrado.
            </div>
          ) : (
            usuarios.map((usuario) => {
              const usuarioAtual =
                usuario.email.toLowerCase() === emailLogado.toLowerCase();
              const estaSalvando = salvandoId === usuario.id;

              return (
                <article
                  key={usuario.id}
                  className={temaDia ? "grid items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_10px_26px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:bg-slate-50 md:grid-cols-[minmax(150px,1.35fr)_105px_82px_112px_86px]" : "grid items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 transition hover:border-white/20 hover:bg-white/[0.07] md:grid-cols-[minmax(150px,1.35fr)_105px_82px_112px_86px]"}
                >
                  <div className="min-w-0">
                    <div className="mt-1 flex min-w-0 items-center gap-2">
                      <p className={temaDia ? "truncate text-sm font-semibold text-slate-950" : "truncate text-sm font-semibold text-white"}>
                        {usuario.nome || "Sem nome"}
                      </p>

                      {usuarioAtual && (
                        <span className={temaDia ? "shrink-0 rounded-full border border-slate-200 bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600" : "shrink-0 rounded-full border border-white/10 bg-white/[0.08] px-2 py-1 text-[11px] font-semibold text-slate-200"}>
                          Você
                        </span>
                      )}
                    </div>
                    <p
                      className={temaDia ? "mt-1 truncate text-xs text-slate-500" : "mt-1 truncate text-xs text-slate-400"}
                      title={usuario.email}
                    >
                      {usuario.email}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                      Perfil
                    </p>
                    <select
                      value={usuario.perfil}
                      disabled={usuarioAtual || estaSalvando}
                      onChange={(e) =>
                        alterarPerfil(usuario.id, e.target.value)
                      }
                      className={temaDia ? "mt-1 h-9 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition disabled:cursor-not-allowed disabled:opacity-50 focus:border-slate-400 focus:ring-2 focus:ring-slate-200" : "mt-1 h-9 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-3 text-sm font-semibold text-slate-100 outline-none transition disabled:cursor-not-allowed disabled:opacity-50 focus:border-white/30 focus:ring-2 focus:ring-blue-300/10 [color-scheme:dark] [&>option]:bg-[#171a23] [&>option]:text-slate-100"}
                    >
                      {!perfisDisponiveis.includes(usuario.perfil) && (
                        <option value={usuario.perfil}>{usuario.perfil}</option>
                      )}
                      {perfisDisponiveis.map((perfilDisponivel) => (
                        <option key={perfilDisponivel} value={perfilDisponivel}>
                          {perfilDisponivel}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                      Status
                    </p>
                    <span
                      className={`mt-1 inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusClass(
                        usuario.status,
                        temaDia
                      )}`}
                    >
                      {usuario.status === "ativo" ? "Ativo" : "Inativo"}
                    </span>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                      Criado em
                    </p>
                    <p className={temaDia ? "mt-1 text-sm text-slate-600" : "mt-1 text-sm text-slate-300"}>
                      {usuario.criado_em
                        ? new Date(usuario.criado_em).toLocaleString("pt-BR")
                        : "-"}
                    </p>
                  </div>

                  <div className="flex items-center justify-start md:justify-end">
                    <button
                      type="button"
                      disabled={usuarioAtual || estaSalvando}
                      onClick={() => alterarStatus(usuario)}
                      className={`h-9 rounded-2xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 ${
                        usuario.status === "ativo"
                          ? (temaDia ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100" : "border border-red-300/30 bg-red-400/10 text-red-100 hover:bg-red-400/20")
                          : (temaDia ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "border border-emerald-300/30 bg-emerald-300/10 text-emerald-100 hover:bg-emerald-300/20")
                      }`}
                    >
                      {estaSalvando
                        ? "Salvando..."
                        : usuario.status === "ativo"
                        ? "Inativar"
                        : "Reativar"}
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      {usuarioParaInativar && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/55 px-4 backdrop-blur-[2px]"
          onMouseDown={() => setUsuarioParaInativar(null)}
        >
          <div
            className={temaDia ? "w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl" : "w-full max-w-md rounded-3xl border border-white/10 bg-[#171a23] p-6 text-slate-100 shadow-2xl"}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className={temaDia ? "rounded-2xl border border-red-200 bg-red-50 p-4" : "rounded-2xl border border-red-300/20 bg-red-400/10 p-4"}>
              <p className={temaDia ? "text-xs font-semibold uppercase tracking-[0.22em] text-red-700" : "text-xs font-semibold uppercase tracking-[0.22em] text-red-200"}>
                Confirmar inativação
              </p>
              <h3 className={temaDia ? "mt-2 text-xl font-bold text-slate-950" : "mt-2 text-xl font-bold text-white"}>
                Inativar usuário?
              </h3>
              <p className={temaDia ? "mt-2 text-sm leading-6 text-slate-600" : "mt-2 text-sm leading-6 text-slate-300"}>
                O usuário{" "}
                <span className={temaDia ? "font-semibold text-slate-950" : "font-semibold text-white"}>
                  {usuarioParaInativar.email}
                </span>{" "}
                perderá o acesso ao sistema.
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setUsuarioParaInativar(null)}
                className={temaDia ? "flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100" : "flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08]"}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmarInativacao}
                disabled={salvandoId === usuarioParaInativar.id}
                className="flex-1 rounded-2xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {salvandoId === usuarioParaInativar.id
                  ? "Salvando..."
                  : "Inativar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}





