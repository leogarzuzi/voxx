"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Solicitacao = {
  id: number;
  nome: string;
  email: string;
  status: string;
  criado_em: string;
};

export default function SolicitacoesPage() {
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);

  async function carregarSolicitacoes() {
    setLoading(true);

    const { data, error } = await supabase
      .from("solicitacoes_acesso")
      .select("*")
      .order("criado_em", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setSolicitacoes(data || []);
    setLoading(false);
  }

async function recusarSolicitacao(id: number) {
  const { error } = await supabase
    .from("solicitacoes_acesso")
    .update({ status: "recusada" })
    .eq("id", id);

  if (error) {
    alert("Erro ao recusar solicitação.");
    console.error(error);
    return;
  }

  carregarSolicitacoes();
}

  useEffect(() => {
    carregarSolicitacoes();
  }, []);

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
              <th className="px-5 py-3 font-semibold">Data</th>
              <th className="px-5 py-3 font-semibold text-right">Ações</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-6 text-center text-gray-500">
                  Carregando solicitações...
                </td>
              </tr>
            ) : solicitacoes.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-6 text-center text-gray-500">
                  Nenhuma solicitação encontrada.
                </td>
              </tr>
            ) : (
              solicitacoes.map((item) => (
                <tr key={item.id} className="border-t border-gray-100">
                  <td className="px-5 py-4 font-medium text-gray-800">
                    {item.nome}
                  </td>

                  <td className="px-5 py-4 text-gray-600">{item.email}</td>

                  <td className="px-5 py-4">
                    <span className="rounded-full bg-yellow-50 px-3 py-1 text-xs font-medium text-yellow-700 border border-yellow-200">
                      {item.status}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-gray-500">
                    {new Date(item.criado_em).toLocaleDateString("pt-BR")}
                  </td>

                  <td className="px-5 py-4 text-right">
                    <button className="mr-2 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700">
                      Aprovar
                    </button>

                    <button
                    onClick={() => recusarSolicitacao(item.id)}
                    className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                    >
                    Recusar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}