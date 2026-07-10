import { useState, useMemo } from 'react';

import { getWindowConfig, isInWindow } from '../../hooks/useManagementStudio';
import { Icon } from '../Icon';

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
  const uniqueWishlistedProperties = new Set(
    filteredEvents
      .filter((e) => e.type === 'wishlist_add')
      .map((e) => e.propertyId)
      .filter(Boolean),
  ).size;
  const searches = counts.search || 0;
  const bookings = filteredBookings.length;
  return {
    searches,
    bookings,
    pageViews: counts.page_view || 0,
    wishlistAdds: counts.wishlist_add || 0,
    supportMessages: filteredSupport.length,
    installPrompts: counts.install_prompt || 0,
    uniqueWishlistedProperties,
    conversionRate: searches ? Math.round((bookings / searches) * 100) : 0,
    recentEvents: filteredEvents.slice(0, 6),
  };
}

function formatAnalyticsEventLabel(type = 'activity') {
  return String(type)
    .replace(/_/g, ' ')
    .replace(/^\w/, (m) => m.toUpperCase());
}

function formatStatusCopy(status = 'paid') {
  return String(status || 'paid')
    .replace(/[-_]/g, ' ')
    .replace(/^\w/, (m) => m.toUpperCase());
}

function getInitials(name) {
  return String(name || '')
    .split(' ')
    .slice(0, 2)
    .map((p) => p.charAt(0))
    .join('')
    .toUpperCase();
}

