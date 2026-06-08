"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { usePathname, useRouter } from "next/navigation";

type UsuarioSistema = {
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
        .select("perfil")
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

      setVerificando(false);
    }

    verificarAcesso();
  }, [router, pathname]);

  if (verificando) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Verificando acesso...
      </div>
    );
  }

  return <>{children}</>;
}