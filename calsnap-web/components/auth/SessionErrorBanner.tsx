interface SessionErrorBannerProps {
  message: string | null;
}

export function SessionErrorBanner({ message }: SessionErrorBannerProps) {
  if (!message) {
    return null;
  }

  return (
    <p className="rounded-lg border border-cs-danger/30 bg-cs-danger/10 px-3 py-2 text-sm text-cs-danger">
      {message}
    </p>
  );
}
