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
      <section className="voxx-surface mt-6 overflow-hidden rounded-[26px]">
        <div className="flex flex-col gap-2 border-b border-[var(--voxx-border)] px-6 py-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--voxx-primary)]">
              Acessos
            </p>
            <h2 className="voxx-text-primary mt-1 text-xl font-bold">
              Usuários cadastrados
            </h2>
            <p className="voxx-text-muted mt-1 text-sm">
              Ajuste perfis e bloqueie acessos quando necessário.
            </p>
          </div>

          <div className="voxx-text-primary rounded-full border border-[var(--voxx-border)] bg-[var(--voxx-surface-soft)] px-4 py-2 text-sm font-semibold">
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
            <div className="voxx-text-muted rounded-2xl border border-[var(--voxx-border)] bg-[var(--voxx-surface-soft)] px-5 py-10 text-center text-sm">
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
                  className="grid items-center gap-3 rounded-2xl border border-[var(--voxx-border)] bg-[var(--voxx-surface-soft)] px-4 py-3 transition hover:border-[var(--voxx-border-strong)] hover:bg-[var(--voxx-surface-raised)] md:grid-cols-[minmax(150px,1.35fr)_105px_82px_112px_86px]"
                >
                  <div className="min-w-0">
                    <div className="mt-1 flex min-w-0 items-center gap-2">
                      <p className="voxx-text-primary truncate text-sm font-semibold">
                        {usuario.nome || "Sem nome"}
                      </p>

                      {usuarioAtual && (
                        <span className="voxx-text-muted shrink-0 rounded-full border border-[var(--voxx-border)] bg-[var(--voxx-surface-raised)] px-2 py-1 text-[11px] font-semibold">
                          Você
                        </span>
                      )}
                    </div>
                    <p
                      className="voxx-text-muted mt-1 truncate text-xs"
                      title={usuario.email}
                    >
                      {usuario.email}
                    </p>
                  </div>

                  <div>
                    <p className="voxx-text-muted text-[10px] font-bold uppercase tracking-[0.18em]">
                      Perfil
                    </p>
                    <select
                      value={usuario.perfil}
                      disabled={usuarioAtual || estaSalvando}
                      onChange={(e) =>
                        alterarPerfil(usuario.id, e.target.value)
                      }
                      className="voxx-field mt-1 h-9 w-full rounded-2xl px-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
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
                    <p className="voxx-text-muted text-[10px] font-bold uppercase tracking-[0.18em]">
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
                    <p className="voxx-text-muted text-[10px] font-bold uppercase tracking-[0.18em]">
                      Criado em
                    </p>
                    <p className="voxx-text-muted mt-1 text-sm">
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
                          ? "border border-red-500/60 bg-red-600 text-white hover:bg-red-500"
                          : "border border-emerald-500/60 bg-emerald-600 text-white hover:bg-emerald-500"
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
          className="fixed inset-0 z-[90] flex items-center justify-center bg-[var(--voxx-overlay)] px-4 backdrop-blur-[2px]"
          onMouseDown={() => setUsuarioParaInativar(null)}
        >
          <div
            className="voxx-surface-raised w-full max-w-md rounded-3xl p-6"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className={temaDia ? "rounded-2xl border border-red-200 bg-red-50 p-4" : "rounded-2xl border border-red-300/20 bg-red-400/10 p-4"}>
              <p className={temaDia ? "text-xs font-semibold uppercase tracking-[0.22em] text-red-700" : "text-xs font-semibold uppercase tracking-[0.22em] text-red-200"}>
                Confirmar inativação
              </p>
              <h3 className="voxx-text-primary mt-2 text-xl font-bold">
                Inativar usuário?
              </h3>
              <p className="voxx-text-muted mt-2 text-sm leading-6">
                O usuário{" "}
                <span className="voxx-text-primary font-semibold">
                  {usuarioParaInativar.email}
                </span>{" "}
                perderá o acesso ao sistema.
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setUsuarioParaInativar(null)}
                className="voxx-button-secondary flex-1 rounded-2xl px-4 py-2.5 text-sm font-semibold"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmarInativacao}
                disabled={salvandoId === usuarioParaInativar.id}
                className="flex-1 rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
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





