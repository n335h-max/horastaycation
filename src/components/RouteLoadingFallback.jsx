export function RouteLoadingFallback() {
  return (
    <section className="min-h-screen bg-ice-50 px-4 pb-16 pt-28 md:px-8">
      <div className="mx-auto max-w-6xl animate-pulse rounded-[2rem] border border-brand-100 bg-white p-8 shadow-lg">
        <div className="mb-6 h-6 w-32 rounded-full bg-brand-100" />
        <div className="mb-3 h-12 max-w-xl rounded-2xl bg-brand-100" />
        <div className="mb-10 h-5 max-w-2xl rounded-full bg-slate-100" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-72 rounded-[2rem] bg-slate-100" />
          <div className="h-72 rounded-[2rem] bg-slate-100" />
        </div>
      </div>
    </section>
  );
}
