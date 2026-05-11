export default function HomePage() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-blue-700">
          VOXX
        </h1>

        <p className="mt-3 text-lg text-gray-600">
          Sistema de RH
        </p>

        <a
          href="/dashboard"
          className="inline-block mt-8 rounded-lg bg-blue-700 px-6 py-3 text-white font-semibold hover:bg-blue-800"
        >
          Entrar no dashboard
        </a>
      </div>
    </main>
  );
}