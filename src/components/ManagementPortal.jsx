import { useEffect, useMemo, useState } from 'react';
import { FEATURED_PROPERTIES } from '../data/siteData';
import { deleteMediaFile, saveMediaFile } from '../lib/mediaStorage';
import { Icon } from './Icon';

const WINDOW_OPTIONS = [
  { id: '7d', label: '7D', description: 'Last 7 days', days: 7, buckets: 7 },
  { id: '30d', label: '30D', description: 'Last 30 days', days: 30, buckets: 6 },
  { id: '90d', label: '90D', description: 'Last 90 days', days: 90, buckets: 6 },
  { id: 'all', label: 'All', description: 'All tracked time', days: null, buckets: 6 },
];

const MEDIA_FIELD_CONFIG = {
  image: {
    assetField: 'imageAsset',
    accept: 'image/*',
    label: 'Hero Photo Upload',
    helper: 'Upload the main client-facing hero image.',
  },
  summaryImage: {
    assetField: 'summaryImageAsset',
    accept: 'image/*',
    label: 'Summary Photo Upload',
    helper: 'Upload the image shown in booking summaries.',
  },
  thumbnail: {
    assetField: 'thumbnailAsset',
    accept: 'image/*',
    label: 'Thumbnail Upload',
    helper: 'Upload the smaller card image used in the booking list.',
  },
  videoUrl: {
    assetField: 'videoAsset',
    accept: 'video/*',
    label: 'Video Walkthrough Upload',
    helper: 'Upload a short walkthrough video for the listing.',
  },
};

const LISTING_PRESETS = [
  {
    id: 'beachfront-villa',
    title: 'Beachfront Villa',
    facilities: ['Infinity Pool', 'Private Beach Access', 'BBQ Deck', 'WiFi', 'Outdoor Shower'],
    schedule: 'Daily check-in from 3:00 PM · Sunset concierge from 5:30 PM · Check-out before 11:00 AM',
    statusNote: 'Beachfront highlight now live',
    mood: 'Ocean-facing stay with breezy social spaces, polished arrival moments, and sunset-ready lounging.',
    bestFor: 'Best for family holidays, bridal parties, and premium short escapes',
  },
  {
    id: 'forest-cabin',
    title: 'Forest Cabin',
    facilities: ['Fire Pit', 'Mountain View Deck', 'Coffee Bar', 'WiFi', 'Private Parking'],
    schedule: 'Self check-in from 4:00 PM · Quiet hours from 10:00 PM · Check-out before 11:00 AM',
    statusNote: 'Forest retreat schedule refreshed',
    mood: 'A calm woodland escape shaped for slower mornings, layered textures, and private evening gatherings.',
    bestFor: 'Best for couples, creators, and restorative weekend stays',
  },
  {
    id: 'urban-loft',
    title: 'Urban Loft',
    facilities: ['Rooftop Access', 'Smart Lock', 'Workspace', 'Streaming TV', 'Fast WiFi'],
    schedule: 'Express check-in from 2:00 PM · Weekday priority stays · Check-out before 12:00 PM',
    statusNote: 'Urban quick-stay preset active',
    mood: 'A compact city stay with efficient flow, strong visual styling, and easy work-to-rest transitions.',
    bestFor: 'Best for business trips, staycations, and content shoots',
  },
];

const MEDIA_FIELD_ORDER = ['image', 'summaryImage', 'thumbnail', 'videoUrl'];

const STUDIO_SECTIONS = [
  { id: 'basic', eyebrow: 'Basic Info', title: 'Core listing settings' },
  { id: 'media', eyebrow: 'Media', title: 'Photos, thumbnails, and video' },
  { id: 'schedule', eyebrow: 'Schedule & Availability', title: 'Guest windows and blocked dates' },
  { id: 'copy', eyebrow: 'Copy & Description', title: 'Guest-facing story and amenities' },
];

function getTimestamp(value) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? null : parsed;
}

function getWindowConfig(windowId = '30d') {
  return WINDOW_OPTIONS.find((option) => option.id === windowId) || WINDOW_OPTIONS[1];
}

function isInWindow(value, windowId) {
  const config = getWindowConfig(windowId);

  if (!config.days) {
    return true;
  }

  const timestamp = getTimestamp(value);
  if (!timestamp) {
    return false;
  }

  return timestamp >= Date.now() - config.days * 24 * 60 * 60 * 1000;
}

function summarizeWindowedAnalytics(events = [], bookingTransactions = [], supportRequests = [], windowId = '30d') {
  const filteredEvents = events.filter((event) => isInWindow(event.createdAt, windowId));
  const filteredBookings = bookingTransactions.filter((booking) => isInWindow(booking.submittedAt, windowId));
  const filteredSupport = supportRequests.filter((request) => isInWindow(request.submittedAt, windowId));

  const counts = filteredEvents.reduce((summary, event) => {
    const nextSummary = { ...summary };
    nextSummary[event.type] = (nextSummary[event.type] || 0) + 1;
    return nextSummary;
  }, {});

  const wishlistedPropertyIds = new Set(
    filteredEvents
      .filter((event) => event.type === 'wishlist_add')
      .map((event) => event.propertyId)
      .filter(Boolean),
  );

  const searches = counts.search || 0;
  const bookings = filteredBookings.length;

  return {
    searches,
    bookings,
    pageViews: counts.page_view || 0,
    wishlistAdds: counts.wishlist_add || 0,
    supportMessages: filteredSupport.length,
    installPrompts: counts.install_prompt || 0,
    uniqueWishlistedProperties: wishlistedPropertyIds.size,
    conversionRate: searches ? Math.round((bookings / searches) * 100) : 0,
    recentEvents: filteredEvents.slice(0, 6),
  };
}

function buildSparklinePoints(events = [], bookingTransactions = [], supportRequests = [], windowId = '30d') {
  const config = getWindowConfig(windowId);
  const bucketCount = config.buckets;
  const daySpan = config.days || 42;
  const bucketSpan = Math.max(1, Math.ceil(daySpan / bucketCount));
  const now = Date.now();

  const points = Array.from({ length: bucketCount }, (_, index) => {
    const rangeEnd = now - (bucketCount - index - 1) * bucketSpan * 24 * 60 * 60 * 1000;
    const rangeStart = rangeEnd - bucketSpan * 24 * 60 * 60 * 1000;

    const count =
      events.filter((event) => {
        const timestamp = getTimestamp(event.createdAt);
        return timestamp && timestamp >= rangeStart && timestamp < rangeEnd;
      }).length +
      bookingTransactions.filter((booking) => {
        const timestamp = getTimestamp(booking.submittedAt);
        return timestamp && timestamp >= rangeStart && timestamp < rangeEnd;
      }).length +
      supportRequests.filter((request) => {
        const timestamp = getTimestamp(request.submittedAt);
        return timestamp && timestamp >= rangeStart && timestamp < rangeEnd;
      }).length;

    return {
      id: `${windowId}-${index}`,
      label: `${index + 1}`,
      count,
    };
  });

  return points;
}

function formatAnalyticsEventLabel(type = 'activity') {
  return String(type)
    .replace(/_/g, ' ')
    .replace(/^\w/, (match) => match.toUpperCase());
}

function getPaymentStatusClasses(status = 'paid') {
  const normalized = String(status || 'paid').toLowerCase();

  if (normalized === 'paid') {
    return 'bg-emerald-50 text-emerald-700';
  }

  if (normalized === 'refunded') {
    return 'bg-amber-50 text-amber-700';
  }

  if (normalized === 'failed' || normalized === 'expired') {
    return 'bg-rose-50 text-rose-700';
  }

  if (normalized === 'cancelled') {
    return 'bg-slate-100 text-slate-600';
  }

  return 'bg-ice-50 text-brand-700';
}

function formatStatusCopy(status = 'paid') {
  return String(status || 'paid').replace(/[-_]/g, ' ').replace(/^\w/, (match) => match.toUpperCase());
}

function getListingFormState(listing) {
  return {
    id: listing.id,
    name: listing.name,
    location: listing.location,
    price: String(listing.price),
    image: listing.image || '',
    summaryImage: listing.summaryImage || '',
    thumbnail: listing.thumbnail || '',
    videoUrl: listing.videoUrl || '',
    facilitiesText: (listing.amenities || []).join(', '),
    schedule: listing.schedule || '',
    mood: listing.mood || '',
    bestFor: listing.bestFor || '',
    statusNote: listing.statusNote || '',
    publishStatus: listing.publishStatus || 'published',
    availabilityNotes: listing.availabilityNotes || '',
    blockedDatesText: (listing.blockedDates || []).join(', '),
    imageAsset: listing.imageAsset || null,
    summaryImageAsset: listing.summaryImageAsset || null,
    thumbnailAsset: listing.thumbnailAsset || null,
    videoAsset: listing.videoAsset || null,
  };
}

