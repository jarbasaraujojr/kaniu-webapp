export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between text-center">
        <h1 className="text-4xl font-bold mb-4">
          Bem-vindo ao Kaniu
        </h1>
        <p className="text-xl text-muted-foreground">
          Sistema de Gestão de Abrigos de Animais
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <a
            href="/animals"
            className="rounded-lg bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Ver Animais
          </a>
          <a
            href="/shelters"
            className="rounded-lg border border-border px-6 py-3 hover:bg-accent transition-colors"
          >
            Abrigos
          </a>
        </div>
      </div>
    </main>
  )
}
