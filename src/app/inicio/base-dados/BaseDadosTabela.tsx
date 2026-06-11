"use client";

import { useEffect, useState } from "react";

type Colaborador = {
  id: number;
  pref: string | null;
  matricula: string | null;
  nome: string | null;
  cargo: string | null;
  carga_horaria: string | null;
  exercicio: string | null;
  cpf: string | null;
  pis: string | null;
  data_nascimento: string | null;
  email: string | null;
  observacao: string | null;
  created_at: string | null;
};

function texto(valor: string | number | null | undefined) {
  if (valor === null || valor === undefined || valor === "") {
    return "-";
  }

  return String(valor);
}

export default function BaseDadosTabela() {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [modoTodos, setModoTodos] = useState(false); // controla se carregou a base inteira

  async function buscarColaboradores(valorBusca?: string, carregarTodos = false) {
    setLoading(true);
    setErro("");

    const params = new URLSearchParams();
    const termoBusca = valorBusca ?? busca;

    if (termoBusca.trim()) {
      params.set("busca", termoBusca.trim());
    }

    // quando verdadeiro, a API busca todos os colaboradores em lotes
    if (carregarTodos) {
      params.set("todos", "1");
    }

    const url = params.toString()
      ? `/api/base-dados?${params.toString()}`
      : "/api/base-dados";

    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });

    const resultado = await response.json();

    if (!response.ok || !resultado.success) {
      setErro(resultado.error || "Erro ao carregar base de dados.");
      setColaboradores([]);
      setLoading(false);
      setModoTodos(false);
      return;
    }

    setColaboradores(resultado.colaboradores ?? []);
    setModoTodos(carregarTodos);
    setLoading(false);
  }

  // carrega os primeiros 100 registros ao abrir a página
  useEffect(() => {
    buscarColaboradores("");
  }, []);

  function handleBuscar(e: React.FormEvent) {
    e.preventDefault();

    // busca normal: retorna até 100 resultados
    buscarColaboradores(busca, false);
  }

  function limparBusca() {
    setBusca("");
    setModoTodos(false);
    buscarColaboradores("", false);
  }

  function carregarTodosColaboradores() {
    // carrega todos, respeitando a busca atual se tiver algo digitado
    buscarColaboradores(busca, true);
  }

  return (
    <section className="mt-8 rounded-xl border bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            Colaboradores
          </h2>
        </div>

        <form onSubmit={handleBuscar} className="flex w-full gap-3 lg:w-auto">
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, matrícula, CPF, cargo ou e-mail"
            className="h-10 w-full rounded-xl border border-gray-300 px-4 text-sm text-gray-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 lg:w-96"
          />

          <button
            type="submit"
            disabled={loading}
            className="h-10 rounded-xl bg-blue-700 px-5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Buscar
          </button>

          <button
            type="button"
            onClick={limparBusca}
            disabled={loading}
            className="h-10 rounded-xl border px-5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Limpar
          </button>
        </form>
      </div>

      {erro && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {erro}
        </div>
      )}

      {loading ? (
        <div className="py-10 text-center text-sm text-gray-500">
          Carregando base de dados...
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                {colaboradores.length} resultado
                {colaboradores.length === 1 ? "" : "s"}
              </span>

              {modoTodos ? (
                <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                  Base completa carregada
                </span>
              ) : (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  Exibindo até 100 registros
                </span>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={carregarTodosColaboradores}
                disabled={loading}
                className="rounded-xl border px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Carregar todos
              </button>

              <button
                type="button"
                disabled
                className="rounded-xl border border-dashed px-4 py-2 text-sm font-semibold text-gray-400"
                title="Próxima etapa"
              >
                + Filtro
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100">
                <tr className="border-b text-gray-600">
                  <th className="whitespace-nowrap px-4 py-3">Pref.</th>
                  <th className="whitespace-nowrap px-4 py-3">Matrícula</th>
                  <th className="whitespace-nowrap px-4 py-3">Nome</th>
                  <th className="whitespace-nowrap px-4 py-3">Cargo/Função</th>
                  <th className="whitespace-nowrap px-4 py-3">CH</th>
                  <th className="whitespace-nowrap px-4 py-3">Exercício</th>
                  <th className="whitespace-nowrap px-4 py-3">CPF</th>
                  <th className="whitespace-nowrap px-4 py-3">PIS</th>
                  <th className="whitespace-nowrap px-4 py-3">
                    Data nasc.
                  </th>
                  <th className="whitespace-nowrap px-4 py-3">E-mail</th>
                  <th className="whitespace-nowrap px-4 py-3">Observação</th>
                </tr>
              </thead>

              <tbody>
                {colaboradores.map((colaborador) => (
                  <tr
                    key={colaborador.id}
                    className="border-b align-top hover:bg-slate-50"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                      {texto(colaborador.pref)}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-800">
                      {texto(colaborador.matricula)}
                    </td>

                    <td className="min-w-64 px-4 py-3 font-semibold text-gray-800">
                      {texto(colaborador.nome)}
                    </td>

                    <td className="min-w-56 px-4 py-3 text-gray-700">
                      {texto(colaborador.cargo)}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                      {texto(colaborador.carga_horaria)}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                      {texto(colaborador.exercicio)}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                      {texto(colaborador.cpf)}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                      {texto(colaborador.pis)}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                      {texto(colaborador.data_nascimento)}
                    </td>

                    <td className="min-w-64 px-4 py-3 text-gray-700">
                      {texto(colaborador.email)}
                    </td>

                    <td className="min-w-64 px-4 py-3 text-gray-700">
                      {texto(colaborador.observacao)}
                    </td>
                  </tr>
                ))}

                {colaboradores.length === 0 && (
                  <tr>
                    <td
                      colSpan={11}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      Nenhum colaborador encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}