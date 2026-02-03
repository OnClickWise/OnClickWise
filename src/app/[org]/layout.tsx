import { ThemeToggle } from "@/components/layout/theme-toggle";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen w-full">
      {/* botão tema */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* conteúdo ocupa TUDO */}
      {children}
    </main>
  );
}
