"use client";

import { useState } from "react";

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
};

function statusClass(status: string) {
  if (status === "ativo") {
    return "border-emerald-300/30 bg-emerald-300/12 text-emerald-100";
  }

  return "border-red-300/30 bg-red-400/12 text-red-100";
}

export default function UsuariosTabela({
  usuariosIniciais,
  emailLogado,
}: UsuariosTabelaProps) {
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
      <section className="mt-6 overflow-hidden rounded-[26px] border border-white/10 bg-[#171a23] shadow-[0_22px_70px_rgba(0,0,0,0.28)]">
        <div className="flex flex-col gap-2 border-b border-white/10 px-6 py-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Acessos
            </p>
            <h2 className="mt-1 text-xl font-bold text-white">
              Usuários cadastrados
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Ajuste perfis e bloqueie acessos quando necessário.
            </p>
          </div>

          <div className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-slate-200">
            {usuarios.length} usuário{usuarios.length === 1 ? "" : "s"}
          </div>
        </div>

        {mensagem && (
          <div
            className={`m-4 rounded-2xl border px-4 py-3 text-sm ${
              mensagem.includes("sucesso")
                ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-100"
                : "border-red-300/25 bg-red-400/10 text-red-100"
            }`}
          >
            {mensagem}
          </div>
        )}

        <div className="space-y-2 p-4">
          {usuarios.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-10 text-center text-sm text-slate-400">
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
                  className="grid items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 transition hover:border-white/20 hover:bg-white/[0.07] md:grid-cols-[minmax(150px,1.35fr)_105px_82px_112px_86px]"
                >
                  <div className="min-w-0">
                    <div className="mt-1 flex min-w-0 items-center gap-2">
                      <p className="truncate text-sm font-semibold text-white">
                        {usuario.nome || "Sem nome"}
                      </p>

                      {usuarioAtual && (
                        <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.08] px-2 py-1 text-[11px] font-semibold text-slate-200">
                          Você
                        </span>
                      )}
                    </div>
                    <p
                      className="mt-1 truncate text-xs text-slate-400"
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
                      className="mt-1 h-9 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-3 text-sm font-semibold text-slate-100 outline-none transition disabled:cursor-not-allowed disabled:opacity-50 focus:border-white/30 focus:ring-2 focus:ring-blue-300/10 [color-scheme:dark] [&>option]:bg-[#171a23] [&>option]:text-slate-100"
                    >
                      <option value="Admin">Admin</option>
                      <option value="Gerente">Gerente</option>
                    </select>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                      Status
                    </p>
                    <span
                      className={`mt-1 inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusClass(
                        usuario.status
                      )}`}
                    >
                      {usuario.status === "ativo" ? "Ativo" : "Inativo"}
                    </span>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                      Criado em
                    </p>
                    <p className="mt-1 text-sm text-slate-300">
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
                          ? "border border-red-300/30 bg-red-400/10 text-red-100 hover:bg-red-400/20"
                          : "border border-emerald-300/30 bg-emerald-300/10 text-emerald-100 hover:bg-emerald-300/20"
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
            className="w-full max-w-md rounded-3xl border border-white/10 bg-[#171a23] p-6 text-slate-100 shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="rounded-2xl border border-red-300/20 bg-red-400/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-200">
                Confirmar inativação
              </p>
              <h3 className="mt-2 text-xl font-bold text-white">
                Inativar usuário?
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                O usuário{" "}
                <span className="font-semibold text-white">
                  {usuarioParaInativar.email}
                </span>{" "}
                perderá o acesso ao sistema.
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setUsuarioParaInativar(null)}
                className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08]"
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
