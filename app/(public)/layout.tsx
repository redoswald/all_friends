export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-coral-50 via-white to-teal-50">
      {children}
    </div>
  );
}
