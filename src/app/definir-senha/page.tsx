"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function DefinirSenhaPage() {
  const router = useRouter();

  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificando, setVerificando] = useState(true);
  const [mensagem, setMensagem] = useState("");

    useEffect(() => {
      console.log("URL:", window.location.href);
      console.log("HASH:", window.location.hash);

      async function verificarSessao() {
        await new Promise((resolve) => setTimeout(resolve, 800));

        const { data } = await supabase.auth.getSession();

        console.log("SESSION:", data.session);

        if (!data.session) {
          router.replace("/login");
          return;
        }

        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const type = hashParams.get("type");

        console.log("TYPE:", type);

        if (type !== "invite" && type !== "recovery") {
          router.replace("/dashboard");
          return;
        }

        setVerificando(false);
      }

      verificarSessao();
    }, [router]);
  async function handleDefinirSenha(e: React.FormEvent) {
    e.preventDefault();

    setMensagem("");

    if (!senha || !confirmarSenha) {
      setMensagem("Preencha todos os campos.");
      return;
    }

    if (senha !== confirmarSenha) {
      setMensagem("As senhas não coincidem.");
      return;
    }

    if (senha.length < 6) {
      setMensagem("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: senha,
    });

    setLoading(false);

    if (error) {
      setMensagem("Erro ao definir senha. Tente acessar o link novamente.");
      return;
    }

    setMensagem("Senha definida com sucesso.");

    setTimeout(() => {
      router.push("/login");
    }, 1500);
  }

  if (verificando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100">
        <p className="text-sm text-gray-500">Verificando acesso...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl border border-blue-100">
        <div className="flex flex-col items-center mb-7">
          <img
            src="/logo-voxx.png"
            alt="VOXX"
            className="w-40 h-40 object-contain mb-2"
          />

          <p className="text-gray-500 text-sm font-medium">
            Definir senha de acesso
          </p>

          <p className="mt-3 text-center text-sm text-gray-500 leading-relaxed">
            Olá, seja bem-vindo(a) ao RH! Seu acesso ao VOXX foi aprovado.
            <br />
            Crie uma senha para concluir seu cadastro e acessar o sistema.
          </p>
        </div>

        <form onSubmit={handleDefinirSenha} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nova senha: <span className="text-red-500">*</span>
            </label>

            <input
              required
              type="password"
              placeholder="Digite sua nova senha"
              className="w-full h-11 px-4 rounded-xl border border-gray-300 shadow-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar senha: <span className="text-red-500">*</span>
            </label>

            <input
              required
              type="password"
              placeholder="Digite novamente sua senha"
              className="w-full h-11 px-4 rounded-xl border border-gray-300 shadow-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-blue-700 text-white font-semibold shadow-lg shadow-blue-200 transition hover:bg-blue-800 active:scale-[0.98] active:shadow-inner disabled:opacity-60"
          >
            {loading ? "Salvando..." : "Salvar senha"}
          </button>
        </form>

        {mensagem && (
          <div
            className={`mt-5 rounded-xl px-4 py-3 text-sm text-center ${
              mensagem.includes("sucesso")
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-600 border border-red-200"
            }`}
          >
            {mensagem}
          </div>
        )}

        <p className="mt-6 text-center text-xs text-gray-400">VOXX • v1.0</p>
      </div>
    </div>
  );
}