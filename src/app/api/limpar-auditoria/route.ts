import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");

    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return Response.json(
        { success: false, error: "Não autorizado." },
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const limite = new Date();
    limite.setMonth(limite.getMonth() - 12);

    const { error } = await supabase
      .from("auditoria")
      .delete()
      .lt("criado_em", limite.toISOString());

    if (error) {
      return Response.json({
        success: false,
        error: error.message,
      });
    }

    return Response.json({
      success: true,
      mensagem: "Auditoria limpa com sucesso.",
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: String(error),
    });
  }
}