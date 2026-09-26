import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Descargas Lufer",
  description: "Herramienta de extracción y descarga de contenido multimedia.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
