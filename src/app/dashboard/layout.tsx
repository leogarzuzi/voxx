"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    async function verificarLogin() {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        router.push("/login");
        return;
      }

      setVerificando(false);
    }

    verificarLogin();
  }, [router]);

  if (verificando) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Verificando acesso...
      </div>
    );
  }

  return <>{children}</>;
}