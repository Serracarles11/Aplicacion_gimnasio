export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navbar aquí (si lo quieres para el resto) */}
      {children}
    </div>
  );
}
