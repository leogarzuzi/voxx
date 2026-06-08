"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { usePathname, useRouter } from "next/navigation";

type UsuarioSistema = {
  nome: string;
  perfil: string;
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [verificando, setVerificando] = useState(true);
  const [primeiroNome, setPrimeiroNome] = useState("");
  const [perfil, setPerfil] = useState("");
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    async function verificarAcesso() {
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session?.user?.email) {
        router.push("/login");
        return;
      }

      const email = sessionData.session.user.email;

      const { data: usuario, error } = await supabase
        .from("usuarios")
        .select("nome, perfil")
        .eq("email", email)
        .single<UsuarioSistema>();

      if (error || !usuario) {
        router.push("/login");
        return;
      }

      const rotaSolicitacoes = pathname.startsWith("/dashboard/solicitacoes");

      if (rotaSolicitacoes && usuario.perfil !== "Admin") {
        router.push("/dashboard");
        return;
      }

      setPrimeiroNome(usuario.nome?.trim().split(" ")[0] || "Usuário");
      setPerfil(usuario.perfil);
      setVerificando(false);
    }

    verificarAcesso();
  }, [router, pathname]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (verificando) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Verificando acesso...
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="fixed top-4 right-4 z-50">
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuAberto(!menuAberto)}
            className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-md border border-gray-200 hover:bg-gray-50 transition"
          >
            <span>{primeiroNome}</span>
            <span className="text-gray-500">⌄</span>
          </button>

          {menuAberto && (
            <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white shadow-xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-800">
                  {primeiroNome}
                </p>
                <p className="text-xs text-gray-400">{perfil}</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMenuAberto(false);
                  router.push("/dashboard/perfil");
                }}
                className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                Perfil
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuAberto(false);
                  router.push("/dashboard/alterar-senha");
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

      {children}
    </div>
  );
}