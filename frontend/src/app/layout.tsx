import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth";
import { Shell } from "@/components/shell";
import "@fontsource/orbit/400.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/600.css";
import "./tokens.css";
import "./globals.css";
export const metadata: Metadata = {
  title: "Topology Hub | Redes para explorar",
  description: "Crie, compartilhe e organize topologias de rede para o KNS.",
};
export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <a href="#main-content" className="skip-link">
          Pular para o conteúdo
        </a>
        <AuthProvider>
          <Shell>{children}</Shell>
        </AuthProvider>
      </body>
    </html>
  );
}
