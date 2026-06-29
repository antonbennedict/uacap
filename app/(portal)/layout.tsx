import Sidebar from '@/components/Sidebar';

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-gray-50 min-h-screen">
        <div className="page-enter">
          {children}
        </div>
      </main>
    </div>
  );
}
