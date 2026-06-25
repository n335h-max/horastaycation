import { FEATURED_PROPERTIES } from '../../data/siteData';
import { ListingsStudio } from './ListingsStudio';
import { PublishedListingsGrid } from './PublishedListingsGrid';

export function ManagementListingsPage({
  listings = FEATURED_PROPERTIES,
  bookings = [],
  revenue = 0,
  ownerApplications = [],
  reviewSubmissions = [],
  onSaveListing,
  onDeleteListing,
  onShowPage,
  onSignOut,
  authUser,
  formatCurrency,
}) {
  const currentMonthLabel = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(new Date());
  const liveListingsCount = listings.filter((l) => l.publishStatus !== 'draft' && !l.isDeleted).length;
  const draftListingsCount = listings.filter((l) => l.publishStatus === 'draft' && !l.isDeleted).length;
  const averageNightly = listings.length
    ? formatCurrency(Math.round(listings.reduce((sum, l) => sum + Number(l.price || 0), 0) / listings.length))
    : formatCurrency(0);
  const userName = authUser?.user_metadata?.full_name || authUser?.email || 'Hora Admin';
  const initial = String(userName).trim().charAt(0).toUpperCase() || 'H';

  return (
    <div
      className="flex h-screen overflow-hidden bg-[#F5F7FA] text-sm text-[#0F1F3D]"
      style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
    >
      {/* Sidebar */}
      <aside className="flex h-full w-[220px] min-w-[220px] flex-shrink-0 flex-col bg-[#0F1F3D]">
        <div className="flex items-center gap-2.5 border-b border-white/10 px-[18px] py-5">
          <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-lg bg-[#1D9E75] text-sm font-bold text-white">
            H
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Hora</div>
            <div className="mt-0.5 text-[10px] text-white/55">Staycation</div>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2.5 py-3.5">
          <div className="px-2 pb-1 pt-2.5 text-[10px] font-medium uppercase tracking-[0.06em] text-white/35">
            Overview
          </div>
          {[
            { id: 'dashboard', label: 'Dashboard', onClick: () => onShowPage('dashboard') },
            { id: 'bookings', label: 'Bookings', onClick: () => onShowPage('dashboard') },
            { id: 'analytics', label: 'Analytics', onClick: () => onShowPage('dashboard') },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              className="flex w-full items-center gap-2.5 rounded-md border-none px-2.5 py-2 text-left text-[13px] text-white/55"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4 flex-shrink-0"
                style={{
                  stroke: 'currentColor',
                  fill: 'none',
                  strokeWidth: 1.8,
                  strokeLinecap: 'round',
                  strokeLinejoin: 'round',
                }}
              >
                {item.id === 'dashboard' ? (
                  <>
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                  </>
                ) : item.id === 'bookings' ? (
                  <>
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </>
                ) : (
                  <>
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </>
                )}
              </svg>
              <span className="flex-1">{item.label}</span>
            </button>
          ))}
          <div className="px-2 pb-1 pt-2.5 text-[10px] font-medium uppercase tracking-[0.06em] text-white/35">
            Listings
          </div>
          {[
            { id: 'manage-listings', label: 'Manage listings' },
            { id: 'upload-studio', label: 'Upload studio' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              className="flex w-full items-center gap-2.5 rounded-md border-none px-2.5 py-2 text-left text-[13px] text-white"
              style={{ background: '#1E3560' }}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4 flex-shrink-0"
                style={{
                  stroke: 'currentColor',
                  fill: 'none',
                  strokeWidth: 1.8,
                  strokeLinecap: 'round',
                  strokeLinejoin: 'round',
                }}
              >
                {item.id === 'manage-listings' ? (
                  <>
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </>
                ) : (
                  <>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </>
                )}
              </svg>
              <span className="flex-1">{item.label}</span>
            </button>
          ))}
          <div className="px-2 pb-1 pt-2.5 text-[10px] font-medium uppercase tracking-[0.06em] text-white/35">
            Clients
          </div>
          {[
            { id: 'owner-leads', label: 'Owner leads', onClick: () => onShowPage('dashboard') },
            { id: 'evaluate-leads', label: 'Evaluate leads', onClick: () => onShowPage('dashboard') },
            { id: 'email-activity', label: 'Email activity', onClick: () => onShowPage('dashboard') },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              className="flex w-full items-center gap-2.5 rounded-md border-none px-2.5 py-2 text-left text-[13px] text-white/55"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4 flex-shrink-0"
                style={{
                  stroke: 'currentColor',
                  fill: 'none',
                  strokeWidth: 1.8,
                  strokeLinecap: 'round',
                  strokeLinejoin: 'round',
                }}
              >
                {item.id === 'owner-leads' ? (
                  <>
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <line x1="19" y1="8" x2="19" y2="14" />
                    <line x1="22" y1="11" x2="16" y2="11" />
                  </>
                ) : item.id === 'evaluate-leads' ? (
                  <>
                    <path d="M9 11l3 3L22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </>
                ) : (
                  <>
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </>
                )}
              </svg>
              <span className="flex-1">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="flex flex-shrink-0 items-center gap-2.5 border-t border-white/10 px-4 py-3.5">
          <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full border-[1.5px] border-[#2A4578] bg-[#1E3560] text-xs font-semibold text-white">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-medium text-white">
              {authUser?.email || 'management@horastaycation.com'}
            </div>
            <div className="text-[10px] text-white/55">Admin</div>
          </div>
          <button type="button" onClick={onSignOut} className="flex items-center rounded border-none p-1 text-white/35">
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              style={{
                stroke: 'currentColor',
                fill: 'none',
                strokeWidth: 1.8,
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
              }}
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden" style={{ height: '100%' }}>
        <div className="flex h-[52px] flex-shrink-0 items-center gap-3.5 border-b border-[rgba(15,31,61,0.12)] bg-white px-6">
          <span className="text-sm font-semibold text-[#0F1F3D]">Listings workspace</span>
          <div className="ml-auto flex items-center gap-2.5">
            <span className="flex items-center gap-1.5 rounded-full border border-[rgba(15,31,61,0.12)] bg-[#F5F7FA] px-3 py-1.5 text-xs text-[#5A6A84]">
              <svg
                viewBox="0 0 24 24"
                className="h-[13px] w-[13px]"
                style={{
                  stroke: 'currentColor',
                  fill: 'none',
                  strokeWidth: 1.8,
                  strokeLinecap: 'round',
                  strokeLinejoin: 'round',
                }}
              >
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {currentMonthLabel}
            </span>
            <button
              type="button"
              onClick={() => onShowPage('landing')}
              className="btn-outline rounded-md border border-[rgba(15,31,61,0.12)] bg-white px-3.5 py-1.5 text-xs font-medium text-[#0F1F3D]"
            >
              Return to site
            </button>
            <button
              type="button"
              onClick={() => onShowPage('dashboard')}
              className="btn-primary flex items-center gap-1.5 rounded-md border-none bg-[#0F1F3D] px-3.5 py-1.5 text-xs font-medium text-white"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5"
                style={{
                  stroke: 'currentColor',
                  fill: 'none',
                  strokeWidth: 2,
                  strokeLinecap: 'round',
                  strokeLinejoin: 'round',
                }}
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
              Back to dashboard
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-[18px] overflow-y-auto p-6">
          <div className="flex items-stretch gap-0 rounded-xl bg-[#0F1F3D] px-6 py-[18px]">
            <div className="flex flex-col gap-0.5 pr-6">
              <span className="text-[10px] uppercase tracking-[0.06em] text-white/35">Listings live</span>
              <span className="text-[22px] font-semibold text-white">{liveListingsCount}</span>
              <span className="text-[11px] text-white/55">
                {draftListingsCount ? `${draftListingsCount} draft in progress` : 'All active listings are published'}
              </span>
            </div>
            <div className="mx-6 w-px self-stretch bg-white/10 flex-shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-[0.06em] text-white/35">Average nightly</span>
              <span className="text-[22px] font-semibold text-white">{averageNightly}</span>
              <span className="text-[11px] text-white/55">Calculated across current management listings</span>
            </div>
            <div className="mx-6 w-px self-stretch bg-white/10 flex-shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-[0.06em] text-white/35">Bookings connected</span>
              <span className="text-[22px] font-semibold text-white">{bookings.length}</span>
              <span className="text-[11px] text-white/55">The studio updates what guests actually book</span>
            </div>
            <div className="mx-6 w-px self-stretch bg-white/10 flex-shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-[0.06em] text-white/35">Lead pipeline</span>
              <span className="text-[22px] font-semibold text-white">
                {ownerApplications.length + reviewSubmissions.length}
              </span>
              <span className="text-[11px] text-white/55">Owner and evaluation demand connected to this workspace</span>
            </div>
            <div className="mx-6 w-px self-stretch bg-white/10 flex-shrink-0" />
            <div className="flex items-center flex-1 pl-6 text-xs leading-relaxed text-white/55">
              The listing studio is the source of truth for the public staycation catalog.
            </div>
          </div>

          <div className="rounded-xl border border-[rgba(15,31,61,0.12)] bg-white p-[18px]">
            <ListingsStudio
              listings={listings}
              onSaveListing={onSaveListing}
              onDeleteListing={onDeleteListing}
              onShowPage={onShowPage}
              formatCurrency={formatCurrency}
            />
          </div>

          <div className="rounded-xl border border-[rgba(15,31,61,0.12)] bg-white p-[18px]">
            <div className="mb-3.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[13px] font-semibold text-[#0F1F3D]">
                <svg
                  viewBox="0 0 24 24"
                  className="h-[15px] w-[15px]"
                  style={{
                    stroke: '#5A6A84',
                    fill: 'none',
                    strokeWidth: 1.8,
                    strokeLinecap: 'round',
                    strokeLinejoin: 'round',
                  }}
                >
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                Live catalog preview
              </span>
              <button
                type="button"
                onClick={() => onShowPage('dashboard')}
                className="border-none bg-transparent text-xs font-medium text-[#0F1F3D]"
              >
                Back to dashboard
              </button>
            </div>
            <PublishedListingsGrid listings={listings} formatCurrency={formatCurrency} />
          </div>
        </div>
      </div>
    </div>
  );
}
