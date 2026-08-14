import InicioClient from "./InicioClient";

export const dynamic = "force-dynamic";

export default async function InicioPage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string }>;
}) {
  const parametros = await searchParams;
  return <InicioClient buscaInicial={parametros.busca?.trim() || ""} />;
}
