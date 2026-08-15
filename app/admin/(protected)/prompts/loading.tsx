export default function BibliotecaPromptsLoading() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-72 animate-pulse rounded bg-slate-200" />
      <div className="h-36 animate-pulse rounded-lg bg-slate-100" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="h-64 animate-pulse rounded-lg border border-slate-200 bg-white"
          />
        ))}
      </div>
    </div>
  );
}
