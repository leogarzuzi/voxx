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

export default function UsuariosTabela({
  usuariosIniciais,
  emailLogado,
}: UsuariosTabelaProps) {
  const [usuarios, setUsuarios] = useState<Usuario[]>(usuariosIniciais);
  const [salvandoId, setSalvandoId] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState("");

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

    // atualiza a tabela na tela sem precisar recarregar a página
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

  async function alterarStatus(usuario: Usuario) {
    const novoStatus = usuario.status === "ativo" ? "inativo" : "ativo";

    // confirmação extra antes de inativar alguém
    if (novoStatus === "inativo") {
      const confirmou = window.confirm(
        `Tem certeza que deseja inativar o usuário ${usuario.email}?`
      );

      if (!confirmou) return;
    }

    await atualizarUsuario({
      usuarioId: usuario.id,
      status: novoStatus,
    });
  }

  return (
    <section className="mt-8 rounded-xl border bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">
          Usuários cadastrados
        </h2>

        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          {usuarios.length} usuários
        </span>
      </div>

      {mensagem && (
        <div
          className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
            mensagem.includes("sucesso")
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {mensagem}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b text-gray-500">
              <th className="py-3">Nome</th>
              <th className="py-3">E-mail</th>
              <th className="py-3">Perfil</th>
              <th className="py-3">Status</th>
              <th className="py-3">Criado em</th>
              <th className="py-3 text-right">Ações</th>
            </tr>
          </thead>

          <tbody>
            {usuarios.map((usuario) => {
              const usuarioAtual =
                usuario.email.toLowerCase() === emailLogado.toLowerCase();

              const estaSalvando = salvandoId === usuario.id;

              return (
                <tr key={usuario.id} className="border-b align-middle">
                  <td className="py-4 font-medium text-gray-800">
                    <div className="flex items-center gap-2">
                      <span>{usuario.nome || "Sem nome"}</span>

                      {usuarioAtual && (
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                          Você
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-4 text-gray-700">{usuario.email}</td>

                  <td className="py-4">
                    <select
                      value={usuario.perfil}
                      disabled={usuarioAtual || estaSalvando}
                      onChange={(e) =>
                        alterarPerfil(usuario.id, e.target.value)
                      }
                      className="h-9 rounded-lg border px-3 text-sm disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      <option value="Admin">Admin</option>
                      <option value="Gerente">Gerente</option>
                    </select>
                  </td>

                  <td className="py-4">
                    {usuario.status === "ativo" ? (
                      <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                        Ativo
                      </span>
                    ) : (
                      <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                        Inativo
                      </span>
                    )}
                  </td>

                  <td className="py-4 text-gray-700">
                    {usuario.criado_em
                      ? new Date(usuario.criado_em).toLocaleString("pt-BR")
                      : "-"}
                  </td>

                  <td className="py-4 text-right">
                    <button
                      type="button"
                      disabled={usuarioAtual || estaSalvando}
                      onClick={() => alterarStatus(usuario)}
                      className={`rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        usuario.status === "ativo"
                          ? "bg-red-50 text-red-700 hover:bg-red-100"
                          : "bg-green-50 text-green-700 hover:bg-green-100"
                      }`}
                    >
                      {estaSalvando
                        ? "Salvando..."
                        : usuario.status === "ativo"
                        ? "Inativar"
                        : "Reativar"}
                    </button>
                  </td>
                </tr>
              );
            })}

            {usuarios.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-gray-500">
                  Nenhum usuário encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}