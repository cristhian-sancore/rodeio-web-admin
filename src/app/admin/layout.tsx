import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Sidebar from "./components/Sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const config = await prisma.configuracao.findFirst();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
      {/* Sidebar Component (Client Side for Mobile Toggle) */}
      <Sidebar user={session?.user} config={config} />

      {/* Main Content Area */}
      <main style={{ 
        flex: 1, 
        maxWidth: '100vw', 
        overflowX: 'hidden',
        minHeight: '100vh',
        transition: 'padding 0.3s ease'
      }} className="main-content">
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
