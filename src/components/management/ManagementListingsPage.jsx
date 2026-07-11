import { ListingsStudio } from './ListingsStudio';

export function ManagementListingsPage({
  listings,
  onSaveListing,
  onDeleteListing,
  onShowPage = () => {},
}) {
  return (
    <section className="min-h-screen bg-ice-50 px-4 pb-14 pt-26 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[1.8rem] border border-ice-200 bg-white px-6 py-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
            <button type="button" onClick={() => onShowPage('dashboard')} className="hover:text-brand-700">
              Dashboard
            </button>
            <span className="text-slate-300">/</span>
            <span>Listings</span>
            <span className="text-slate-300">/</span>
            <span className="font-semibold text-brand-900">Manage listings</span>
          </div>

          <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-4xl font-bold text-brand-950 md:text-5xl">Listings workspace</h1>
              <p className="mt-2 max-w-2xl text-base text-slate-500">
                Create, edit, and manage all staycation properties. Save drafts for review, then publish updates to
                the live catalog when ready.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onShowPage('dashboard')}
              className="btn-outline px-5 py-2.5 text-sm"
            >
              Back to dashboard
            </button>
          </div>
        </div>
        <div className="mt-6 rounded-[1.8rem] border border-ice-200 bg-white p-5 shadow-sm md:p-6">
          <ListingsStudio
            listings={listings}
            onSaveListing={onSaveListing}
            onDeleteListing={onDeleteListing}
            onShowPage={onShowPage}
          />
        </div>
      </div>
    </section>
  );
}
