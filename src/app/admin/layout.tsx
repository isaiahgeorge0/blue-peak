export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full bg-charcoal">
      <div className="mx-auto max-w-6xl px-6 py-10">{children}</div>
    </div>
  );
}
