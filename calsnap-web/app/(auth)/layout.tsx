export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-cs-background px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-cs-border bg-cs-surface p-6 shadow-sm dark:shadow-none">
        {children}
      </div>
    </div>
  );
}
