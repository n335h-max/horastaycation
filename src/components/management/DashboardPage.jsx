import { useState, useMemo } from 'react';
import { FEATURED_PROPERTIES } from '../../data/siteData';
import { Icon } from '../Icon';
import { PublishedListingsGrid } from './PublishedListingsGrid';
import { getWindowConfig, isInWindow } from '../../hooks/useManagementStudio';

const WINDOW_OPTIONS = [
  { id: '7d', label: '7D', description: 'Last 7 days', days: 7, buckets: 7 },
  { id: '30d', label: '30D', description: 'Last 30 days', days: 30, buckets: 6 },
  { id: '90d', label: '90D', description: 'Last 90 days', days: 90, buckets: 6 },
  { id: 'all', label: 'All', description: 'All tracked time', days: null, buckets: 6 },
];

function summarizeWindowedAnalytics(events = [], bookingTransactions = [], supportRequests = [], windowId = '30d') {
  const filteredEvents = events.filter((event) => isInWindow(event.createdAt, windowId));
  const filteredBookings = bookingTransactions.filter((booking) => isInWindow(booking.submittedAt, windowId));
  const filteredSupport = supportRequests.filter((request) => isInWindow(request.submittedAt, windowId));
  const counts = filteredEvents.reduce((summary, event) => {
    const nextSummary = { ...summary };
    nextSummary[event.type] = (nextSummary[event.type] || 0) + 1;
    return nextSummary;
  }, {});
  const wishlistedPropertyIds = new Set(filteredEvents.filter((e) => e.type === 'wishlist_add').map((e) => e.propertyId).filter(Boolean));
  const searches = counts.search || 0;
  const bookings = filteredBookings.length;
  return {
    searches, bookings,
    pageViews: counts.page_view || 0,
    wishlistAdds: counts.wishlist_add || 0,
    supportMessages: filteredSupport.length,
    installPrompts: counts.install_prompt || 0,
    uniqueWishlistedProperties: wishlistPropertyIds.size,
    conversionRate: searches ? Math.round((bookings / searches) * 100) : 0,
    recentEvents: filteredEvents.slice(0, 6),
  };
}

function formatAnalyticsEventLabel(type = 'activity') {
  return String(type).replace(/_/g, ' ').replace(/^\w/, (m) => m.toUpperCase());
}

function formatStatusCopy(status = 'paid') {
  return String(status || 'paid').replace(/[-_]/g, ' ').replace(/^\w/, (m) => m.toUpperCase());
}

function getInitials(name) {
  return String(name || '').split(' ').slice(0, 2).map((p) => p.charAt(0)).join('').toUpperCase();
}

