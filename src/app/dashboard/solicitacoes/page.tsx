"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Solicitacao = {
  id: number;
  nome: string;
  email: string;
  status: string;
  perfil?: string | null;
  criado_em: string;
};

export default function SolicitacoesPage() {
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [solicitacaoSelecionada, setSolicitacaoSelecionada] = useState<number | null>(null);
  const [perfilSelecionado, setPerfilSelecionado] = useState("");

async function carregarSolicitacoes() {
  try {
    setLoading(true);

    const { data, error } = await supabase
      .from("solicitacoes_acesso")
      .select("*")
      .order("criado_em", { ascending: false });

    if (error) {
      console.error("Erro ao carregar solicitações:", error);
      alert("Erro ao carregar solicitações.");
      return;
    }

    setSolicitacoes(data || []);
  } catch (erro) {
    console.error("Erro inesperado:", erro);
    alert("Erro inesperado ao carregar solicitações.");
  } finally {
    setLoading(false);
  }
}
  async function recusarSolicitacao(id: number) {
    const { error } = await supabase
      .from("solicitacoes_acesso")
      .update({ status: "Recusada" })
      .eq("id", id);

    if (error) {
      alert("Erro ao recusar solicitação.");
      console.error(error);
      return;
    }

    carregarSolicitacoes();
  }

  async function aprovarSolicitacao() {
  if (!solicitacaoSelecionada || !perfilSelecionado) {
    return;
  }

  const response = await fetch("/api/aprovar-solicitacao", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      solicitacaoId: solicitacaoSelecionada,
      perfil: perfilSelecionado,
    }),
  });

  const resultado = await response.json();

  alert(JSON.stringify(resultado));

  setSolicitacaoSelecionada(null);
  setPerfilSelecionado("");
}
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-800">
        Solicitações de acesso
      </h1>

      <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-5 py-3 font-semibold">Nome</th>
              <th className="px-5 py-3 font-semibold">E-mail</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Perfil</th>
              <th className="px-5 py-3 font-semibold">Data</th>
              <th className="px-5 py-3 font-semibold text-right">Ações</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-center text-gray-500">
                  Carregando solicitações...
                </td>
              </tr>
            ) : solicitacoes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-center text-gray-500">
                  Nenhuma solicitação encontrada.
                </td>
              </tr>
            ) : (
              solicitacoes.map((item) => (
                <tr key={item.id} className="border-t border-gray-100">
                  <td className="px-5 py-4 font-medium text-gray-800">
                    {item.nome}
                  </td>

                  <td className="px-5 py-4 text-gray-600">
                    {item.email}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium border ${
                        item.status === "Pendente"
                          ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                          : item.status === "Recusada"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-green-50 text-green-700 border-green-200"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-gray-600">
                    {item.perfil ? item.perfil : "-"}
                  </td>

                  <td className="px-5 py-4 text-gray-500">
                    {new Date(item.criado_em).toLocaleDateString("pt-BR")}
                  </td>

                  <td className="px-5 py-4 text-right">
                    {item.status === "Pendente" ? (
                      <>
                        <button
                          onClick={() => {
                            setSolicitacaoSelecionada(item.id);
                            setPerfilSelecionado("");
                          }}
                          className="mr-2 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700"
                        >
                          Aprovar
                        </button>

                        <button
                          onClick={() => recusarSolicitacao(item.id)}
                          className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                        >
                          Recusar
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400">
                        Finalizada
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {solicitacaoSelecionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-gray-800">
              Aprovar solicitação
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Escolha o perfil do usuário.
            </p>

            <div className="mt-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Perfil
              </label>

              <select
                value={perfilSelecionado}
                onChange={(e) => setPerfilSelecionado(e.target.value)}
                className="w-full h-11 rounded-xl border border-gray-300 px-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione...</option>
                <option value="Admin">Admin</option>
                <option value="Gerente">Gerente</option>
              </select>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setSolicitacaoSelecionada(null);
                  setPerfilSelecionado("");
                }}
                className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={aprovarSolicitacao}
                disabled={!perfilSelecionado}
                className="flex-1 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}