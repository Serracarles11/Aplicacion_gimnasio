import "./globals.css";

export const metadata = {
  title: "Gimnasio",
  description: "App de fitness",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-dvh bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}