export function DashboardPage({
  listings = FEATURED_PROPERTIES, bookings = [], bookingTransactions = [], emails = [], revenue = 0,
  ownerApplications = [], reviewSubmissions = [], onUpdateBookingStatus, onRefundBooking, onCancelBooking,
  onShowPage, onSignOut, authUser, formatCurrency, analyticsEvents = [], supportRequests = [],
}) {
  const [analyticsWindow, setAnalyticsWindow] = useState('30d');
  const analyticsSummary = useMemo(() => summarizeWindowedAnalytics(analyticsEvents, bookingTransactions, supportRequests, analyticsWindow), [analyticsEvents, analyticsWindow, bookingTransactions, supportRequests]);
  const analyticsWindowLabel = getWindowConfig(analyticsWindow).description;
  const currentMonthLabel = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(new Date());
  const liveListingsCount = listings.filter((l) => l.publishStatus !== 'draft' && !l.isDeleted).length;
  const draftListingsCount = listings.filter((l) => l.publishStatus === 'draft' && !l.isDeleted).length;
  const confirmedBookings = bookingTransactions.filter((b) => (b.bookingStatus || 'confirmed') === 'confirmed').length;
  const publishedListings = listings.filter((l) => !l.isDeleted);
  const queuePreview = bookingTransactions.slice(0, 3);
  const ownerLeads = ownerApplications.slice(0, 3);
  const evalLeads = reviewSubmissions.slice(0, 3);
  const userName = authUser?.user_metadata?.full_name || authUser?.email || 'Hora Admin';
  const initial = String(userName).trim().charAt(0).toUpperCase() || 'H';

  const recentActivity = useMemo(() => {
    const items = [];
    if (bookingTransactions[0]) items.push({ id: `booking-${bookingTransactions[0].id}`, icon: 'calendar-check', title: 'Booking confirmed', detail: bookingTransactions[0].bookingSummary.name, meta: `${bookingTransactions[0].bookingForm.checkin} · ${formatCurrency(bookingTransactions[0].bookingSummary.total)}`, tone: 'brand' });
    if (ownerApplications[0]) items.push({ id: `owner-${ownerApplications[0].id}`, icon: 'home', title: 'Owner lead received', detail: ownerApplications[0].ownerAddress, meta: ownerApplications[0].submittedAt ? new Date(ownerApplications[0].submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Awaiting review', tone: 'accent' });
    if (analyticsSummary.recentEvents[0]) items.push({ id: `analytics-${analyticsSummary.recentEvents[0].id}`, icon: 'chart', title: formatAnalyticsEventLabel(analyticsSummary.recentEvents[0].type), detail: analyticsSummary.recentEvents[0].path || analyticsSummary.recentEvents[0].page || 'HoraStaycation', meta: analyticsSummary.searches ? `${analyticsSummary.searches} tracked searches` : 'No tracked searches yet', tone: 'ice' });
    if (!items.length) items.push({ id: 'activity-empty', icon: 'chart', title: 'Workspace ready', detail: 'No recent activity yet', meta: 'Bookings, owner leads, and analytics will populate this feed', tone: 'ice' });
    return items.slice(0, 3);
  }, [analyticsSummary, bookingTransactions, formatCurrency, ownerApplications]);

  const emailTriggers = useMemo(() => {
    if (emails.length) return emails.slice(0, 3).map((email, index) => ({ id: `${email.title}-${index}`, title: email.title, detail: email.detail }));
    return [{ id: 'email-empty', title: 'Triggers standing by', detail: 'Guest, owner, and management emails will appear here once activity begins.' }];
  }, [emails]);

  const snapItems = [
    { id: 'bookings', label: 'Bookings', value: bookings.length, sub: 'This month' },
    { id: 'revenue', label: 'Revenue', value: formatCurrency(revenue), sub: 'Confirmed only' },
    { id: 'emails', label: 'Emails Sent', value: emails.length, sub: 'All triggers active' },
    { id: 'listings', label: 'Listings Live', value: liveListingsCount, sub: draftListingsCount ? `${draftListingsCount} draft` : 'All published' },
  ];
  const healthCopy = liveListingsCount ? 'System is healthy. Queue, email triggers, and live listings are running normally.' : 'System is ready. Publish your first listing to activate the operator workflow.';

  const statCards = [
    { id: 'confirmed', label: 'Confirmed bookings', value: confirmedBookings, caption: confirmedBookings ? 'Ready to host' : 'No bookings yet' },
    { id: 'compact-revenue', label: 'Revenue', value: formatCurrency(revenue), caption: 'This month' },
    { id: 'owners', label: 'Owner leads', value: ownerApplications.length, caption: ownerApplications.length ? 'Needs review' : 'Awaiting follow-up' },
    { id: 'evaluations', label: 'Evaluate leads', value: reviewSubmissions.length, caption: reviewSubmissions.length ? 'Needs review' : 'Pending review' },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F7FA] text-sm text-[#0F1F3D]" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Sidebar */}
      <aside className="flex h-full w-[220px] min-w-[220px] flex-shrink-0 flex-col bg-[#0F1F3D]">
        <div className="flex items-center gap-2.5 border-b border-white/10 px-[18px] py-5">
          <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-lg bg-[#1D9E75] text-sm font-bold text-white">H</div>
          <div>
            <div className="text-sm font-semibold text-white">Hora</div>
            <div className="mt-0.5 text-[10px] text-white/55">Staycation</div>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2.5 py-3.5">
          {[
            { title: 'Overview', items: [{ id: 'dashboard', label: 'Dashboard', href: '#portal-dashboard' }, { id: 'bookings', label: 'Bookings', href: '#portal-queue', badge: bookingTransactions.length || null }, { id: 'analytics', label: 'Analytics', href: '#portal-analytics' }] },
            { title: 'Listings', items: [{ id: 'manage-listings', label: 'Manage listings', onClick: () => onShowPage('management-listings') }, { id: 'upload-studio', label: 'Upload studio', onClick: () => onShowPage('management-listings') }] },
            { title: 'Clients', items: [{ id: 'owner-leads', label: 'Owner leads', href: '#portal-owner-leads' }, { id: 'evaluate-leads', label: 'Evaluate leads', href: '#portal-evaluate-leads' }, { id: 'email-activity', label: 'Email activity', href: '#portal-email-triggers' }] },
          ].map((group) => (
            <div key={group.title}>
              <div className="px-2 pb-1 pt-2.5 text-[10px] font-medium uppercase tracking-[0.06em] text-white/35">{group.title}</div>
              {group.items.map((item) => {
                const content = (
                  <>
                    <svg viewBox="0 0 24 24" className="h-4 w-4 flex-shrink-0" style={{ stroke: 'currentColor', fill: 'none', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                      {item.id === 'dashboard' ? <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>
                        : item.id === 'bookings' ? <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>
                          : item.id === 'analytics' ? <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>
                            : item.id === 'manage-listings' ? <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>
                              : item.id === 'upload-studio' ? <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>
                                : item.id === 'owner-leads' ? <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></>
                                  : <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>}
                    </svg>
                    <span className="flex-1">{item.label}</span>
                    {item.badge ? <span className="ml-auto rounded-full bg-[#1D9E75] px-1.5 py-0.5 text-[10px] font-semibold text-white">{item.badge}</span> : null}
                  </>
                );
                if (item.href) {
                  return <a key={item.id} href={item.href} className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] text-white/55 no-underline" style={{ background: item.active ? '#1E3560' : 'transparent' }}>{content}</a>;
                }
                return <button key={item.id} type="button" onClick={item.onClick} className="flex w-full items-center gap-2.5 rounded-md border-none px-2.5 py-2 text-left text-[13px] text-white/55" style={{ background: item.active ? '#1E3560' : 'transparent' }}>{content}</button>;
              })}
            </div>
          ))}
        </nav>
        <div className="flex flex-shrink-0 items-center gap-2.5 border-t border-white/10 px-4 py-3.5">
          <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full border-[1.5px] border-[#2A4578] bg-[#1E3560] text-xs font-semibold text-white">{initial}</div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-medium text-white">{authUser?.email || 'management@horastaycation.com'}</div>
            <div className="text-[10px] text-white/55">Admin</div>
          </div>
          <button type="button" onClick={onSignOut} className="flex items-center rounded border-none p-1 text-white/35">
            <svg viewBox="0 0 24 24" className="h-4 w-4" style={{ stroke: 'currentColor', fill: 'none', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden" style={{ height: '100%' }}>
        <div className="flex h-[52px] flex-shrink-0 items-center gap-3.5 border-b border-[rgba(15,31,61,0.12)] bg-white px-6">
          <span className="text-sm font-semibold text-[#0F1F3D]">Operations dashboard</span>
          <div className="ml-auto flex items-center gap-2.5">
            <span className="flex items-center gap-1.5 rounded-full border border-[rgba(15,31,61,0.12)] bg-[#F5F7FA] px-3 py-1.5 text-xs text-[#5A6A84]">
              <svg viewBox="0 0 24 24" className="h-[13px] w-[13px]" style={{ stroke: 'currentColor', fill: 'none', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              {currentMonthLabel}
            </span>
            <button type="button" onClick={() => onShowPage('landing')} className="btn-outline rounded-md border border-[rgba(15,31,61,0.12)] bg-white px-3.5 py-1.5 text-xs font-medium text-[#0F1F3D]">Return to site</button>
            <button type="button" onClick={() => onShowPage('management-listings')} className="btn-primary flex items-center gap-1.5 rounded-md border-none bg-[#0F1F3D] px-3.5 py-1.5 text-xs font-medium text-white">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" style={{ stroke: 'currentColor', fill: 'none', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              New listing
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-[18px] overflow-y-auto p-6">
          {/* Snapshot bar */}
          <div className="flex items-stretch gap-0 rounded-xl bg-[#0F1F3D] px-6 py-[18px]">
            <div className="flex flex-col gap-0.5 pr-6">
              <span className="text-[10px] uppercase tracking-[0.06em] text-white/35">Bookings</span>
              <span className="text-[22px] font-semibold text-white">{bookings.length}</span>
              <span className="text-[11px] text-white/55">This month</span>
            </div>
            <div className="flex flex-col gap-0.5 px-6">
              <span className="text-[10px] uppercase tracking-[0.06em] text-white/35">Revenue</span>
              <span className="text-[22px] font-semibold text-white">{formatCurrency(revenue)}</span>
              <span className="text-[11px] text-white/55">Confirmed only</span>
            </div>
            <div className="flex flex-col gap-0.5 px-6">
              <span className="text-[10px] uppercase tracking-[0.06em] text-white/35">Emails Sent</span>
              <span className="text-[22px] font-semibold text-white">{emails.length}</span>
              <span className="text-[11px] text-white/55">All triggers active</span>
            </div>
            <div className="flex flex-col gap-0.5 px-6">
              <span className="text-[10px] uppercase tracking-[0.06em] text-white/35">Listings Live</span>
              <span className="text-[22px] font-semibold text-white">{liveListingsCount}</span>
              <span className="text-[11px] text-white/55">{draftListingsCount ? `${draftListingsCount} draft` : 'All published'}</span>
            </div>
            <div className="flex-shrink-0 self-stretch w-px bg-white/10" />
            <div className="flex items-center flex-1 pl-6 text-xs leading-relaxed text-white/55">{healthCopy}</div>
          </div>

          {/* Stat grid */}
          <div className="grid grid-cols-4 gap-3">
            {statCards.map((card) => (
              <div key={card.id} className="rounded-xl border border-[rgba(15,31,61,0.12)] bg-white p-4">
                <div className="mb-1.5 flex items-center gap-1.5 text-[11px] text-[#5A6A84]">
                  <svg viewBox="0 0 24 24" className="h-[13px] w-[13px]" style={{ stroke: 'currentColor', fill: 'none', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                    <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                  </svg>
                  {card.label}
                </div>
                <div className="text-[26px] font-semibold text-[#0F1F3D]">{card.value}</div>
                <div className="mt-1 text-[11px] text-[#8FA0B8]">{card.caption}</div>
              </div>
            ))}
          </div>

          {/* Analytics */}
          <div id="portal-analytics" className="flex items-center gap-3.5 rounded-xl border border-[rgba(15,31,61,0.12)] bg-white px-[18px] py-3.5">
            <div className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-md border border-[rgba(15,31,61,0.12)] bg-[#F5F7FA]">
              <svg viewBox="0 0 24 24" className="h-4 w-4" style={{ stroke: '#0F1F3D', fill: 'none', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-[13px] font-medium text-[#0F1F3D]">Analytics — {analyticsWindowLabel.toLowerCase()}</div>
              <div className="mt-0.5 text-[11px] text-[#5A6A84]">
                {analyticsSummary.pageViews} page views · {analyticsSummary.bookings} bookings · {analyticsSummary.conversionRate}% conversion · {analyticsSummary.searches ? `${analyticsSummary.searches} tracked searches` : 'no tracked searches yet'}
              </div>
            </div>
            <div className="ml-auto flex flex-shrink-0 items-center gap-2">
              <div className="flex overflow-hidden rounded-md border border-[rgba(15,31,61,0.12)]">
                {WINDOW_OPTIONS.map((option) => (
                  <button key={option.id} type="button" onClick={() => setAnalyticsWindow(option.id)}
                    className={`border-none px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.04em] cursor-pointer ${
                      analyticsWindow === option.id ? 'bg-[#0F1F3D] text-white' : 'bg-transparent text-[#5A6A84]'
                    }`}
                  >{option.label}</button>
                ))}
              </div>
              <a href="#portal-queue" className="flex items-center gap-1 whitespace-nowrap text-xs text-[#8FA0B8] no-underline">
                View full analytics
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" style={{ stroke: 'currentColor', fill: 'none', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Booking queue + activity */}
          <div className="grid grid-cols-[1.6fr_1fr] gap-4">
            <div id="portal-queue" className="rounded-xl border border-[rgba(15,31,61,0.12)] bg-white p-[18px]">
              <div className="mb-3.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[13px] font-semibold text-[#0F1F3D]">
                  <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" style={{ stroke: '#5A6A84', fill: 'none', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                    <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                  </svg>
                  Live booking queue
                </span>
                <button type="button" onClick={() => onShowPage('booking')} className="border-none bg-transparent text-xs font-medium text-[#0F1F3D]">View all</button>
              </div>
              {queuePreview.length ? queuePreview.map((booking) => (
                <div key={booking.id} className="flex items-center gap-2.5 border-b border-[rgba(15,31,61,0.12)] py-2.5">
                  <div className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-md border border-[rgba(15,31,61,0.12)] bg-[#EEF2F7] text-[10px] font-bold text-[#0F1F3D]">
                    {getInitials(booking.bookingSummary?.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-[#0F1F3D]">{booking.bookingSummary?.name || 'Staycation'}</div>
                    <div className="mt-0.5 text-[11px] text-[#8FA0B8]">{booking.bookingForm?.checkin} – {booking.bookingForm?.checkout} · {booking.bookingSummary?.nights || 0} night{(booking.bookingSummary?.nights || 0) > 1 ? 's' : ''} · {booking.bookingForm?.guests || '?'} pax</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      (booking.bookingStatus || 'confirmed') === 'confirmed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>{formatStatusCopy(booking.bookingStatus || 'confirmed')}</span>
                    <span className="text-[13px] font-semibold text-[#0F1F3D]">{formatCurrency(booking.bookingSummary?.total || 0)}</span>
                  </div>
                </div>
              )) : (
                <div className="py-2.5 text-xs text-[#8FA0B8]">No bookings yet. Share your booking link to activate the queue and email triggers.</div>
              )}
            </div>

            {/* Right column */}
            <div className="flex flex-col gap-4">
              <div className="rounded-xl border border-[rgba(15,31,61,0.12)] bg-white p-[18px]">
                <div className="mb-3.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[13px] font-semibold text-[#0F1F3D]">
                    <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" style={{ stroke: '#5A6A84', fill: 'none', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                    </svg>
                    Recent activity
                  </span>
                </div>
                {recentActivity.map((item) => (
                  <div key={item.id} className="flex items-start gap-2.5 border-b border-[rgba(15,31,61,0.12)] py-[9px]">
                    <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${item.tone === 'accent' ? 'bg-amber-50' : item.tone === 'brand' ? 'bg-emerald-50' : 'bg-ice-50'}`}>
                      <svg viewBox="0 0 24 24" className="h-[13px] w-[13px]" style={{ stroke: item.tone === 'accent' ? '#633806' : '#085041', fill: 'none', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                        {item.icon === 'calendar-check' ? <><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></>
                          : item.icon === 'home' ? <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>
                            : <><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></>}
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-[#0F1F3D]">{item.title}</div>
                      <div className="mt-0.5 text-[11px] text-[#8FA0B8]">{item.detail}</div>
                      <div className="mt-0.5 text-[11px] text-[#5A6A84]">{item.meta}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-[rgba(15,31,61,0.12)] bg-white p-[18px]">
                <div className="mb-3.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[13px] font-semibold text-[#0F1F3D]">
                    <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" style={{ stroke: '#5A6A84', fill: 'none', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                    Email triggers
                  </span>
                </div>
                {emailTriggers.map((item) => (
                  <div key={item.id} className="flex items-start gap-2.5 border-b border-[rgba(15,31,61,0.12)] py-[9px]">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50">
                      <svg viewBox="0 0 24 24" className="h-[13px] w-[13px]" style={{ stroke: '#085041', fill: 'none', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-[#0F1F3D]">{item.title}</div>
                      <div className="mt-0.5 text-[11px] text-[#8FA0B8]">{item.detail}</div>
                      {item.id !== 'email-empty' ? <div className="mt-0.5 text-[11px] font-medium text-[#1D9E75]">Active</div> : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Published listings */}
          <div className="rounded-xl border border-[rgba(15,31,61,0.12)] bg-white p-[18px]">
            <div className="mb-3.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[13px] font-semibold text-[#0F1F3D]">
                <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" style={{ stroke: '#5A6A84', fill: 'none', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                Published listings
              </span>
              <button type="button" onClick={() => onShowPage('management-listings')} className="border-none bg-transparent text-xs font-medium text-[#0F1F3D]">Manage all</button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {publishedListings.map((property) => (
                <div key={property.id} className="overflow-hidden rounded-xl border border-[rgba(15,31,61,0.12)] bg-white">
                  <div className="flex h-24 items-center justify-center overflow-hidden bg-[#1E3560]">
                    {property.image ? <img src={property.image} alt={property.name} className="h-full w-full object-cover" /> : <svg viewBox="0 0 24 24" className="h-7 w-7" style={{ stroke: 'rgba(255,255,255,0.4)', fill: 'none', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' }}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
                  </div>
                  <div className="px-[13px] py-[11px]">
                    <div className="truncate text-xs font-semibold text-[#0F1F3D]">{property.name}</div>
                    <div className="mt-0.5 text-[10px] text-[#8FA0B8]">{property.location}</div>
                    <div className="mb-[9px] mt-[7px] flex gap-1">
                      {(property.amenities || []).slice(0, 2).map((tag) => (
                        <span key={tag} className="whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] text-[#5A6A84]" style={{ border: '1px solid rgba(15,31,61,0.12)', background: '#F5F7FA' }}>{tag}</span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span><span className="text-[13px] font-bold text-[#0F1F3D]">{formatCurrency(property.price)}</span><span className="text-[10px] font-normal text-[#8FA0B8]">/night</span></span>
                      <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        property.publishStatus === 'draft' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-50 text-emerald-700'
                      }`}>{property.publishStatus === 'draft' ? 'Draft' : 'Published'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Owner & Evaluate + Email log */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-[rgba(15,31,61,0.12)] bg-white p-[18px]">
              <div className="mb-3.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[13px] font-semibold text-[#0F1F3D]">
                  <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" style={{ stroke: '#5A6A84', fill: 'none', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
                  </svg>
                  Owner & evaluate requests
                </span>
              </div>
              {ownerLeads.length || evalLeads.length ? (
                <>
                  {ownerLeads.map((app) => (
                    <div key={app.id} className="flex items-start gap-2.5 border-b border-[rgba(15,31,61,0.12)] py-[9px]">
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-amber-50">
                        <svg viewBox="0 0 24 24" className="h-[13px] w-[13px]" style={{ stroke: '#633806', fill: 'none', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-[#0F1F3D]">{app.ownerName}</div>
                        <div className="mt-0.5 text-[11px] text-[#8FA0B8]">{app.ownerAddress}</div>
                        <div className="mt-0.5 text-[10px] text-[#5A6A84]">{app.unitCount} unit{app.unitCount === '1' ? '' : 's'} · {app.budget}</div>
                      </div>
                    </div>
                  ))}
                  {evalLeads.map((sub) => (
                    <div key={sub.id} className="flex items-start gap-2.5 border-b border-[rgba(15,31,61,0.12)] py-[9px]">
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-amber-50">
                        <svg viewBox="0 0 24 24" className="h-[13px] w-[13px]" style={{ stroke: '#633806', fill: 'none', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                          <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-[#0F1F3D]">{sub.evaluatorName}</div>
                        <div className="mt-0.5 text-[11px] text-[#8FA0B8]">{sub.evaluatorAddress}</div>
                        <div className="mt-0.5 text-[10px] text-[#5A6A84]">{sub.evaluatorEmail}</div>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="py-6 text-center text-xs leading-relaxed text-[#8FA0B8]">
                  <svg viewBox="0 0 24 24" className="mx-auto mb-2.5 block h-7 w-7" style={{ stroke: '#8FA0B8', fill: 'none', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                    <path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
                  </svg>
                  No requests yet — new owner and evaluation submissions will appear here
                </div>
              )}
            </div>

            <div className="rounded-xl border border-[rgba(15,31,61,0.12)] bg-white p-[18px]">
              <div className="mb-3.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[13px] font-semibold text-[#0F1F3D]">
                  <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" style={{ stroke: '#5A6A84', fill: 'none', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                  Triggered email log
                </span>
              </div>
              {emailTriggers.map((item) => (
                <div key={item.id} className="flex items-start gap-2.5 border-b border-[rgba(15,31,61,0.12)] py-[9px]">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50">
                    <svg viewBox="0 0 24 24" className="h-[13px] w-[13px]" style={{ stroke: '#085041', fill: 'none', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-[#0F1F3D]">{item.title}</div>
                    <div className="mt-0.5 text-[11px] text-[#8FA0B8]">{item.detail}</div>
                    <div className="mt-0.5 text-[11px] font-medium text-[#1D9E75]">Active</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}