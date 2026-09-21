type Props = {
  loading: boolean;
  error: string;
  onRetry?: () => void;
  children: React.ReactNode;
};

export default function DataState({ loading, error, onRetry, children }: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-foreground-500">
        <i className="ri-loader-4-line animate-spin text-xl"></i>
        <span className="text-sm">Loading…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-16 text-center">
        <div className="text-sm text-accent-700 bg-accent-100 rounded-md px-3 py-2 inline-block">
          {error}
        </div>
        {onRetry && (
          <div className="mt-3">
            <button
              onClick={onRetry}
              className="px-4 py-2 rounded-md bg-secondary-500 text-background-50 text-sm font-semibold whitespace-nowrap cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
}