function createEmptyListing() {
  const id = `listing-${crypto.randomUUID().slice(0, 8)}`;

  return {
    id,
    name: 'New Staycation Listing',
    location: '',
    price: 0,
    image: '',
    summaryImage: '',
    thumbnail: '',
    videoUrl: '',
    amenities: [],
    schedule: '',
    mood: '',
    bestFor: '',
    statusNote: 'Draft listing',
    publishStatus: 'draft',
    availabilityNotes: '',
    blockedDates: [],
    imageAsset: null,
    summaryImageAsset: null,
    thumbnailAsset: null,
    videoAsset: null,
  };
}

function formatFileSize(size = 0) {
  if (!Number.isFinite(size) || size <= 0) {
    return '0 KB';
  }

  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

function getMediaPreviewValue(fieldName, mediaPreviews, selectedListing) {
  if (mediaPreviews[fieldName]) {
    return mediaPreviews[fieldName];
  }

  return selectedListing?.[fieldName] || '';
}

function getListingBadge(property) {
  if (property.publishStatus === 'draft') {
    return { label: 'Draft', className: 'bg-slate-100 text-slate-700' };
  }

  if (property.blockedDates?.length) {
    return { label: 'Blocked', className: 'bg-amber-50 text-amber-700' };
  }

  return { label: 'Published', className: 'bg-emerald-50 text-emerald-700' };
}

function DashboardStat({ stat, formatCurrency }) {
  const value = stat.currency ? formatCurrency(stat.value) : stat.value;
  const quietCard = stat.value === 0;

  return (
    <article
      className={`rounded-3xl border p-5 shadow-sm transition ${
        quietCard
          ? 'border-dashed border-ice-200 bg-slate-50/80 text-slate-500'
          : 'border-ice-200 bg-white text-brand-950'
      }`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className={`text-xs font-semibold uppercase tracking-[0.2em] ${quietCard ? 'text-slate-400' : 'text-brand-500'}`}>
          {stat.label}
        </span>
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
            quietCard ? 'bg-white text-slate-400 shadow-sm' : 'bg-brand-50 text-brand-600'
          }`}
        >
          <Icon name={stat.icon} />
        </span>
      </div>
      <div className={`text-3xl font-black ${quietCard ? 'text-slate-400' : 'number-gradient'}`}>{value}</div>
      <p className={`mt-3 text-sm leading-relaxed ${quietCard ? 'text-slate-400' : 'text-slate-500'}`}>
        {quietCard ? stat.emptyLabel : stat.helper}
      </p>
    </article>
  );
}

function ManagementPortalHeader({
  title,
  eyebrow,
  description,
  authUser,
  onSignOut,
  onShowPage,
  primaryAction,
  secondaryAction,
}) {
  return (
    <div className="rounded-[2rem] border border-brand-100 bg-white/90 p-6 shadow-sm backdrop-blur-sm">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-500">{eyebrow}</p>
          <h1 className="mt-3 font-display text-4xl font-bold text-brand-950 md:text-5xl">{title}</h1>
          <p className="mt-3 text-base leading-relaxed text-slate-600">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {authUser?.email ? (
            <div className="inline-flex items-center rounded-full border border-ice-200 bg-ice-50 px-4 py-2 text-sm font-medium text-slate-600">
              {authUser.email}
            </div>
          ) : null}
          {secondaryAction ? (
            <button type="button" onClick={secondaryAction.onClick} className="btn-outline px-5 py-3 text-sm">
              {secondaryAction.label}
            </button>
          ) : null}
          {primaryAction ? (
            <button type="button" onClick={primaryAction.onClick} className="btn-primary px-5 py-3 text-sm">
              <span className="inline-flex items-center gap-2">
                {primaryAction.label}
                <Icon name="arrow-right" />
              </span>
            </button>
          ) : null}
          <button type="button" onClick={() => onShowPage('landing')} className="btn-outline px-5 py-3 text-sm">
            Return to Site
          </button>
          <button type="button" onClick={onSignOut} className="btn-outline px-5 py-3 text-sm">
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

function OperationsSnapshot({ bookings, revenue, ownerApplications, reviewSubmissions, formatCurrency }) {
  const items = [
    { id: 'bookings', label: 'Bookings', value: bookings.length, helper: 'Confirmed and pending checkout activity' },
    { id: 'revenue', label: 'Live Revenue', value: formatCurrency(revenue), helper: 'Refunded bookings are excluded from this number' },
    { id: 'owners', label: 'Owner Leads', value: ownerApplications.length, helper: 'Fresh owners waiting for review' },
    { id: 'reviews', label: 'Evaluate Leads', value: reviewSubmissions.length, helper: 'New property evaluation requests' },
  ];

  return (
    <section id="portal-overview" className="rounded-[2rem] bg-brand-950 p-6 text-white shadow-xl">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-white/55">Operations Snapshot</div>
          <h2 className="mt-2 font-display text-3xl font-bold">Today&apos;s operating picture</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/70">
            The high-level pulse now lives at the top so operators can assess demand, revenue, and pipeline health before scanning the queue.
          </p>
        </div>
        <div className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/75">
          Moved up for faster scanning
        </div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <div key={item.id} className="rounded-3xl bg-white/8 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">{item.label}</div>
            <div className="mt-3 text-3xl font-black">{item.value}</div>
            <p className="mt-2 text-sm text-white/60">{item.helper}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function QuickJumpNav({ onShowPage }) {
  const items = [
    { href: '#portal-overview', label: 'Snapshot', icon: 'chart' },
    { href: '#portal-analytics', label: 'Analytics', icon: 'trend' },
    { href: '#portal-queue', label: 'Live Queue', icon: 'calendar' },
    { href: '#portal-published', label: 'Published Listings', icon: 'home' },
    { href: '#portal-requests', label: 'Owner & Evaluate', icon: 'users' },
    { href: '#portal-emails', label: 'Email Activity', icon: 'email' },
  ];

  return (
    <aside className="xl:sticky xl:top-28 xl:self-start">
      <div className="rounded-[1.8rem] border border-ice-200 bg-white p-5 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-500">Quick Jump</div>
        <div className="mt-4 space-y-2">
          {items.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center justify-between rounded-2xl border border-transparent bg-ice-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-100 hover:bg-brand-50 hover:text-brand-700"
            >
              <span className="inline-flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm">
                  <Icon name={item.icon} />
                </span>
                {item.label}
              </span>
              <Icon name="arrow-right" className="text-xs text-slate-400" />
            </a>
          ))}
        </div>
        <button type="button" onClick={() => onShowPage('management-listings')} className="btn-primary mt-4 w-full py-3 text-sm">
          <span className="inline-flex items-center gap-2">
            + New Listing
            <Icon name="upload" />
          </span>
        </button>
      </div>
    </aside>
  );
}

function AnalyticsSparkline({ points }) {
  const peak = Math.max(...points.map((point) => point.count), 1);

  return (
    <div className="rounded-3xl border border-ice-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-brand-950">Activity trend</div>
          <div className="text-xs text-slate-400">Searches, bookings, and support activity over time</div>
        </div>
        <span className="rounded-full bg-ice-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Sparkline
        </span>
      </div>
      <div className="flex h-28 items-end gap-2">
        {points.map((point) => (
          <div key={point.id} className="flex flex-1 flex-col items-center gap-2">
            <div
              className={`w-full rounded-t-2xl ${point.count ? 'bg-gradient-to-t from-brand-700 via-brand-500 to-accent-400' : 'bg-ice-100'}`}
              style={{ height: `${Math.max(14, (point.count / peak) * 100)}%` }}
              title={`${point.count} activity item(s)`}
            />
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">{point.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyBookingState({ onShowPage }) {
  return (
    <div className="rounded-[1.8rem] border border-dashed border-ice-200 bg-gradient-to-br from-white to-ice-50 p-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-brand-50 text-2xl text-brand-600 shadow-sm">
            <Icon name="calendar-check" />
          </div>
          <div className="max-w-2xl">
            <div className="text-lg font-semibold text-brand-950">Your live booking queue is empty</div>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              New client bookings will appear here after checkout is completed. Share your booking link so operators see their first real reservation instead of an empty panel.
            </p>
          </div>
        </div>
        <button type="button" onClick={() => onShowPage('booking')} className="btn-primary px-5 py-3 text-sm">
          <span className="inline-flex items-center gap-2">
            Share your booking link to get started
            <Icon name="arrow-right" />
          </span>
        </button>
      </div>
    </div>
  );
}

function PublishedListingsGrid({ listings, formatCurrency, compact = false }) {
  return (
    <div className={`grid gap-4 ${compact ? 'md:grid-cols-1' : 'md:grid-cols-2 xl:grid-cols-3'}`}>
      {listings.map((property) => {
        const badge = getListingBadge(property);

        return (
          <article key={property.id} className="overflow-hidden rounded-[1.8rem] border border-ice-200 bg-white shadow-sm">
            <img src={property.thumbnail} alt={property.name} className={`w-full object-cover ${compact ? 'h-36' : 'h-40'}`} />
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="truncate text-lg font-semibold text-brand-950">{property.name}</div>
                  <div className="mt-1 text-sm text-slate-500">{property.location}</div>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}>{badge.label}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {(property.amenities || []).slice(0, compact ? 2 : 3).map((item) => (
                  <span key={item} className="rounded-full bg-ice-50 px-3 py-1 text-xs font-semibold text-slate-600">
                    {item}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex items-end justify-between gap-4">
                <div className="text-sm text-slate-500">
                  {property.schedule || property.statusNote || 'Listing details are ready for guests.'}
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-brand-700">{formatCurrency(property.price)}</div>
                  <div className="text-xs text-slate-400">per night</div>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function CollapsibleStudioSection({ id, eyebrow, title, open, onToggle, children }) {
  return (
    <section id={id} className="rounded-[1.8rem] border border-ice-200 bg-white p-5 shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 text-left"
        aria-expanded={open}
        aria-controls={`${id}-panel`}
      >
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">{eyebrow}</div>
          <h2 className="mt-2 font-display text-2xl font-bold text-brand-950">{title}</h2>
        </div>
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ice-50 text-brand-600 shadow-sm">
          <Icon name={open ? 'eye-off' : 'eye'} />
        </span>
      </button>
      {open ? (
        <div id={`${id}-panel`} className="mt-5">
          {children}
        </div>
      ) : null}
    </section>
  );
}

function useManagementStudio(listings, onSaveListing, onDeleteListing) {
  const [selectedListingId, setSelectedListingId] = useState(listings[0]?.id ?? '');
  const [listingForm, setListingForm] = useState(() => getListingFormState(listings[0] ?? FEATURED_PROPERTIES[0]));
  const [isSavingListing, setIsSavingListing] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [mediaPreviews, setMediaPreviews] = useState({});
  const [pendingMediaFiles, setPendingMediaFiles] = useState({});
  const [draftListing, setDraftListing] = useState(null);
  const [studioMessage, setStudioMessage] = useState('');
  const [draggingField, setDraggingField] = useState('');
  const [bulkUploadField, setBulkUploadField] = useState('image');
  const [bulkListingIds, setBulkListingIds] = useState([]);
  const [isBulkUploading, setIsBulkUploading] = useState(false);

  const availableListings = draftListing ? [draftListing, ...listings] : listings;
  const selectedListing = useMemo(
    () => availableListings.find((listing) => listing.id === selectedListingId) ?? availableListings[0] ?? FEATURED_PROPERTIES[0],
    [availableListings, selectedListingId],
  );
  const mediaCards = useMemo(
    () =>
      MEDIA_FIELD_ORDER.map((fieldName) => ({
        fieldName,
        config: MEDIA_FIELD_CONFIG[fieldName],
        preview: getMediaPreviewValue(fieldName, mediaPreviews, selectedListing),
        asset: listingForm[MEDIA_FIELD_CONFIG[fieldName].assetField],
      })),
    [listingForm, mediaPreviews, selectedListing],
  );
  const selectedBulkListings = useMemo(
    () => availableListings.filter((listing) => bulkListingIds.includes(listing.id)),
    [availableListings, bulkListingIds],
  );

  useEffect(() => {
    if (!selectedListing) {
      return;
    }

    setListingForm(getListingFormState(selectedListing));
    setMediaPreviews({});
    setPendingMediaFiles({});
    setUploadError('');
    setStudioMessage('');
  }, [selectedListing]);

  useEffect(() => {
    if (!availableListings.some((listing) => listing.id === selectedListingId)) {
      setSelectedListingId(availableListings[0]?.id ?? '');
    }
  }, [availableListings, selectedListingId]);

  useEffect(() => {
    setBulkListingIds((current) => current.filter((listingId) => availableListings.some((listing) => listing.id === listingId)));
  }, [availableListings]);

  useEffect(() => {
    const previewUrls = Object.values(mediaPreviews);

    return () => {
      previewUrls.forEach((previewUrl) => {
        if (typeof previewUrl === 'string' && previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(previewUrl);
        }
      });
    };
  }, [mediaPreviews]);

  function handleListingFieldChange(event) {
    const { name, value } = event.target;
    const mediaConfig = MEDIA_FIELD_CONFIG[name];
    const currentAsset = mediaConfig ? listingForm[mediaConfig.assetField] : null;

    if (currentAsset?.id) {
      void deleteMediaFile(currentAsset);
    }

    setListingForm((current) => ({
      ...current,
      [name]: value,
      ...(mediaConfig ? { [mediaConfig.assetField]: null } : {}),
    }));

    if (mediaConfig) {
      setStudioMessage('');
      setMediaPreviews((current) => {
        const next = { ...current };
        delete next[name];
        return next;
      });
      setPendingMediaFiles((current) => {
        const next = { ...current };
        delete next[name];
        return next;
      });
    }
  }

  async function uploadMediaFileToField(fieldName, file) {
    const mediaConfig = MEDIA_FIELD_CONFIG[fieldName];

    if (!mediaConfig || !(file instanceof File)) {
      return;
    }

    if (mediaConfig.accept === 'image/*' && !file.type.startsWith('image/')) {
      throw new Error('Please drop an image file for this field.');
    }

    if (mediaConfig.accept === 'video/*' && !file.type.startsWith('video/')) {
      throw new Error('Please drop a video file for this field.');
    }

    setIsUploadingMedia(fieldName);
    setUploadError('');
    setStudioMessage('');

    try {
      const currentAsset = listingForm[mediaConfig.assetField];

      if (currentAsset?.id) {
        await deleteMediaFile(currentAsset);
      }

      const mediaRef = await saveMediaFile(file, fieldName);

      if (!mediaRef) {
        throw new Error('Your browser does not support local media uploads in this environment.');
      }

      const previewUrl = URL.createObjectURL(file);

      setListingForm((current) => ({
        ...current,
        [mediaConfig.assetField]: mediaRef,
      }));
      setMediaPreviews((current) => {
        const existingPreview = current[fieldName];

        if (typeof existingPreview === 'string' && existingPreview.startsWith('blob:')) {
          URL.revokeObjectURL(existingPreview);
        }

        return {
          ...current,
          [fieldName]: previewUrl,
        };
      });
      setPendingMediaFiles((current) => ({
        ...current,
        [fieldName]: file,
      }));
      setStudioMessage(`${file.name} is staged for ${mediaConfig.label.toLowerCase()}. Save the listing to publish it.`);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed. Please try again.');
    } finally {
      setIsUploadingMedia('');
    }
  }

  async function handleMediaUpload(fieldName, event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    await uploadMediaFileToField(fieldName, file);
    event.target.value = '';
  }

  function handleCreateListing() {
    const nextDraft = createEmptyListing();
    setDraftListing(nextDraft);
    setSelectedListingId(nextDraft.id);
    setListingForm(getListingFormState(nextDraft));
    setPendingMediaFiles({});
    setMediaPreviews({});
    setUploadError('');
    setStudioMessage('New listing draft created. Apply a preset or start dropping media files into the upload studio.');
  }

  function clearMediaField(fieldName) {
    const mediaConfig = MEDIA_FIELD_CONFIG[fieldName];

    if (!mediaConfig) {
      return;
    }

    const currentAsset = listingForm[mediaConfig.assetField];

    if (currentAsset?.id) {
      void deleteMediaFile(currentAsset);
    }

    setListingForm((current) => ({
      ...current,
      [fieldName]: '',
      [mediaConfig.assetField]: null,
    }));
    setPendingMediaFiles((current) => {
      const next = { ...current };
      delete next[fieldName];
      return next;
    });
    setMediaPreviews((current) => {
      const next = { ...current };
      delete next[fieldName];
      return next;
    });
    setStudioMessage(`${mediaConfig.label} cleared.`);
  }

  function handleMediaDragOver(fieldName, event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';

    if (draggingField !== fieldName) {
      setDraggingField(fieldName);
    }
  }

  function handleMediaDrop(fieldName, event) {
    event.preventDefault();
    setDraggingField('');
    const file = event.dataTransfer.files?.[0];

    if (file) {
      void uploadMediaFileToField(fieldName, file);
    }
  }

  function handlePresetApply(preset) {
    setListingForm((current) => ({
      ...current,
      facilitiesText: preset.facilities.join(', '),
      schedule: preset.schedule,
      statusNote: preset.statusNote,
      mood: preset.mood,
      bestFor: preset.bestFor,
    }));
    setUploadError('');
    setStudioMessage(`${preset.title} preset applied. Facilities, schedule, and guest-facing copy are ready for review.`);
  }

  function toggleBulkListing(listingId) {
    setBulkListingIds((current) =>
      current.includes(listingId)
        ? current.filter((item) => item !== listingId)
        : [...current, listingId],
    );
  }

  function toggleAllBulkListings() {
    if (bulkListingIds.length === availableListings.length) {
      setBulkListingIds([]);
      return;
    }

    setBulkListingIds(availableListings.map((listing) => listing.id));
  }

  async function handleBulkUpload(event) {
    const files = Array.from(event.target.files || []);
    const mediaConfig = MEDIA_FIELD_CONFIG[bulkUploadField];

    if (!files.length || !mediaConfig) {
      return;
    }

    if (!selectedBulkListings.length) {
      setUploadError('Select at least one property before starting a bulk upload.');
      event.target.value = '';
      return;
    }

    if (files.length !== 1 && files.length !== selectedBulkListings.length) {
      setUploadError('Use one file to apply the same asset to every selected property, or upload one file per selected property.');
      event.target.value = '';
      return;
    }

    setIsBulkUploading(true);
    setUploadError('');
    setStudioMessage('');

    try {
      for (let index = 0; index < selectedBulkListings.length; index += 1) {
        const listing = selectedBulkListings[index];
        const file = files[Math.min(index, files.length - 1)];
        const currentAsset = listing[mediaConfig.assetField];

        if (currentAsset?.id) {
          await deleteMediaFile(currentAsset);
        }

        const mediaRef = await saveMediaFile(file, `${bulkUploadField}-bulk`);

        await onSaveListing({
          ...listing,
          [mediaConfig.assetField]: mediaRef,
          mediaFiles: {
            [bulkUploadField]: file,
          },
        });
      }

      setStudioMessage(
        `${files.length === 1 ? 'One file has' : `${files.length} files have`} been staged across ${selectedBulkListings.length} selected propert${selectedBulkListings.length === 1 ? 'y' : 'ies'}.`,
      );
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Bulk upload failed. Please try again.');
    } finally {
      setIsBulkUploading(false);
      event.target.value = '';
    }
  }

  async function handleListingSubmit(event) {
    event.preventDefault();
    setIsSavingListing(true);
    setUploadError('');

    try {
      await onSaveListing({
        ...selectedListing,
        ...listingForm,
        mediaFiles: pendingMediaFiles,
      });
      setDraftListing(null);
      setPendingMediaFiles({});
      setStudioMessage('Listing content saved. The public staycation cards now use the latest management portal data.');
    } finally {
      setIsSavingListing(false);
    }
  }

  async function handleDeleteListing() {
    if (draftListing?.id === selectedListing.id) {
      setDraftListing(null);
      setSelectedListingId(listings[0]?.id ?? '');
      setStudioMessage('Draft listing removed before publishing.');
      return;
    }

    await onDeleteListing(selectedListing.id);
    setDraftListing(null);
    setSelectedListingId(listings.find((listing) => listing.id !== selectedListing.id)?.id ?? listings[0]?.id ?? '');
    setStudioMessage('Listing removed from the management portal.');
  }

  return {
    availableListings,
    selectedListing,
    selectedListingId,
    listingForm,
    mediaCards,
    isSavingListing,
    isUploadingMedia,
    uploadError,
    studioMessage,
    draggingField,
    bulkUploadField,
    bulkListingIds,
    selectedBulkListings,
    isBulkUploading,
    pendingMediaFiles,
    setSelectedListingId,
    setBulkUploadField,
    handleListingFieldChange,
    handleMediaUpload,
    handleCreateListing,
    clearMediaField,
    handleMediaDragOver,
    handleMediaDrop,
    handlePresetApply,
    toggleBulkListing,
    toggleAllBulkListings,
    handleBulkUpload,
    handleListingSubmit,
    handleDeleteListing,
  };
}

function ListingsStudio({
  listings,
  onSaveListing,
  onDeleteListing,
  onShowPage,
  formatCurrency,
}) {
  const studio = useManagementStudio(listings, onSaveListing, onDeleteListing);
  const [sectionState, setSectionState] = useState({
    basic: true,
    media: true,
    schedule: true,
    copy: true,
  });

  function toggleSection(sectionId) {
    setSectionState((current) => ({
      ...current,
      [sectionId]: !current[sectionId],
    }));
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <section className="rounded-[1.8rem] border border-brand-100 bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 p-6 text-white shadow-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">Dedicated Listings Route</div>
              <h2 className="mt-3 font-display text-3xl font-bold">Management Upload Studio</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/72">
                The listing builder now lives on its own page so operators can focus on creation without scrolling past analytics, queues, and inbox activity.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={studio.handleCreateListing} className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-brand-900">
                + New Listing
              </button>
              <button type="button" onClick={() => onShowPage('dashboard')} className="rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-white/80">
                Back to Dashboard
              </button>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl bg-white/8 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/55">Managed Listings</div>
              <div className="mt-3 text-3xl font-black">{studio.availableListings.length}</div>
            </div>
            <div className="rounded-3xl bg-white/8 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/55">Bulk Targets</div>
              <div className="mt-3 text-3xl font-black">{studio.selectedBulkListings.length}</div>
            </div>
            <div className="rounded-3xl bg-white/8 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/55">Pending Uploads</div>
              <div className="mt-3 text-3xl font-black">{Object.keys(studio.pendingMediaFiles).length}</div>
            </div>
          </div>
        </section>

        <section className="rounded-[1.8rem] border border-ice-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-500">Bulk Upload</div>
              <h2 className="mt-2 font-display text-3xl font-bold text-brand-950">Upload across multiple properties in one pass</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                The cramped in-page overlay is gone. Bulk upload now has full-width breathing room with property selection, asset targeting, and clearer file mapping rules.
              </p>
            </div>
            <span className="inline-flex items-center rounded-full bg-brand-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
              Full-width studio workflow
            </span>
          </div>
          <div className="mt-6 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-3xl bg-slate-950 p-5 text-white">
              <label className="form-label text-white" htmlFor="bulkUploadField">Asset Type</label>
              <select
                id="bulkUploadField"
                value={studio.bulkUploadField}
                onChange={(event) => studio.setBulkUploadField(event.target.value)}
                className="form-input border-white/15 bg-white/8 text-white"
              >
                {MEDIA_FIELD_ORDER.map((fieldName) => (
                  <option key={fieldName} value={fieldName} className="text-slate-900">
                    {MEDIA_FIELD_CONFIG[fieldName].label.replace(' Upload', '')}
                  </option>
                ))}
              </select>
              <label className="form-label mt-4 text-white" htmlFor="bulkUploadInput">Bulk Files</label>
              <input
                id="bulkUploadInput"
                type="file"
                multiple
                accept={MEDIA_FIELD_CONFIG[studio.bulkUploadField].accept}
                onChange={studio.handleBulkUpload}
                disabled={studio.isBulkUploading}
                className="form-input border-white/15 bg-white/8 text-white"
              />
              <p className="mt-3 text-xs leading-relaxed text-white/60">
                Upload 1 file to reuse the same asset for every selected property, or upload {studio.selectedBulkListings.length || 'matching'} files to map them in property order.
              </p>
            </div>
            <div className="rounded-3xl border border-ice-200 bg-ice-50 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Target Properties</div>
                  <div className="mt-1 text-lg font-semibold text-brand-950">Choose the listings that should receive the upload</div>
                </div>
                <button type="button" onClick={studio.toggleAllBulkListings} className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
                  {studio.bulkListingIds.length === studio.availableListings.length ? 'Clear all' : 'Select all'}
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {studio.availableListings.map((listing) => (
                  <label key={listing.id} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-ice-200 bg-white px-4 py-4 shadow-sm">
                    <input
                      type="checkbox"
                      checked={studio.bulkListingIds.includes(listing.id)}
                      onChange={() => studio.toggleBulkListing(listing.id)}
                      className="mt-1 h-4 w-4 rounded border-ice-300"
                    />
                    <span className="min-w-0">
                      <span className="block font-semibold text-brand-950">{listing.name}</span>
                      <span className="mt-1 block text-sm text-slate-500">{listing.location || 'Add a location to complete this card.'}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </section>

        <form onSubmit={studio.handleListingSubmit} className="space-y-6">
          <CollapsibleStudioSection
            id="studio-basic"
            eyebrow={STUDIO_SECTIONS[0].eyebrow}
            title={STUDIO_SECTIONS[0].title}
            open={sectionState.basic}
            onToggle={() => toggleSection('basic')}
          >
            <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
              <div>
                <label className="form-label" htmlFor="listingSelect">Listing to Manage</label>
                <select
                  id="listingSelect"
                  value={studio.selectedListingId}
                  onChange={(event) => studio.setSelectedListingId(event.target.value)}
                  className="form-input"
                >
                  {studio.availableListings.map((listing) => (
                    <option key={listing.id} value={listing.id}>
                      {listing.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={studio.handleCreateListing} className="btn-primary flex-1 px-5 py-3 text-sm">
                  <span>+ Add New Listing</span>
                </button>
                <button type="button" onClick={studio.handleDeleteListing} className="flex-1 rounded-2xl border border-rose-200 px-5 py-3 text-sm font-semibold text-rose-600">
                  Delete Listing
                </button>
              </div>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <label className="form-label" htmlFor="name">Listing Name</label>
                <input id="name" name="name" value={studio.listingForm.name} onChange={studio.handleListingFieldChange} className="form-input" />
              </div>
              <div>
                <label className="form-label" htmlFor="location">Location</label>
                <input id="location" name="location" value={studio.listingForm.location} onChange={studio.handleListingFieldChange} className="form-input" />
              </div>
              <div>
                <label className="form-label" htmlFor="price">Nightly Price</label>
                <input id="price" name="price" type="number" min="0" value={studio.listingForm.price} onChange={studio.handleListingFieldChange} className="form-input" />
              </div>
              <div>
                <label className="form-label" htmlFor="statusNote">Status Note</label>
                <input id="statusNote" name="statusNote" value={studio.listingForm.statusNote} onChange={studio.handleListingFieldChange} className="form-input" placeholder="Now live for guests" />
              </div>
              <div>
                <label className="form-label" htmlFor="publishStatus">Publish Status</label>
                <select id="publishStatus" name="publishStatus" value={studio.listingForm.publishStatus} onChange={studio.handleListingFieldChange} className="form-input">
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
              <div>
                <label className="form-label" htmlFor="availabilityNotes">Availability Notes</label>
                <input id="availabilityNotes" name="availabilityNotes" value={studio.listingForm.availabilityNotes} onChange={studio.handleListingFieldChange} className="form-input" placeholder="Closed on public holidays" />
              </div>
            </div>
          </CollapsibleStudioSection>

          <CollapsibleStudioSection
            id="studio-media"
            eyebrow={STUDIO_SECTIONS[1].eyebrow}
            title={STUDIO_SECTIONS[1].title}
            open={sectionState.media}
            onToggle={() => toggleSection('media')}
          >
            <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-500">Listing Presets</div>
                    <h3 className="mt-2 font-display text-2xl font-bold text-brand-950">Templates for fast setup</h3>
                    <p className="mt-2 text-sm text-slate-500">Apply a ready-made facilities and schedule pack, then fine-tune the details for the selected property.</p>
                  </div>
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-sm">
                    <Icon name="list-check" />
                  </span>
                </div>
                <div className="mt-5 grid gap-3">
                  {LISTING_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => studio.handlePresetApply(preset)}
                      className="rounded-2xl border border-brand-100 bg-white px-4 py-4 text-left transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-semibold text-brand-900">{preset.title}</div>
                        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">Apply</span>
                      </div>
                      <div className="mt-2 text-sm text-slate-500">{preset.schedule}</div>
                      <div className="mt-3 text-xs text-slate-400">{preset.facilities.join(' · ')}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 xl:grid-cols-2">
                {studio.mediaCards.map(({ fieldName, config, preview, asset }) => {
                  const isVideoField = fieldName === 'videoUrl';
                  const inputId = `${fieldName}Upload`;

                  return (
                    <div key={fieldName} className="rounded-3xl border border-ice-200 bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <label className="form-label" htmlFor={fieldName}>{config.label.replace(' Upload', ' URL')}</label>
                          <input
                            id={fieldName}
                            name={fieldName}
                            value={studio.listingForm[fieldName]}
                            onChange={studio.handleListingFieldChange}
                            className="form-input"
                            placeholder={isVideoField ? 'https://youtube.com/...' : 'https://...'}
                          />
                        </div>
                        <button type="button" onClick={() => studio.clearMediaField(fieldName)} className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-rose-600 shadow-sm">
                          Clear
                        </button>
                      </div>
                      <label
                        htmlFor={inputId}
                        onDragOver={(event) => studio.handleMediaDragOver(fieldName, event)}
                        onDragLeave={() => null}
                        onDrop={(event) => studio.handleMediaDrop(fieldName, event)}
                        className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed px-5 py-6 text-center transition ${
                          studio.draggingField === fieldName
                            ? 'border-brand-500 bg-brand-50'
                            : 'border-ice-200 bg-white hover:border-brand-300 hover:bg-brand-50/40'
                        }`}
                      >
                        <input
                          id={inputId}
                          type="file"
                          accept={config.accept}
                          onChange={(event) => studio.handleMediaUpload(fieldName, event)}
                          className="hidden"
                        />
                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                          <Icon name="upload" />
                        </span>
                        <div className="mt-3 font-semibold text-brand-950">Drag and drop or browse</div>
                        <p className="mt-1 text-sm text-slate-500">{config.helper}</p>
                        {asset?.name ? (
                          <div className="mt-3 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                            {asset.name} · {formatFileSize(asset.size)}
                          </div>
                        ) : null}
                      </label>
                      <div className="mt-4 rounded-2xl border border-ice-200 bg-white p-3">
                        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Preview</div>
                        {isVideoField ? (
                          preview ? (
                            <video src={preview} controls className="h-40 w-full rounded-2xl object-cover" />
                          ) : (
                            <div className="flex h-40 items-center justify-center rounded-2xl bg-ice-50 text-xs text-slate-400">
                              No video uploaded
                            </div>
                          )
                        ) : (
                          <img src={preview || studio.selectedListing?.image} alt={`${studio.listingForm.name} ${config.label.toLowerCase()}`} className="h-40 w-full rounded-2xl object-cover" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CollapsibleStudioSection>

          <CollapsibleStudioSection
            id="studio-schedule"
            eyebrow={STUDIO_SECTIONS[2].eyebrow}
            title={STUDIO_SECTIONS[2].title}
            open={sectionState.schedule}
            onToggle={() => toggleSection('schedule')}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="form-label" htmlFor="schedule">Schedule</label>
                <input id="schedule" name="schedule" value={studio.listingForm.schedule} onChange={studio.handleListingFieldChange} className="form-input" placeholder="Daily check-in from 3:00 PM" />
                <p className="mt-2 text-xs text-slate-400">Use this for check-in, check-out, weekday availability, or blackout notes.</p>
              </div>
              <div>
                <label className="form-label" htmlFor="blockedDatesText">Blocked Dates</label>
                <textarea id="blockedDatesText" name="blockedDatesText" rows="3" value={studio.listingForm.blockedDatesText} onChange={studio.handleListingFieldChange} className="form-input" placeholder="2026-06-20, 2026-06-21, 2026-06-22" />
                <p className="mt-2 text-xs text-slate-400">Add comma-separated dates to block guest booking on those days.</p>
              </div>
            </div>
          </CollapsibleStudioSection>

          <CollapsibleStudioSection
            id="studio-copy"
            eyebrow={STUDIO_SECTIONS[3].eyebrow}
            title={STUDIO_SECTIONS[3].title}
            open={sectionState.copy}
            onToggle={() => toggleSection('copy')}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="form-label" htmlFor="facilitiesText">Facilities</label>
                <textarea
                  id="facilitiesText"
                  name="facilitiesText"
                  rows="3"
                  value={studio.listingForm.facilitiesText}
                  onChange={studio.handleListingFieldChange}
                  className="form-input"
                  placeholder="Pool, WiFi, Parking, BBQ Place"
                />
                <p className="mt-2 text-xs text-slate-400">Separate facilities with commas so they publish as client-facing tags.</p>
              </div>
              <div>
                <label className="form-label" htmlFor="mood">Guest Experience Copy</label>
                <textarea id="mood" name="mood" rows="4" value={studio.listingForm.mood} onChange={studio.handleListingFieldChange} className="form-input" placeholder="Describe the stay in one persuasive sentence." />
              </div>
              <div>
                <label className="form-label" htmlFor="bestFor">Best For</label>
                <textarea id="bestFor" name="bestFor" rows="4" value={studio.listingForm.bestFor} onChange={studio.handleListingFieldChange} className="form-input" placeholder="Best for families, couples, team retreats..." />
              </div>
            </div>
          </CollapsibleStudioSection>

          {studio.uploadError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
              {studio.uploadError}
            </div>
          ) : null}
          {studio.studioMessage ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {studio.studioMessage}
            </div>
          ) : null}

          <div className="rounded-3xl bg-ice-50 p-4 text-sm text-slate-500">
            Changes here update the public staycation cards and the booking flow because management is now the source of truth for listing content.
            {studio.isUploadingMedia ? ` Uploading ${MEDIA_FIELD_CONFIG[studio.isUploadingMedia]?.label.toLowerCase()}...` : ''}
            {studio.isBulkUploading ? ' Processing the bulk upload queue...' : ''}
            {!studio.isUploadingMedia && !studio.isBulkUploading && Object.keys(studio.pendingMediaFiles).length
              ? ' Ready to sync uploaded files on save.'
              : ''}
          </div>

          <button type="submit" disabled={studio.isSavingListing} className="btn-primary w-full py-4 text-base disabled:cursor-not-allowed disabled:opacity-60">
            <span>{studio.isSavingListing ? 'Saving Listing…' : 'Save Listing Update'}</span>
          </button>
        </form>
      </div>

      <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
        <section className="rounded-[1.8rem] border border-ice-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">Selected Listing</div>
          <div className="mt-3 text-2xl font-bold text-brand-950">{studio.selectedListing?.name}</div>
          <div className="mt-1 text-sm text-slate-500">{studio.selectedListing?.location || 'Location still needed'}</div>
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-ice-50 px-4 py-3">
            <span className="text-sm font-semibold text-slate-500">Current rate</span>
            <span className="text-lg font-bold text-brand-700">{formatCurrency(Number(studio.listingForm.price || 0))}</span>
          </div>
          <div className="mt-4 space-y-3">
            {STUDIO_SECTIONS.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => document.getElementById(`studio-${section.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="flex w-full items-center justify-between rounded-2xl bg-ice-50 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-brand-50 hover:text-brand-700"
              >
                <span>{section.title}</span>
                <Icon name="arrow-right" className="text-xs text-slate-400" />
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-[1.8rem] border border-ice-200 bg-white p-5 shadow-sm">
          <h2 className="font-display text-2xl font-bold text-brand-950">Upload Requirements</h2>
          <div className="mt-5 space-y-4">
            {[
              { title: 'Photos', description: 'Upload the hero image, room photos, exterior views, and bathroom shots for each place.' },
              { title: 'Videos', description: 'Attach walkthrough or short promo videos so the client can preview the staycation clearly.' },
              { title: 'Facilities', description: 'List the facilities shown to clients, such as pool, WiFi, parking, beds, and bathrooms.' },
              { title: 'Schedule', description: 'Maintain the staycation schedule and availability so the booking flow follows an Airbnb-style pattern.' },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-ice-200 p-4">
                <div className="font-semibold text-brand-900">{item.title}</div>
                <div className="mt-1 text-sm text-slate-500">{item.description}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[1.8rem] border border-ice-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-bold text-brand-950">Live Catalog Preview</h2>
            <button type="button" onClick={() => onShowPage('dashboard')} className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
              Review Dashboard
            </button>
          </div>
          <div className="mt-5">
            <PublishedListingsGrid listings={listings.slice(0, 3)} formatCurrency={formatCurrency} compact />
          </div>
        </section>
      </aside>
    </div>
  );
}

export function DashboardPage({
  listings = FEATURED_PROPERTIES,
  bookings = [],
  bookingTransactions = [],
  emails = [],
  revenue = 0,
  ownerApplications = [],
  reviewSubmissions = [],
  onUpdateBookingStatus,
  onRefundBooking,
  onCancelBooking,
  onShowPage,
  onSignOut,
  authUser,
  formatCurrency,
  analyticsEvents = [],
  supportRequests = [],
}) {
  const [analyticsWindow, setAnalyticsWindow] = useState('30d');
  const analyticsSummary = useMemo(
    () => summarizeWindowedAnalytics(analyticsEvents, bookingTransactions, supportRequests, analyticsWindow),
    [analyticsEvents, analyticsWindow, bookingTransactions, supportRequests],
  );
  const analyticsWindowLabel = getWindowConfig(analyticsWindow).description;
  const currentMonthLabel = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(new Date());
  const liveListingsCount = listings.filter((listing) => listing.publishStatus !== 'draft' && !listing.isDeleted).length;
  const draftListingsCount = listings.filter((listing) => listing.publishStatus === 'draft' && !listing.isDeleted).length;
  const confirmedBookings = bookingTransactions.filter((booking) => (booking.bookingStatus || 'confirmed') === 'confirmed').length;
  const overviewCards = [
    { id: 'bookings', label: 'Bookings', value: bookings.length, caption: 'This month' },
    { id: 'revenue', label: 'Revenue', value: formatCurrency(revenue), caption: 'Confirmed only' },
    { id: 'emails', label: 'Emails Sent', value: emails.length, caption: 'All triggers active' },
    { id: 'listings', label: 'Listings Live', value: liveListingsCount, caption: draftListingsCount ? `${draftListingsCount} draft` : 'All published' },
  ];
  const compactCards = [
    { id: 'confirmed', label: 'Confirmed bookings', value: confirmedBookings, caption: confirmedBookings ? 'Ready to host' : 'No bookings yet' },
    { id: 'compact-revenue', label: 'Revenue', value: formatCurrency(revenue), caption: 'This month' },
    { id: 'owners', label: 'Owner leads', value: ownerApplications.length, caption: ownerApplications.length ? 'Needs review' : 'Awaiting follow-up' },
    { id: 'evaluations', label: 'Evaluate leads', value: reviewSubmissions.length, caption: reviewSubmissions.length ? 'Needs review' : 'Pending review' },
  ];
  const queuePreview = bookingTransactions.slice(0, 3);
  const recentActivity = useMemo(() => {
    const items = [];

    if (bookingTransactions[0]) {
      items.push({
        id: `booking-${bookingTransactions[0].id}`,
        icon: 'calendar-check',
        title: 'Booking confirmed',
        detail: bookingTransactions[0].bookingSummary.name,
        meta: `${bookingTransactions[0].bookingForm.checkin} · ${formatCurrency(bookingTransactions[0].bookingSummary.total)}`,
        tone: 'brand',
      });
    }

    if (ownerApplications[0]) {
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
    }

    if (analyticsSummary.recentEvents[0]) {
      items.push({
        id: `analytics-${analyticsSummary.recentEvents[0].id}`,
        icon: 'chart',
        title: formatAnalyticsEventLabel(analyticsSummary.recentEvents[0].type),
        detail: analyticsSummary.recentEvents[0].path || analyticsSummary.recentEvents[0].page || 'HoraStaycation',
        meta: analyticsSummary.searches ? `${analyticsSummary.searches} tracked searches` : 'No tracked searches yet',
        tone: 'ice',
      });
    }

    if (!items.length) {
      items.push({
        id: 'activity-empty',
        icon: 'chart',
        title: 'Workspace ready',
        detail: 'No recent activity yet',
        meta: 'Bookings, owner leads, and analytics will populate this feed',
        tone: 'ice',
      });
    }

    return items.slice(0, 3);
  }, [analyticsSummary, bookingTransactions, formatCurrency, ownerApplications]);
  const emailTriggers = useMemo(() => {
    if (emails.length) {
      return emails.slice(0, 3).map((email, index) => ({
        id: `${email.title}-${index}`,
        title: email.title,
        detail: email.detail,
      }));
    }

    return [
      { id: 'email-empty', title: 'Triggers standing by', detail: 'Guest, owner, and management emails will appear here once activity begins.' },
    ];
  }, [emails]);
  const dashboardNav = [
    {
      title: 'Overview',
      items: [
        { id: 'dashboard', label: 'Dashboard', href: '#portal-dashboard', active: true },
        { id: 'bookings', label: 'Bookings', href: '#portal-queue', badge: bookingTransactions.length || null },
        { id: 'analytics', label: 'Analytics', href: '#portal-analytics' },
      ],
    },
    {
      title: 'Listings',
      items: [
        { id: 'manage-listings', label: 'Manage listings', onClick: () => onShowPage('management-listings') },
        { id: 'upload-studio', label: 'Upload studio', onClick: () => onShowPage('management-listings') },
      ],
    },
    {
      title: 'Clients',
      items: [
        { id: 'owner-leads', label: 'Owner leads', href: '#portal-owner-leads' },
        { id: 'evaluate-leads', label: 'Evaluate leads', href: '#portal-evaluate-leads' },
        { id: 'email-activity', label: 'Email activity', href: '#portal-email-triggers' },
      ],
    },
  ];
  const userName = authUser?.user_metadata?.full_name || authUser?.email || 'Hora Admin';
  const healthCopy = liveListingsCount
    ? 'System is healthy. Queue, email triggers, and live listings are running normally.'
    : 'System is ready. Publish your first listing to activate the operator workflow.';

  return (
    <section className="min-h-screen bg-[#0b0d10] px-4 pb-10 pt-24 md:px-6">
      <div className="mx-auto max-w-[1500px] overflow-hidden rounded-[2rem] border border-white/8 bg-[#151618] shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
        <div className="grid min-h-[calc(100vh-8rem)] lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="flex flex-col border-b border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] lg:border-b-0 lg:border-r lg:border-white/6">
            <div className="flex items-center gap-3 border-b border-white/6 px-6 py-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-accent-500 text-lg font-bold text-white shadow-lg shadow-brand-950/35">
                H
              </div>
              <div>
                <div className="font-semibold text-white">Hora</div>
                <div className="text-sm text-white/55">Staycation</div>
              </div>
            </div>
            <div className="flex-1 space-y-7 px-5 py-6">
              {dashboardNav.map((group) => (
                <div key={group.title}>
                  <div className="px-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/32">{group.title}</div>
                  <div className="mt-3 space-y-1">
                    {group.items.map((item) => {
                      const iconName =
                        item.id === 'dashboard' ? 'chart'
                          : item.id === 'bookings' ? 'calendar'
                            : item.id === 'analytics' ? 'trend'
                              : item.id === 'manage-listings' ? 'home'
                                : item.id === 'upload-studio' ? 'upload'
                                  : item.id === 'owner-leads' ? 'users'
                                    : item.id === 'evaluate-leads' ? 'pen'
                                      : 'email';

                      const content = (
                        <>
                          <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${item.active ? 'bg-white text-brand-700' : 'bg-white/6 text-white/55'}`}>
                            <Icon name={iconName} />
                          </span>
                          <span className="flex-1 truncate">{item.label}</span>
                          {item.badge ? <span className="rounded-full bg-accent-500 px-2 py-0.5 text-xs font-semibold text-brand-950">{item.badge}</span> : null}
                        </>
                      );

                      if (item.href) {
                        return (
                          <a
                            key={item.id}
                            href={item.href}
                            className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
                              item.active ? 'bg-[#dff7ef] text-brand-950 shadow-sm' : 'text-white/70 hover:bg-white/6 hover:text-white'
                            }`}
                          >
                            {content}
                          </a>
                        );
                      }

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={item.onClick}
                          className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-medium transition ${
                            item.active ? 'bg-[#dff7ef] text-brand-950 shadow-sm' : 'text-white/70 hover:bg-white/6 hover:text-white'
                          }`}
                        >
                          {content}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-white/6 px-5 py-5">
              <div className="flex items-center gap-3 rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#dff7ef] font-semibold text-brand-950">
                  {String(userName).trim().charAt(0).toUpperCase() || 'H'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-white">{authUser?.email || 'management@horastaycation.com'}</div>
                  <div className="text-xs uppercase tracking-[0.18em] text-white/38">Admin</div>
                </div>
                <button type="button" onClick={onSignOut} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/60 hover:border-white/20 hover:text-white">
                  Out
                </button>
              </div>
              <button type="button" onClick={() => onShowPage('landing')} className="mt-3 w-full rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-white/72 transition hover:bg-white/[0.07] hover:text-white">
                Return to site
              </button>
            </div>
          </aside>

          <div className="min-w-0">
            <header className="flex flex-col gap-4 border-b border-white/6 px-6 py-5 md:flex-row md:items-center md:justify-between lg:px-8">
              <div>
                <div className="text-sm font-medium text-white/55">Operations dashboard</div>
                <div className="mt-1 text-xl font-semibold text-white">Management portal</div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium text-white/70">
                  {currentMonthLabel}
                </div>
                <button type="button" onClick={() => onShowPage('management-listings')} className="rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]">
                  New listing
                </button>
              </div>
            </header>

            <div id="portal-dashboard" className="space-y-5 p-6 lg:p-8">
              <section className="overflow-hidden rounded-[1.6rem] border border-brand-500/18 bg-gradient-to-br from-[#055c50] via-[#0b5d57] to-[#103a57] px-5 py-5 text-white shadow-[0_24px_60px_rgba(3,105,98,0.28)]">
                <div className="grid gap-5 lg:grid-cols-[repeat(4,minmax(0,1fr))_1.2fr]">
                  {overviewCards.map((item, index) => (
                    <div key={item.id} className={`${index < overviewCards.length - 1 ? 'lg:border-r lg:border-white/14 lg:pr-5' : ''}`}>
                      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60">{item.label}</div>
                      <div className="mt-2 text-4xl font-black">{item.value}</div>
                      <div className="mt-2 text-sm text-white/68">{item.caption}</div>
                    </div>
                  ))}
                  <div className="border-t border-white/14 pt-4 lg:border-t-0 lg:pl-5 lg:pt-0">
                    <div className="text-sm leading-relaxed text-white/84">{healthCopy}</div>
                  </div>
                </div>
              </section>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {compactCards.map((card) => (
                  <article key={card.id} className="rounded-[1.5rem] border border-white/8 bg-white/[0.04] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-white/36">{card.label}</div>
                    <div className="mt-3 text-4xl font-black text-white">{card.value}</div>
                    <div className="mt-2 text-sm text-white/52">{card.caption}</div>
                  </article>
                ))}
              </div>

              <section id="portal-analytics" className="rounded-[1.5rem] border border-white/8 bg-white/[0.04] px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#dff7ef] text-brand-900 shadow-lg shadow-brand-950/20">
                      <Icon name="chart" />
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-white">Analytics — {analyticsWindowLabel.toLowerCase()}</div>
                      <div className="mt-1 text-sm text-white/58">
                        {analyticsSummary.pageViews} page views · {analyticsSummary.bookings} bookings · {analyticsSummary.conversionRate}% conversion · {analyticsSummary.searches ? `${analyticsSummary.searches} tracked searches` : 'no tracked searches yet'}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="inline-flex rounded-2xl border border-white/10 bg-black/10 p-1">
                      {WINDOW_OPTIONS.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setAnalyticsWindow(option.id)}
                          className={`rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                            analyticsWindow === option.id ? 'bg-[#dff7ef] text-brand-950' : 'text-white/55 hover:text-white'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                    <a href="#portal-queue" className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-white/72 transition hover:bg-white/[0.06] hover:text-white">
                      Expand
                    </a>
                  </div>
                </div>
              </section>

              <div className="grid gap-5 xl:grid-cols-[1.45fr_0.85fr]">
                <section id="portal-queue" className="rounded-[1.5rem] border border-white/8 bg-white/[0.04] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <div className="text-xl font-semibold text-white">Live booking queue</div>
                    <button type="button" onClick={() => onShowPage('booking')} className="text-sm font-semibold text-accent-400 transition hover:text-accent-300">
                      View all
                    </button>
                  </div>
                  <div className="space-y-4">
                    {queuePreview.length ? (
                      queuePreview.map((booking) => {
                        const bookingStatus = formatStatusCopy(booking.bookingStatus || 'confirmed');
                        const initials = booking.bookingSummary.name
                          .split(' ')
                          .slice(0, 2)
                          .map((part) => part.charAt(0))
                          .join('')
                          .toUpperCase();

                        return (
                          <div key={booking.id} className="flex flex-col gap-4 rounded-[1.25rem] border border-white/8 bg-black/10 px-4 py-4 md:flex-row md:items-center md:justify-between">
                            <div className="flex min-w-0 items-start gap-4">
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#dff7ef] text-sm font-bold text-brand-950">
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <div className="truncate text-lg font-semibold text-white">{booking.bookingSummary.name}</div>
                                <div className="mt-1 text-sm text-white/62">
                                  {booking.bookingForm.checkin} – {booking.bookingForm.checkout} · {booking.bookingSummary.nights} night{booking.bookingSummary.nights > 1 ? 's' : ''} · {booking.bookingForm.guests} pax
                                </div>
                                <div className="mt-1 text-xs uppercase tracking-[0.16em] text-white/34">{booking.bookingForm.guestName || 'Guest booking'}</div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between gap-4 md:block md:text-right">
                              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getPaymentStatusClasses(booking.paymentStatus)}`}>
                                {bookingStatus}
                              </span>
                              <div className="mt-2 text-2xl font-bold text-white">{formatCurrency(booking.bookingSummary.total)}</div>
                              <select
                                value={booking.bookingStatus || 'confirmed'}
                                onChange={(event) => onUpdateBookingStatus(booking.id, event.target.value)}
                                className="mt-3 w-full rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-semibold text-white outline-none md:w-auto"
                              >
                                <option value="confirmed" className="text-slate-900">Confirmed</option>
                                <option value="pending" className="text-slate-900">Pending</option>
                                <option value="checked-in" className="text-slate-900">Checked In</option>
                                <option value="completed" className="text-slate-900">Completed</option>
                                <option value="cancelled" className="text-slate-900">Cancelled</option>
                                <option value="payment_issue" className="text-slate-900">Payment Issue</option>
                                <option value="refunded" className="text-slate-900">Refunded</option>
                              </select>
                              <div className="mt-3 flex flex-wrap gap-2 md:justify-end">
                                <button
                                  type="button"
                                  onClick={() => onCancelBooking?.(booking)}
                                  className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white/70 transition hover:bg-white/[0.06] hover:text-white"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onRefundBooking?.(booking)}
                                  disabled={!booking.stripeSessionId || booking.paymentStatus === 'refunded'}
                                  className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-xs font-semibold text-rose-200 transition disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  Refund
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="rounded-[1.25rem] border border-dashed border-white/10 bg-black/10 px-5 py-6 text-sm text-white/55">
                        No bookings yet. Share your booking link to activate the queue and email triggers.
                      </div>
                    )}
                  </div>
                </section>

                <div className="space-y-5">
                  <section className="rounded-[1.5rem] border border-white/8 bg-white/[0.04] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                    <div className="mb-5 text-xl font-semibold text-white">Recent activity</div>
                    <div className="space-y-4">
                      {recentActivity.map((item) => (
                        <div key={item.id} className="flex items-start gap-4 rounded-[1.2rem] border border-white/8 bg-black/10 px-4 py-4">
                          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                            item.tone === 'brand' ? 'bg-[#dff7ef] text-brand-950'
                              : item.tone === 'accent' ? 'bg-accent-500/20 text-accent-300'
                                : 'bg-white/10 text-white/70'
                          }`}>
                            <Icon name={item.icon} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-lg font-semibold leading-tight text-white">{item.title}</div>
                            <div className="mt-2 text-sm text-white/76">{item.detail}</div>
                            <div className="mt-1 text-sm text-white/44">{item.meta}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section id="portal-email-triggers" className="rounded-[1.5rem] border border-white/8 bg-white/[0.04] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                    <div className="mb-5 text-xl font-semibold text-white">Email triggers</div>
                    <div className="space-y-4">
                      {emailTriggers.map((item) => (
                        <div key={item.id} className="flex items-start gap-4 rounded-[1.2rem] border border-white/8 bg-black/10 px-4 py-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#dff7ef] text-brand-950">
                            <Icon name="email" />
                          </div>
                          <div>
                            <div className="text-lg font-semibold leading-tight text-white">{item.title}</div>
                            <div className="mt-2 text-sm text-white/58">{item.detail}</div>
                            {item.id !== 'email-empty' ? <div className="mt-2 text-sm font-semibold text-emerald-300">Active</div> : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>

              <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
                <section id="portal-owner-leads" className="rounded-[1.5rem] border border-white/8 bg-white/[0.04] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div className="text-xl font-semibold text-white">Owner leads</div>
                    <button type="button" onClick={() => onShowPage('owner-signup')} className="text-sm font-semibold text-accent-400 transition hover:text-accent-300">
                      View form
                    </button>
                  </div>
                  <div className="space-y-3">
                    {ownerApplications.length ? (
                      ownerApplications.slice(0, 3).map((application) => (
                        <div key={application.id} className="rounded-[1.2rem] border border-white/8 bg-black/10 px-4 py-4">
                          <div className="font-semibold text-white">{application.ownerName}</div>
                          <div className="mt-1 text-sm text-white/58">{application.ownerAddress}</div>
                          <div className="mt-2 text-xs uppercase tracking-[0.16em] text-white/34">
                            {application.unitCount} unit{application.unitCount === '1' ? '' : 's'} · {application.budget}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-[1.2rem] border border-dashed border-white/10 bg-black/10 px-4 py-5 text-sm text-white/52">
                        Owner enquiries will appear here once the inbound pipeline starts.
                      </div>
                    )}
                  </div>
                </section>

                <section id="portal-evaluate-leads" className="rounded-[1.5rem] border border-white/8 bg-white/[0.04] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div className="text-xl font-semibold text-white">Evaluate leads</div>
                    <button type="button" onClick={() => onShowPage('evaluate')} className="text-sm font-semibold text-accent-400 transition hover:text-accent-300">
                      Open review form
                    </button>
                  </div>
                  <div className="space-y-3">
                    {reviewSubmissions.length ? (
                      reviewSubmissions.slice(0, 3).map((submission) => (
                        <div key={submission.id} className="rounded-[1.2rem] border border-white/8 bg-black/10 px-4 py-4">
                          <div className="font-semibold text-white">{submission.evaluatorName}</div>
                          <div className="mt-1 text-sm text-white/58">{submission.evaluatorAddress}</div>
                          <div className="mt-2 text-xs uppercase tracking-[0.16em] text-white/34">{submission.evaluatorEmail}</div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-[1.2rem] border border-dashed border-white/10 bg-black/10 px-4 py-5 text-sm text-white/52">
                        Evaluation requests will appear here when property reviews start coming in.
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

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
  const liveListingsCount = listings.filter((listing) => listing.publishStatus !== 'draft' && !listing.isDeleted).length;
  const draftListingsCount = listings.filter((listing) => listing.publishStatus === 'draft' && !listing.isDeleted).length;
  const averageNightly = listings.length
    ? formatCurrency(Math.round(listings.reduce((sum, listing) => sum + Number(listing.price || 0), 0) / listings.length))
    : formatCurrency(0);
  const userName = authUser?.user_metadata?.full_name || authUser?.email || 'Hora Admin';
  const listingsNav = [
    {
      title: 'Overview',
      items: [
        { id: 'dashboard', label: 'Dashboard', onClick: () => onShowPage('dashboard') },
        { id: 'bookings', label: 'Bookings', onClick: () => onShowPage('dashboard') },
        { id: 'analytics', label: 'Analytics', onClick: () => onShowPage('dashboard') },
      ],
    },
    {
      title: 'Listings',
      items: [
        { id: 'manage-listings', label: 'Manage listings', active: true },
        { id: 'upload-studio', label: 'Upload studio', active: true },
      ],
    },
    {
      title: 'Clients',
      items: [
        { id: 'owner-leads', label: 'Owner leads', onClick: () => onShowPage('dashboard') },
        { id: 'evaluate-leads', label: 'Evaluate leads', onClick: () => onShowPage('dashboard') },
        { id: 'email-activity', label: 'Email activity', onClick: () => onShowPage('dashboard') },
      ],
    },
  ];

  return (
    <section className="min-h-screen bg-[#0b0d10] px-4 pb-10 pt-24 md:px-6">
      <div className="mx-auto max-w-[1500px] overflow-hidden rounded-[2rem] border border-white/8 bg-[#151618] shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
        <div className="grid min-h-[calc(100vh-8rem)] lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="flex flex-col border-b border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] lg:border-b-0 lg:border-r lg:border-white/6">
            <div className="flex items-center gap-3 border-b border-white/6 px-6 py-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-accent-500 text-lg font-bold text-white shadow-lg shadow-brand-950/35">
                H
              </div>
              <div>
                <div className="font-semibold text-white">Hora</div>
                <div className="text-sm text-white/55">Staycation</div>
              </div>
            </div>
            <div className="flex-1 space-y-7 px-5 py-6">
              {listingsNav.map((group) => (
                <div key={group.title}>
                  <div className="px-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/32">{group.title}</div>
                  <div className="mt-3 space-y-1">
                    {group.items.map((item) => {
                      const iconName =
                        item.id === 'dashboard' ? 'chart'
                          : item.id === 'bookings' ? 'calendar'
                            : item.id === 'analytics' ? 'trend'
                              : item.id === 'manage-listings' ? 'home'
                                : item.id === 'upload-studio' ? 'upload'
                                  : item.id === 'owner-leads' ? 'users'
                                    : item.id === 'evaluate-leads' ? 'pen'
                                      : 'email';

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={item.onClick}
                          className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-medium transition ${
                            item.active ? 'bg-[#dff7ef] text-brand-950 shadow-sm' : 'text-white/70 hover:bg-white/6 hover:text-white'
                          }`}
                        >
                          <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${item.active ? 'bg-white text-brand-700' : 'bg-white/6 text-white/55'}`}>
                            <Icon name={iconName} />
                          </span>
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-white/6 px-5 py-5">
              <div className="flex items-center gap-3 rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#dff7ef] font-semibold text-brand-950">
                  {String(userName).trim().charAt(0).toUpperCase() || 'H'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-white">{authUser?.email || 'management@horastaycation.com'}</div>
                  <div className="text-xs uppercase tracking-[0.18em] text-white/38">Admin</div>
                </div>
                <button type="button" onClick={onSignOut} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/60 hover:border-white/20 hover:text-white">
                  Out
                </button>
              </div>
              <button type="button" onClick={() => onShowPage('landing')} className="mt-3 w-full rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-white/72 transition hover:bg-white/[0.07] hover:text-white">
                Return to site
              </button>
            </div>
          </aside>

          <div className="min-w-0">
            <header className="flex flex-col gap-4 border-b border-white/6 px-6 py-5 md:flex-row md:items-center md:justify-between lg:px-8">
              <div>
                <div className="text-sm font-medium text-white/55">Listings workspace</div>
                <div className="mt-1 text-xl font-semibold text-white">Management upload studio</div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium text-white/70">
                  {currentMonthLabel}
                </div>
                <button type="button" onClick={() => onShowPage('dashboard')} className="rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]">
                  Back to dashboard
                </button>
              </div>
            </header>

            <div className="space-y-6 p-6 lg:p-8">
              <section className="overflow-hidden rounded-[1.6rem] border border-brand-500/18 bg-gradient-to-br from-[#055c50] via-[#0b5d57] to-[#103a57] px-5 py-5 text-white shadow-[0_24px_60px_rgba(3,105,98,0.28)]">
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60">Listings live</div>
                    <div className="mt-2 text-4xl font-black">{liveListingsCount}</div>
                    <div className="mt-2 text-sm text-white/68">{draftListingsCount ? `${draftListingsCount} draft in progress` : 'All active listings are published'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60">Average nightly</div>
                    <div className="mt-2 text-4xl font-black">{averageNightly}</div>
                    <div className="mt-2 text-sm text-white/68">Calculated across current management listings</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60">Bookings connected</div>
                    <div className="mt-2 text-4xl font-black">{bookings.length}</div>
                    <div className="mt-2 text-sm text-white/68">The studio updates what guests actually book</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60">Lead pipeline</div>
                    <div className="mt-2 text-4xl font-black">{ownerApplications.length + reviewSubmissions.length}</div>
                    <div className="mt-2 text-sm text-white/68">Owner and evaluation demand connected to this workspace</div>
                  </div>
                </div>
              </section>

              <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-1">
                <ListingsStudio
                  listings={listings}
                  onSaveListing={onSaveListing}
                  onDeleteListing={onDeleteListing}
                  onShowPage={onShowPage}
                  formatCurrency={formatCurrency}
                />
              </div>

              <section id="catalog-preview" className="rounded-[1.5rem] border border-white/8 bg-white/[0.04] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">Published staycation choices</div>
                    <h2 className="mt-2 font-display text-3xl font-bold text-white">Live catalog preview</h2>
                  </div>
                  <button type="button" onClick={() => onShowPage('dashboard')} className="rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]">
                    Back to dashboard
                  </button>
                </div>
                <PublishedListingsGrid listings={listings} formatCurrency={formatCurrency} />
              </section>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