export function DashboardPage({
  listings = [],
  bookings = [],
  bookingTransactions = [],
  emails = [],
  revenue = 0,
  ownerApplications = [],
  reviewSubmissions = [],
  onUpdateBookingStatus: _onUpdateBookingStatus,
  onRefundBooking: _onRefundBooking,
  onCancelBooking: _onCancelBooking,
  onShowPage,
  onSignOut,
  authUser,
  formatCurrency,
  analyticsEvents = [],
  supportRequests = [],
  onApproveOwner,
  onApproveEvaluation,
}) {
  const [analyticsWindow, setAnalyticsWindow] = useState('30d');
  const [pendingApprovalIds, setPendingApprovalIds] = useState(new Set());
  const analyticsSummary = useMemo(
    () => summarizeWindowedAnalytics(analyticsEvents, bookingTransactions, supportRequests, analyticsWindow),
    [analyticsEvents, analyticsWindow, bookingTransactions, supportRequests],
  );
  const analyticsWindowLabel = getWindowConfig(analyticsWindow).description;
  const liveListingsCount = listings.filter((l) => l.publishStatus !== 'draft' && !l.isDeleted).length;
  const draftListingsCount = listings.filter((l) => l.publishStatus === 'draft' && !l.isDeleted).length;
  const confirmedBookings = bookingTransactions.filter((b) => (b.bookingStatus || 'confirmed') === 'confirmed').length;
  const queuePreview = bookingTransactions.slice(0, 5);
  const userName = authUser?.user_metadata?.full_name || authUser?.email || 'Hora Admin';
  const initial = String(userName).trim().charAt(0).toUpperCase() || 'H';

  const recentActivity = useMemo(() => {
    const items = [];
    if (bookingTransactions[0])
      items.push({
        id: `booking-${bookingTransactions[0].id}`,
        icon: 'calendar-check',
        title: 'Booking confirmed',
        detail: bookingTransactions[0].bookingSummary.name,
        meta: `${bookingTransactions[0].bookingForm.checkin} · ${formatCurrency(bookingTransactions[0].bookingSummary.total)}`,
        tone: 'brand',
      });
    if (ownerApplications[0])
      items.push({
        id: `owner-${ownerApplications[0].id}`,
        icon: 'home',
        title: 'Owner lead received',
        detail: ownerApplications[0].ownerAddress,
        meta: ownerApplications[0].submittedAt
          ? new Date(ownerApplications[0].submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : 'Awaiting review',
        tone: 'accent',
      });
    if (analyticsSummary.recentEvents[0])
      items.push({
        id: `analytics-${analyticsSummary.recentEvents[0].id}`,
        icon: 'chart',
        title: formatAnalyticsEventLabel(analyticsSummary.recentEvents[0].type),
        detail: analyticsSummary.recentEvents[0].path || analyticsSummary.recentEvents[0].page || 'HoraStaycation',
        meta: analyticsSummary.searches ? `${analyticsSummary.searches} tracked searches` : 'No tracked searches yet',
        tone: 'ice',
      });
    if (!items.length)
      items.push({
        id: 'activity-empty',
        icon: 'chart',
        title: 'Workspace ready',
        detail: 'No recent activity yet',
        meta: 'Bookings, owner leads, and analytics will populate this feed',
        tone: 'ice',
      });
    return items.slice(0, 3);
  }, [analyticsSummary, bookingTransactions, formatCurrency, ownerApplications]);

  const emailTriggers = useMemo(() => {
    if (emails.length)
      return emails
        .slice(0, 3)
        .map((email, index) => ({ id: `${email.title}-${index}`, title: email.title, detail: email.detail }));
    return [
      {
        id: 'email-empty',
        title: 'Triggers standing by',
        detail: 'Guest, owner, and management emails will appear here once activity begins.',
      },
    ];
  }, [emails]);

  const statCards = [
    {
      id: 'confirmed',
      label: 'Confirmed Bookings',
      value: confirmedBookings,
      caption: confirmedBookings ? 'Ready to host' : 'No bookings yet',
      color: 'brand',
    },
    {
      id: 'revenue',
      label: 'Revenue',
      value: formatCurrency(revenue),
      caption: 'This month',
      color: 'green',
    },
    {
      id: 'owners',
      label: 'Owner Leads',
      value: ownerApplications.length,
      caption: ownerApplications.length ? 'Needs review' : 'Awaiting follow-up',
      color: 'amber',
    },
    {
      id: 'evaluations',
      label: 'Evaluate Leads',
      value: reviewSubmissions.length,
      caption: reviewSubmissions.length ? 'Needs review' : 'Pending review',
      color: 'purple',
    },
    {
      id: 'listings-live',
      label: 'Listings Live',
      value: liveListingsCount,
      caption: draftListingsCount ? `${draftListingsCount} in draft` : 'All published',
      color: 'cyan',
    },
    {
      id: 'emails-sent',
      label: 'Emails Sent',
      value: emails.length,
      caption: 'All triggers active',
      color: 'slate',
    },
  ];

  const colorMap = {
    brand: 'bg-brand-50 text-brand-700',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    purple: 'bg-purple-50 text-purple-700',
    cyan: 'bg-cyan-50 text-cyan-700',
    slate: 'bg-slate-100 text-slate-600',
  };

  return (
    <section className="min-h-screen bg-white px-4 pb-16 pt-28 md:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Page Header */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
              Management
            </div>
            <h1 className="font-display text-4xl font-bold text-brand-950 md:text-5xl">Dashboard</h1>
            <p className="mt-2 text-lg text-slate-500">
              Welcome back,{' '}
              <span className="font-semibold text-brand-800">
                {authUser?.user_metadata?.full_name || authUser?.email || 'Admin'}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onShowPage('management-listings')}
              className="btn-primary px-5 py-2.5 text-sm"
            >
              + New Listing
            </button>
            <button
              type="button"
              onClick={() => onShowPage('booking')}
              className="rounded-full border border-brand-200 bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
            >
              View Booking Page
            </button>
            <button
              type="button"
              onClick={onSignOut}
              className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {statCards.map((card) => {
            const isLeadCard = card.id === 'owners' || card.id === 'evaluations';
            return (
              <div
                key={card.id}
                onClick={isLeadCard ? () => {
                  document.getElementById('portal-leads')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } : undefined}
                className={`rounded-[1.2rem] border border-brand-100 bg-white p-6 shadow-sm ${
                  isLeadCard ? 'cursor-pointer hover:border-brand-300 transition-all duration-200' : ''
                }`}
              >
                <div className={`mb-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${colorMap[card.color]}`}>
                  {card.label}
                </div>
                <div className="font-display text-4xl font-bold text-brand-950">{card.value}</div>
                <div className="mt-1.5 text-sm text-slate-500">{card.caption}</div>
              </div>
            );
          })}
        </div>

        {/* Analytics Bar */}
        <div id="portal-analytics" className="mb-8 rounded-[1.2rem] border border-brand-100 bg-ice-50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-base font-semibold text-brand-950">
                Analytics —{' '}
                <span className="font-normal text-slate-500">{analyticsWindowLabel}</span>
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {analyticsSummary.pageViews} page views &middot; {analyticsSummary.bookings} bookings &middot;{' '}
                {analyticsSummary.conversionRate}% conversion &middot;{' '}
                {analyticsSummary.searches
                  ? `${analyticsSummary.searches} tracked searches`
                  : 'no tracked searches yet'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex overflow-hidden rounded-full border border-brand-100 bg-white">
                {WINDOW_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setAnalyticsWindow(option.id)}
                    className={`px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] transition ${
                      analyticsWindow === option.id
                        ? 'bg-brand-950 text-white'
                        : 'text-slate-500 hover:text-brand-800'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">

          {/* Left Column (Queue & Leads) */}
          <div className="flex flex-col gap-6">

            {/* Booking Queue */}
            <div id="portal-queue" className="rounded-[1.2rem] border border-brand-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-brand-950">Live Booking Queue</h2>
              <button
                type="button"
                onClick={() => onShowPage('booking')}
                className="text-sm font-semibold text-brand-600 hover:text-brand-800"
              >
                View all →
              </button>
            </div>
            {queuePreview.length ? (
              <div className="space-y-3">
                {queuePreview.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center gap-4 rounded-2xl border border-ice-100 bg-ice-50 p-4"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-sm font-bold text-brand-800">
                      {getInitials(booking.bookingSummary?.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-brand-950">
                        {booking.bookingSummary?.name || 'Staycation'}
                      </p>
                      <p className="mt-0.5 text-sm text-slate-500">
                        {booking.bookingForm?.checkin} – {booking.bookingForm?.checkout} &middot;{' '}
                        {booking.bookingSummary?.nights || 0} night
                        {(booking.bookingSummary?.nights || 0) > 1 ? 's' : ''} &middot;{' '}
                        {booking.bookingForm?.guests || '?'} pax
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          (booking.bookingStatus || 'confirmed') === 'confirmed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {formatStatusCopy(booking.bookingStatus || 'confirmed')}
                      </span>
                      <span className="text-base font-bold text-brand-950">
                        {formatCurrency(booking.bookingSummary?.total || 0)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-brand-200 bg-ice-50 px-6 py-10 text-center">
                <p className="font-semibold text-brand-950">No bookings yet</p>
                <p className="mt-1 text-sm text-slate-500">
                  Share your booking link to activate the queue and email triggers.
                </p>
              </div>
            )}
          </div>

          {/* Owner Leads & Evaluations Section */}
          <div id="portal-leads" className="rounded-[1.2rem] border border-brand-100 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-brand-950">Owner Leads & Evaluation Requests</h2>
              <p className="text-sm text-slate-500 mt-1">Review partnership and staycation evaluation proposals from property owners.</p>
            </div>
            
            <div className="space-y-6">
              {/* Owner Leads Subsection */}
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-amber-750 mb-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                  Owner Applications ({ownerApplications.length})
                </h3>
                {ownerApplications.length ? (
                  <div className="grid gap-3">
                    {ownerApplications.map((app) => (
                      <div key={app.id} className="rounded-2xl border border-ice-100 bg-ice-50 p-4">
                        <div className="flex justify-between items-start">
                          <h4 className="font-semibold text-brand-950">{app.ownerName}</h4>
                          <span className="text-xs text-slate-400">
                            {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Pending'}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">Location: {app.ownerAddress}</p>
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-brand-700 font-medium">
                          <span>📧 {app.ownerEmail}</span>
                          <span>🏢 {app.unitCount} unit(s)</span>
                          <span>💰 Budget: {app.budget}</span>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          {app.approved ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                              Approved
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={pendingApprovalIds.has(app.id)}
                              onClick={async () => {
                                setPendingApprovalIds((prev) => new Set(prev).add(app.id));
                                try {
                                  await onApproveOwner?.(app.id);
                                } finally {
                                  setPendingApprovalIds((prev) => {
                                    const next = new Set(prev);
                                    next.delete(app.id);
                                    return next;
                                  });
                                }
                              }}
                              className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {pendingApprovalIds.has(app.id) ? 'Approving…' : 'Approve'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic bg-slate-50 rounded-2xl p-4 border border-dashed border-slate-200">No owner leads submitted yet.</p>
                )}
              </div>

              {/* Evaluation Requests Subsection */}
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-purple-750 mb-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-purple-500"></span>
                  Evaluation Requests ({reviewSubmissions.length})
                </h3>
                {reviewSubmissions.length ? (
                  <div className="grid gap-3">
                    {reviewSubmissions.map((rev) => (
                      <div key={rev.id} className="rounded-2xl border border-ice-100 bg-ice-50 p-4">
                        <div className="flex justify-between items-start">
                          <h4 className="font-semibold text-brand-950">{rev.evaluatorName}</h4>
                          <span className="text-xs text-slate-400">
                            {rev.submittedAt ? new Date(rev.submittedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Pending'}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">Location: {rev.evaluatorAddress}</p>
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-brand-700 font-medium">
                          <span>📧 {rev.evaluatorEmail}</span>
                          <span>🏢 {rev.unitCount} unit(s)</span>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          {rev.approved ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                              Approved
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={pendingApprovalIds.has(rev.id)}
                              onClick={async () => {
                                setPendingApprovalIds((prev) => new Set(prev).add(rev.id));
                                try {
                                  await onApproveEvaluation?.(rev.id);
                                } finally {
                                  setPendingApprovalIds((prev) => {
                                    const next = new Set(prev);
                                    next.delete(rev.id);
                                    return next;
                                  });
                                }
                              }}
                              className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {pendingApprovalIds.has(rev.id) ? 'Approving…' : 'Approve'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic bg-slate-50 rounded-2xl p-4 border border-dashed border-slate-200">No evaluation requests submitted yet.</p>
                )}
              </div>
            </div>
          </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-6">

            {/* Recent Activity */}
            <div id="portal-activity" className="rounded-[1.2rem] border border-brand-100 bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-lg font-bold text-brand-950">Recent Activity</h2>
              <div className="space-y-3">
                {recentActivity.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 rounded-2xl border border-ice-100 bg-ice-50 p-4"
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        item.tone === 'accent'
                          ? 'bg-amber-50'
                          : item.tone === 'brand'
                            ? 'bg-emerald-50'
                            : 'bg-brand-50'
                      }`}
                    >
                      <Icon
                        name={item.icon === 'calendar-check' ? 'check' : item.icon === 'home' ? 'home' : 'chart'}
                        className={`text-sm ${
                          item.tone === 'accent'
                            ? 'text-amber-700'
                            : item.tone === 'brand'
                              ? 'text-emerald-700'
                              : 'text-brand-600'
                        }`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-brand-950">{item.title}</p>
                      <p className="mt-0.5 text-sm text-slate-500">{item.detail}</p>
                      <p className="mt-0.5 text-xs text-slate-400">{item.meta}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Email Triggers */}
            <div id="portal-email-triggers" className="rounded-[1.2rem] border border-brand-100 bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-lg font-bold text-brand-950">Email Triggers</h2>
              <div className="space-y-3">
                {emailTriggers.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 rounded-2xl border border-ice-100 bg-ice-50 p-4"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                      <Icon name="check" className="text-sm text-emerald-700" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-brand-950">{item.title}</p>
                      <p className="mt-0.5 text-sm text-slate-500">{item.detail}</p>
                      {item.id !== 'email-empty' ? (
                        <span className="mt-1.5 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          Active
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Quick Nav */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Manage Listings', desc: 'Add, edit, or remove properties', page: 'management-listings' },
            { label: 'Upload Studio', desc: 'Upload images and media assets', page: 'management-listings' },
            { 
              label: 'Owner & Evaluate Leads', 
              desc: `${ownerApplications.length + reviewSubmissions.length} pending review`, 
              action: () => {
                document.getElementById('portal-leads')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              } 
            },
            { label: 'Booking Page', desc: 'View the live booking interface', page: 'booking' },
          ].map((nav) => (
            <button
              key={nav.label}
              type="button"
              onClick={nav.action || (() => onShowPage(nav.page))}
              className="rounded-[1.2rem] border border-brand-100 bg-white p-5 text-left shadow-sm transition hover:border-brand-300 hover:bg-brand-50"
            >
              <p className="font-semibold text-brand-950">{nav.label}</p>
              <p className="mt-1 text-sm text-slate-500">{nav.desc}</p>
            </button>
          ))}
        </div>

      </div>
    </section>
  );
}
