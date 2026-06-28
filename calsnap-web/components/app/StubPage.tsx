interface StubPageProps {
  title: string;
  comingIn: string;
}

export function StubPage({ title, comingIn }: StubPageProps) {
  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col gap-4 px-4 py-8">
      <h1 className="text-2xl font-semibold text-neutral-900">{title}</h1>
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <p className="text-neutral-600">Coming in {comingIn}.</p>
      </div>
    </div>
  );
}
