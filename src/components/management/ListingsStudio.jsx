import { useMemo, useState } from 'react';
import { formatCurrency } from '../../lib/formatters';
import { Icon } from '../Icon';
import { PublishedListingsGrid } from './PublishedListingsGrid';
import { useManagementStudio } from '../../hooks/useManagementStudio';

const MEDIA_FIELD_CONFIG = {
  image: { accept: 'image/*', label: 'Hero Photo Upload' },
  summaryImage: { accept: 'image/*', label: 'Summary Photo Upload' },
  thumbnail: { accept: 'image/*', label: 'Thumbnail Upload' },
  videoUrl: { accept: 'video/*', label: 'Video Walkthrough Upload' },
};

const MEDIA_FIELD_ORDER = ['image', 'summaryImage', 'thumbnail', 'videoUrl'];
const LISTING_CARD_TINTS = ['bg-brand-100/70', 'bg-emerald-100/70', 'bg-amber-100/70', 'bg-teal-100/70', 'bg-violet-100/70'];
const STUDIO_SETTINGS = [
  'Core listing settings',
  'Photos, thumbnails and video',
  'Guest windows and blocked dates',
  'Guest-facing story and amenities',
];

function getPublishBadge(publishStatus) {
  if (publishStatus === 'draft') {
    return 'bg-slate-100 text-slate-600';
  }
  return 'bg-emerald-50 text-emerald-700';
}

export function ListingsStudio({ listings, onSaveListing, onDeleteListing, onShowPage }) {
  const studio = useManagementStudio(listings, onSaveListing, onDeleteListing);
  const [showAdvancedEditor, setShowAdvancedEditor] = useState(true);

  const selectedBulkCount =
    studio.bulkListingIds instanceof Set ? studio.bulkListingIds.size : studio.bulkListingIds?.length ?? 0;

  const isBulkSelected = (listingId) =>
    studio.bulkListingIds instanceof Set
      ? studio.bulkListingIds.has(listingId)
      : Array.isArray(studio.bulkListingIds)
        ? studio.bulkListingIds.includes(listingId)
        : false;

  const liveListings = useMemo(
    () => studio.availableListings.filter((listing) => !listing.isDeleted),
    [studio.availableListings],
  );
  const filteredLiveListings = useMemo(() => {
    if (!studio.listingSearch.trim()) {
      return liveListings;
    }

    const query = studio.listingSearch.toLowerCase();
    return liveListings.filter(
      (listing) => listing.name.toLowerCase().includes(query) || (listing.location || '').toLowerCase().includes(query),
    );
  }, [liveListings, studio.listingSearch]);
  const publishedLiveListings = useMemo(
    () => liveListings.filter((listing) => listing.publishStatus !== 'draft'),
    [liveListings],
  );

  const liveListingsCount = useMemo(
    () => liveListings.filter((listing) => listing.publishStatus !== 'draft').length,
    [liveListings],
  );

  const averageNightly = useMemo(() => {
    if (!liveListings.length) return formatCurrency(0);
    const avg = Math.round(liveListings.reduce((sum, listing) => sum + Number(listing.price || 0), 0) / liveListings.length);
    return formatCurrency(avg);
  }, [liveListings]);

  const selectedListing = studio.selectedListing || liveListings[0];
  const visibleSelectedCount = filteredLiveListings.filter((listing) => isBulkSelected(listing.id)).length;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
        <article className="rounded-3xl border border-ice-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Listings Live</div>
          <div className="mt-2 text-5xl font-bold text-brand-900">{liveListingsCount}</div>
          <p className="mt-2 text-sm text-slate-500">All active listings published</p>
        </article>
        <article className="rounded-3xl border border-ice-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Average Nightly</div>
          <div className="mt-2 text-4xl font-bold text-brand-700">{averageNightly}</div>
          <p className="mt-2 text-sm text-slate-500">Across management listings</p>
        </article>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_350px]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-ice-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">All Listings</div>
                <h2 className="mt-1 text-3xl font-bold text-brand-950">{liveListings.length}</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={studio.handleCreateListing}
                  className="btn-primary px-4 py-2 text-sm"
                >
                  <span className="inline-flex items-center gap-2">
                    <Icon name="send" className="text-sm" />
                    New listing
                  </span>
                </button>
                <input
                  type="text"
                  placeholder="Search listings"
                  value={studio.listingSearch}
                  onChange={(event) => studio.setListingSearch(event.target.value)}
                  className="form-input min-h-0 w-44 py-2 text-sm"
                />
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-ice-200 bg-ice-50 text-slate-500"
                  aria-hidden="true"
                >
                  <Icon name="search" className="text-sm" />
                </span>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredLiveListings.map((listing, index) => {
                const isActive = listing.id === studio.selectedListingId;
                const tint = LISTING_CARD_TINTS[index % LISTING_CARD_TINTS.length];
                const amenities = Array.isArray(listing.amenities) ? listing.amenities.slice(0, 2) : [];

                return (
                  <button
                    key={listing.id}
                    type="button"
                    onClick={() => studio.setSelectedListingId(listing.id)}
                    className={`overflow-hidden rounded-3xl border bg-white text-left shadow-sm transition ${
                      isActive
                        ? 'border-brand-400 ring-2 ring-brand-100'
                        : 'border-ice-200 hover:-translate-y-0.5 hover:border-brand-200'
                    }`}
                  >
                    <div className={`h-18 px-4 py-3 ${tint}`}>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getPublishBadge(
                          listing.publishStatus,
                        )}`}
                      >
                        {listing.publishStatus === 'draft' ? 'Draft' : 'Published'}
                      </span>
                    </div>
                    <div className="p-4">
                      <h3 className="truncate text-xl font-semibold text-brand-950">{listing.name}</h3>
                      <p className="mt-1 truncate text-sm text-slate-500">{listing.location || 'Location needed'}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {amenities.map((item) => (
                          <span key={item} className="rounded-md bg-ice-100 px-2 py-1 text-xs font-medium text-slate-500">
                            {item}
                          </span>
                        ))}
                      </div>
                      <p className="mt-4 text-2xl font-bold text-brand-900">
                        {formatCurrency(Number(listing.price || 0))}
                        <span className="ml-1 text-sm font-medium text-slate-500">/ night</span>
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-3xl border border-ice-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-500">Bulk Upload</div>
                <h2 className="mt-1 text-4xl font-bold leading-tight text-brand-950">
                  Upload across multiple properties in one pass
                </h2>
                <p className="mt-3 max-w-xl text-sm text-slate-500">
                  Bulk upload now has full-width room with property targeting and clearer file mapping.
                </p>
              </div>
              <span className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700">
                Full-width studio workflow
              </span>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <label className="form-label" htmlFor="bulkUploadField">
                  Asset type
                </label>
                <select
                  id="bulkUploadField"
                  value={studio.bulkUploadField}
                  onChange={(event) => studio.setBulkUploadField(event.target.value)}
                  className="form-input"
                >
                  {MEDIA_FIELD_ORDER.map((fieldName) => (
                    <option key={fieldName} value={fieldName}>
                      {MEDIA_FIELD_CONFIG[fieldName].label.replace(' Upload', '')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label" htmlFor="bulkUploadFile">
                  Bulk files
                </label>
                <input
                  id="bulkUploadFile"
                  type="file"
                  accept={MEDIA_FIELD_CONFIG[studio.bulkUploadField]?.accept || 'image/*'}
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    const files = Array.from(event.target.files || []);
                    if (!files.length) return;
                    studio.handleBulkUpload(files);
                    event.target.value = '';
                  }}
                />
                <label
                  id="bulkUploadAction"
                  htmlFor="bulkUploadFile"
                  className={`btn-primary flex w-full cursor-pointer items-center justify-center py-3 text-sm ${
                    studio.isBulkUploading || selectedBulkCount === 0
                      ? 'pointer-events-none cursor-not-allowed opacity-60'
                      : ''
                  }`}
                >
                  {studio.isBulkUploading ? 'Uploading...' : 'Choose files'}
                </label>
                <p className="mt-1 text-xs text-slate-500">
                  Select at least one target property before uploading.
                </p>
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-3 flex items-center justify-between">
                <label className="text-sm font-semibold text-brand-900">Target properties</label>
                <button
                  type="button"
                  onClick={() => studio.toggleBulkListings(filteredLiveListings.map((listing) => listing.id))}
                  disabled={!filteredLiveListings.length}
                  className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {filteredLiveListings.length > 0 && visibleSelectedCount === filteredLiveListings.length
                    ? 'Clear all'
                    : 'Select all'}
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {filteredLiveListings.map((listing) => (                  <label key={listing.id} className="flex items-start gap-2.5 rounded-2xl border border-ice-200 bg-ice-50 p-3">
                    <input
                      type="checkbox"
                      checked={isBulkSelected(listing.id)}
                      onChange={() => studio.toggleBulkListing(listing.id)}
                      className="mt-1 h-4 w-4"
                    />
                    <span>
                      <span className="block font-semibold text-brand-900">{listing.name}</span>
                      <span className="block text-xs text-slate-500">{listing.location || 'No location yet'}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-ice-200 bg-white p-5 shadow-sm">
            <button
              type="button"
              onClick={() => setShowAdvancedEditor((current) => !current)}
              className="flex w-full items-center justify-between text-left"
            >
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Studio editor</div>
                <h3 className="mt-1 text-2xl font-bold text-brand-950">Advanced listing controls</h3>
              </div>
              <span className="rounded-xl bg-ice-100 px-3 py-2 text-xs font-semibold text-brand-700">
                {showAdvancedEditor ? 'Hide' : 'Edit'}
              </span>
            </button>

            {showAdvancedEditor ? selectedListing ? (
              <form onSubmit={studio.handleListingSubmit} className="mt-5 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="form-label" htmlFor="name">
                      Listing name
                    </label>
                    <input id="name" name="name" value={studio.listingForm.name || ''} onChange={studio.handleListingFieldChange} className="form-input" />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="location">
                      Location
                    </label>
                    <input id="location" name="location" value={studio.listingForm.location || ''} onChange={studio.handleListingFieldChange} className="form-input" />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="price">
                      Nightly price
                    </label>
                    <input id="price" name="price" type="number" min="0" value={studio.listingForm.price || 0} onChange={studio.handleListingFieldChange} className="form-input" />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="publishStatus">
                      Publish status
                    </label>
                    <select id="publishStatus" name="publishStatus" value={studio.listingForm.publishStatus || 'published'} onChange={studio.handleListingFieldChange} className="form-input">
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label" htmlFor="facilitiesText">
                    Facilities (comma-separated)
                  </label>
                  <textarea id="facilitiesText" name="facilitiesText" rows="3" value={studio.listingForm.facilitiesText || ''} onChange={studio.handleListingFieldChange} className="form-input" />
                </div>

                <div className="rounded-2xl border border-ice-200 bg-ice-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Media uploads</div>
                  <p className="mt-1 text-sm text-slate-500">Upload photos and video for this listing.</p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {studio.mediaCards.map(({ field, config, pendingFile, currentUrl, hasPending }) => (
                      <div key={field} className="rounded-xl border border-ice-200 bg-white p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-brand-900">{config.label}</span>
                          {(currentUrl || hasPending) ? (
                            <span className="text-xs font-medium text-emerald-600">Uploaded</span>
                          ) : (
                            <span className="text-xs font-medium text-slate-400">Pending</span>
                          )}
                        </div>
                        {(currentUrl || hasPending) && (
                          <div className="mt-2 h-20 overflow-hidden rounded-lg bg-ice-50">
                            {config.accept.startsWith('image') && (currentUrl || hasPending) ? (
                              <img
                                src={hasPending ? URL.createObjectURL(pendingFile) : currentUrl}
                                alt={config.label}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                                {hasPending ? pendingFile.name : 'Video uploaded'}
                              </div>
                            )}
                          </div>
                        )}
                        <input
                          id={`media-file-${field}`}
                          type="file"
                          accept={config.accept}
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) studio.handleMediaUpload(field, file);
                            event.target.value = '';
                          }}
                        />
                        <div className="mt-2 flex gap-2">
                          <label
                            htmlFor={`media-file-${field}`}
                            className={`flex-1 cursor-pointer rounded-lg border border-ice-200 bg-white px-3 py-2 text-center text-xs font-semibold text-brand-700 transition hover:bg-brand-50 ${
                              studio.isUploadingMedia ? 'pointer-events-none opacity-50' : ''
                            }`}
                          >
                            {studio.isUploadingMedia ? 'Uploading...' : 'Choose file'}
                          </label>
                          {hasPending && (
                            <button
                              type="button"
                              onClick={() => studio.clearMediaField(field)}
                              className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <button type="submit" disabled={studio.isSavingListing} className="btn-primary py-3 text-sm disabled:opacity-60">
                    <span>{studio.isSavingListing ? 'Saving...' : 'Save listing updates'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => studio.setShowDeleteConfirm(true)}
                    className="rounded-xl border border-rose-200 py-3 text-sm font-semibold text-rose-600"
                  >
                    Delete listing
                  </button>
                </div>

                {studio.showDeleteConfirm ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                    <div>Delete {selectedListing?.name}? This cannot be undone.</div>
                    <div className="mt-2 flex gap-2">
                      <button type="button" onClick={studio.confirmDelete} className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white">
                        Confirm delete
                      </button>
                      <button type="button" onClick={studio.cancelDelete} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}
              </form>
            ) : (
              <div className="mt-5 rounded-xl border border-ice-200 bg-ice-50 px-4 py-3 text-sm text-slate-600">
                Add a listing to enable advanced controls.
              </div>
            ) : null}
          </section>

          {studio.uploadError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{studio.uploadError}</div>
          ) : null}
          {studio.studioMessage ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{studio.studioMessage}</div>
          ) : null}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-28 xl:self-start">
          <section className="rounded-3xl border border-ice-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Selected listing</div>
            <div className="mt-3 h-32 overflow-hidden rounded-2xl bg-brand-100">
              {selectedListing?.summaryImage || selectedListing?.image ? (
                <img
                  src={selectedListing.summaryImage || selectedListing.image}
                  alt={selectedListing.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-3xl font-bold text-brand-700/40">
                  {selectedListing?.name?.charAt(0)?.toUpperCase() || 'H'}
                </div>
              )}
            </div>
            <h3 className="mt-3 text-3xl font-bold text-brand-950">{selectedListing?.name || 'Select listing'}</h3>
            <p className="mt-1 text-sm text-slate-500">{selectedListing?.location || 'No location set'}</p>

            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between border-t border-ice-200 pt-2">
                <dt className="text-slate-500">Current rate</dt>
                <dd className="font-semibold text-brand-700">{formatCurrency(Number(studio.listingForm.price || 0))}</dd>
              </div>
              <div className="flex items-center justify-between border-t border-ice-200 pt-2">
                <dt className="text-slate-500">Status</dt>
                <dd className="font-semibold text-emerald-700">
                  {studio.listingForm.publishStatus === 'draft' ? 'Draft' : 'Published'}
                </dd>
              </div>
              <div className="flex items-center justify-between border-t border-ice-200 pt-2">
                <dt className="text-slate-500">Amenities</dt>
                <dd className="font-semibold text-brand-900">{selectedListing?.amenities?.length || 0}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-3xl border border-ice-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Settings</div>
            <div className="mt-3 space-y-2">
              {STUDIO_SETTINGS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setShowAdvancedEditor(true)}
                  className="flex w-full items-center justify-between rounded-xl border border-ice-200 bg-ice-50 px-3 py-2 text-left text-sm font-medium text-slate-700"
                >
                  <span>{item}</span>
                  <Icon name="arrow-right" className="text-xs text-slate-400" />
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-ice-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Upload requirements</div>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex items-center justify-between border-b border-ice-100 pb-2">
                <span className="text-slate-600">Photos</span>
                <span className={selectedListing?.image ? 'text-emerald-600' : 'text-amber-600'}>
                  {selectedListing?.image ? 'Ready' : 'Pending'}
                </span>
              </li>
              <li className="flex items-center justify-between border-b border-ice-100 pb-2">
                <span className="text-slate-600">Video</span>
                <span className={selectedListing?.videoUrl ? 'text-emerald-600' : 'text-slate-500'}>
                  {selectedListing?.videoUrl ? 'Uploaded' : 'Not uploaded'}
                </span>
              </li>
              <li className="flex items-center justify-between border-b border-ice-100 pb-2">
                <span className="text-slate-600">Facilities</span>
                <span className="text-brand-700">{selectedListing?.amenities?.length || 0} listed</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-slate-600">Schedule</span>
                <span className={selectedListing?.schedule ? 'text-emerald-600' : 'text-amber-600'}>
                  {selectedListing?.schedule ? 'Set' : 'Pending'}
                </span>
              </li>
            </ul>
          </section>

          <section className="rounded-3xl border border-ice-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Live catalog preview</div>
              <button type="button" onClick={() => onShowPage('dashboard')} className="text-xs font-semibold text-brand-600">
                Dashboard
              </button>
            </div>
            <div className="mt-3">
              <PublishedListingsGrid listings={publishedLiveListings.slice(0, 3)} compact />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
