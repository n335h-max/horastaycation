import { useState } from 'react';
import { Icon } from '../Icon';
import { CollapsibleStudioSection } from './CollapsibleStudioSection';
import { PublishedListingsGrid } from './PublishedListingsGrid';
import { useManagementStudio } from '../../hooks/useManagementStudio';

const MEDIA_FIELD_CONFIG = {
  image: { assetField: 'imageAsset', accept: 'image/*', label: 'Hero Photo Upload', helper: 'Upload the main client-facing hero image.' },
  summaryImage: { assetField: 'summaryImageAsset', accept: 'image/*', label: 'Summary Photo Upload', helper: 'Upload the image shown in booking summaries.' },
  thumbnail: { assetField: 'thumbnailAsset', accept: 'image/*', label: 'Thumbnail Upload', helper: 'Upload the smaller card image used in the booking list.' },
  videoUrl: { assetField: 'videoAsset', accept: 'video/*', label: 'Video Walkthrough Upload', helper: 'Upload a short walkthrough video for the listing.' },
};

const MEDIA_FIELD_ORDER = ['image', 'summaryImage', 'thumbnail', 'videoUrl'];

const LISTING_PRESETS = [
  { id: 'beachfront-villa', title: 'Beachfront Villa', facilities: ['Infinity Pool', 'Private Beach Access', 'BBQ Deck', 'WiFi', 'Outdoor Shower'], schedule: 'Daily check-in from 3:00 PM · Sunset concierge from 5:30 PM · Check-out before 11:00 AM', statusNote: 'Beachfront highlight now live', mood: 'Ocean-facing stay with breezy social spaces, polished arrival moments, and sunset-ready lounging.', bestFor: 'Best for family holidays, bridal parties, and premium short escapes' },
  { id: 'forest-cabin', title: 'Forest Cabin', facilities: ['Fire Pit', 'Mountain View Deck', 'Coffee Bar', 'WiFi', 'Private Parking'], schedule: 'Self check-in from 4:00 PM · Quiet hours from 10:00 PM · Check-out before 11:00 AM', statusNote: 'Forest retreat schedule refreshed', mood: 'A calm woodland escape shaped for slower mornings, layered textures, and private evening gatherings.', bestFor: 'Best for couples, creators, and restorative weekend stays' },
  { id: 'urban-loft', title: 'Urban Loft', facilities: ['Rooftop Access', 'Smart Lock', 'Workspace', 'Streaming TV', 'Fast WiFi'], schedule: 'Express check-in from 2:00 PM · Weekday priority stays · Check-out before 12:00 PM', statusNote: 'Urban quick-stay preset active', mood: 'A compact city stay with efficient flow, strong visual styling, and easy work-to-rest transitions.', bestFor: 'Best for business trips, staycations, and content shoots' },
];

const STUDIO_SECTIONS = [
  { id: 'basic', eyebrow: 'Basic Info', title: 'Core listing settings' },
  { id: 'media', eyebrow: 'Media', title: 'Photos, thumbnails, and video' },
  { id: 'schedule', eyebrow: 'Schedule & Availability', title: 'Guest windows and blocked dates' },
  { id: 'copy', eyebrow: 'Copy & Description', title: 'Guest-facing story and amenities' },
];

export function ListingsStudio({ listings, onSaveListing, onDeleteListing, onShowPage, formatCurrency }) {
  const studio = useManagementStudio(listings, onSaveListing, onDeleteListing);
  const [sectionState, setSectionState] = useState({ basic: true, media: true, schedule: true, copy: true });

  function toggleSection(sectionId) {
    setSectionState((current) => ({ ...current, [sectionId]: !current[sectionId] }));
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        {/* Hero header */}
        <section className="rounded-[1.8rem] bg-gradient-to-br from-[#1a2f52] to-[#0F1F3D] p-6 text-white shadow-lg">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <div className="text-xs font-semibold uppercase tracking-[0.25em] text-white/55">Management Upload Studio</div>
              <h2 className="mt-2 font-display text-[28px] font-bold leading-tight">Listings workspace</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                Create, edit, and manage all staycation properties in one place. Changes publish to the public catalog immediately.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <button type="button" onClick={studio.handleCreateListing} className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#0F1F3D]">
                + New Listing
              </button>
              <button type="button" onClick={() => onShowPage('dashboard')} className="rounded-xl border border-white/20 px-5 py-2.5 text-sm font-medium text-white/80">
                Back to Dashboard
              </button>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-white/10 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">Managed Listings</div>
              <div className="mt-2 text-[28px] font-bold">{studio.availableListings.length}</div>
            </div>
            <div className="rounded-xl bg-white/10 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">Bulk Targets</div>
              <div className="mt-2 text-[28px] font-bold">{studio.selectedBulkListings.length}</div>
            </div>
            <div className="rounded-xl bg-white/10 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">Pending Uploads</div>
              <div className="mt-2 text-[28px] font-bold">{Object.keys(studio.pendingMediaFiles).length}</div>
            </div>
          </div>
        </section>

        {/* Bulk Upload */}
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
            <div className="rounded-3xl bg-gradient-to-br from-[#1a2f52] to-[#0F1F3D] p-5 text-white">
              <label className="form-label text-white" htmlFor="bulkUploadField">Asset Type</label>
              <select
                id="bulkUploadField"
                value={studio.bulkUploadField}
                onChange={(e) => studio.setBulkUploadField(e.target.value)}
                className="form-input border-white/15 bg-white/10 text-white"
              >
                {MEDIA_FIELD_ORDER.map((fieldName) => (
                  <option key={fieldName} value={fieldName} className="text-slate-900">
                    {MEDIA_FIELD_CONFIG[fieldName].label.replace(' Upload', '')}
                  </option>
                ))}
              </select>
              <label className="form-label mt-4 text-white" htmlFor="bulkUploadInput">Bulk Files</label>
              <input id="bulkUploadInput" type="file" multiple accept={MEDIA_FIELD_CONFIG[studio.bulkUploadField].accept} onChange={studio.handleBulkUpload} disabled={studio.isBulkUploading} className="form-input border-white/15 bg-white/10 text-white" />
              <p className="mt-3 text-xs leading-relaxed text-white/60">
                Upload 1 file to reuse for every selected property, or upload {studio.selectedBulkListings.length || 'matching'} files to map in property order.
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
                    <input type="checkbox" checked={studio.bulkListingIds.includes(listing.id)} onChange={() => studio.toggleBulkListing(listing.id)} className="mt-1 h-4 w-4 rounded border-ice-300" />
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

        {/* Studio Form */}
        <form onSubmit={studio.handleListingSubmit} className="space-y-6">
          <CollapsibleStudioSection id="studio-basic" eyebrow={STUDIO_SECTIONS[0].eyebrow} title={STUDIO_SECTIONS[0].title} open={sectionState.basic} onToggle={() => toggleSection('basic')}>
            <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
              <div>
                <label className="form-label" htmlFor="listingSelect">Listing to Manage</label>
                <input id="listingSearch" type="text" placeholder="Search listings..." value={studio.listingSearch} onChange={(e) => studio.setListingSearch(e.target.value)}
                  className="form-input mb-1.5"
                />
                <select id="listingSelect" value={studio.selectedListingId} onChange={(e) => { studio.setSelectedListingId(e.target.value); studio.setListingSearch(''); }} className="form-input">
                  {studio.filteredListings.map((listing) => (
                    <option key={listing.id} value={listing.id}>{listing.name}{listing.location ? ` — ${listing.location}` : ''}</option>
                  ))}
                  {studio.filteredListings.length === 0 ? <option disabled>No matching listings</option> : null}
                </select>
                {studio.listingSearch ? (
                  <div className="mt-1 text-xs text-slate-500">{studio.filteredListings.length} of {studio.availableListings.length} shown</div>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={studio.handleCreateListing} className="btn-primary flex-1 px-5 py-3 text-sm"><span>+ Add New Listing</span></button>
                <button type="button" onClick={studio.handleDeleteListing} className="flex-1 rounded-2xl border border-rose-200 px-5 py-3 text-sm font-semibold text-rose-600">
                  {studio.showDeleteConfirm ? 'Confirm?' : 'Delete Listing'}
                </button>
              </div>
            </div>
            {studio.showDeleteConfirm ? (
              <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800">
                <span>Are you sure you want to delete <strong>{studio.selectedListing?.name}</strong>? This cannot be undone.</span>
                <div className="flex gap-2">
                  <button type="button" onClick={studio.confirmDelete} className="rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white">Yes, Delete</button>
                  <button type="button" onClick={studio.cancelDelete} className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700">Cancel</button>
                </div>
              </div>
            ) : null}
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

          <CollapsibleStudioSection id="studio-media" eyebrow={STUDIO_SECTIONS[1].eyebrow} title={STUDIO_SECTIONS[1].title} open={sectionState.media} onToggle={() => toggleSection('media')}>
            <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-500">Listing Presets</div>
                    <h3 className="mt-2 font-display text-2xl font-bold text-brand-950">Templates for fast setup</h3>
                    <p className="mt-2 text-sm text-slate-500">Apply a ready-made facilities and schedule pack, then fine-tune the details for the selected property.</p>
                  </div>
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-sm"><Icon name="list-check" /></span>
                </div>
                <div className="mt-5 grid gap-3">
                  {LISTING_PRESETS.map((preset) => (
                    <button key={preset.id} type="button" onClick={() => studio.handlePresetApply(preset)} className="rounded-2xl border border-brand-100 bg-white px-4 py-4 text-left transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-sm">
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
                {studio.mediaCards.map(({ field, config, pendingFile, currentUrl, currentAsset, hasPending }) => {
                  const isVideoField = field === 'videoUrl';
                  const preview = hasPending ? '' : currentUrl;
                  return (
                    <div key={field} className="rounded-3xl border border-ice-200 bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <label className="form-label" htmlFor={field}>{config.label.replace(' Upload', ' URL')}</label>
                          <input id={field} name={field} value={studio.listingForm[field] || ''} onChange={studio.handleListingFieldChange} className="form-input" placeholder={isVideoField ? 'https://youtube.com/...' : 'https://...'} />
                        </div>
                        <button type="button" onClick={() => studio.clearMediaField(field)} className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-rose-600 shadow-sm">Clear</button>
                      </div>
                      <label htmlFor={`${field}Upload`}
                        onDragOver={(e) => studio.handleMediaDragOver(e)}
                        onDrop={(e) => studio.handleMediaDrop(field, e)}
                        className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed px-5 py-6 text-center transition ${
                          studio.draggingField === field ? 'border-brand-500 bg-brand-50' : 'border-ice-200 bg-white hover:border-brand-300 hover:bg-brand-50/40'
                        }`}
                      >
                        <input id={`${field}Upload`} type="file" accept={config.accept} onChange={(e) => studio.handleMediaUpload(field, e.target.files?.[0])} className="hidden" />
                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600"><Icon name="upload" /></span>
                        <div className="mt-3 font-semibold text-brand-950">Drag and drop or browse</div>
                        <p className="mt-1 text-sm text-slate-500">{config.helper}</p>
                        {currentAsset?.name ? (
                          <div className="mt-3 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{currentAsset.name}</div>
                        ) : null}
                      </label>
                      <div className="mt-4 rounded-2xl border border-ice-200 bg-white p-3">
                        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Preview</div>
                        {isVideoField ? (
                          preview ? <video src={preview} controls className="h-40 w-full rounded-2xl object-cover" /> : <div className="flex h-40 items-center justify-center rounded-2xl bg-ice-50 text-xs text-slate-400">No video uploaded</div>
                        ) : (
                          <img src={preview || currentUrl || studio.selectedListing?.image} alt={`${studio.listingForm.name} ${config.label.toLowerCase()}`} className="h-40 w-full rounded-2xl object-cover" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CollapsibleStudioSection>

          <CollapsibleStudioSection id="studio-schedule" eyebrow={STUDIO_SECTIONS[2].eyebrow} title={STUDIO_SECTIONS[2].title} open={sectionState.schedule} onToggle={() => toggleSection('schedule')}>
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

          <CollapsibleStudioSection id="studio-copy" eyebrow={STUDIO_SECTIONS[3].eyebrow} title={STUDIO_SECTIONS[3].title} open={sectionState.copy} onToggle={() => toggleSection('copy')}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="form-label" htmlFor="facilitiesText">Facilities</label>
                <textarea id="facilitiesText" name="facilitiesText" rows="3" value={studio.listingForm.facilitiesText} onChange={studio.handleListingFieldChange} className="form-input" placeholder="Pool, WiFi, Parking, BBQ Place" />
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

          {studio.uploadError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{studio.uploadError}</div> : null}
          {studio.studioMessage ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{studio.studioMessage}</div> : null}

          <div className="rounded-3xl bg-ice-50 p-4 text-sm text-slate-500">
            Changes here update the public staycation cards and the booking flow because management is now the source of truth for listing content.
            {studio.isUploadingMedia ? ' Uploading media...' : ''}
            {studio.isBulkUploading ? ' Processing the bulk upload queue...' : ''}
            {!studio.isUploadingMedia && !studio.isBulkUploading && Object.keys(studio.pendingMediaFiles).length ? ' Ready to sync uploaded files on save.' : ''}
          </div>

          <button type="submit" disabled={studio.isSavingListing} className="btn-primary w-full py-4 text-base disabled:cursor-not-allowed disabled:opacity-60">
            <span>{studio.isSavingListing ? 'Saving Listing…' : 'Save Listing Update'}</span>
          </button>
        </form>
      </div>

      {/* Sidebar */}
      <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
        <section className="rounded-[1.8rem] border border-ice-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">Selected Listing</div>
          <div className="mt-2.5 overflow-hidden rounded-xl bg-[#1E3560] h-24 flex items-center justify-center">
            {studio.selectedListing?.image ? (
              <img src={studio.selectedListing.image} alt={studio.selectedListing.name} className="h-full w-full object-cover" />
            ) : (
              <div className="text-[28px] font-bold text-white/30">{studio.selectedListing?.name?.charAt(0)?.toUpperCase() || '?'}</div>
            )}
          </div>
          <div className="mt-3 text-xl font-bold text-brand-950">{studio.selectedListing?.name}</div>
          <div className="mt-1 text-sm text-slate-500">{studio.selectedListing?.location || 'Location still needed'}</div>
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-ice-50 px-4 py-3">
            <span className="text-sm font-semibold text-slate-500">Current rate</span>
            <span className="text-lg font-bold text-brand-700">{formatCurrency(Number(studio.listingForm.price || 0))}</span>
          </div>
          <div className="mt-4 space-y-3">
            {STUDIO_SECTIONS.map((section) => (
              <button key={section.id} type="button" onClick={() => document.getElementById(`studio-${section.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="flex w-full items-center justify-between rounded-2xl bg-ice-50 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-brand-50 hover:text-brand-700"
              >
                <span>{section.title}</span>
                <Icon name="arrow-right" className="text-xs text-slate-400" />
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-[1.8rem] border border-ice-200 bg-white p-5 shadow-sm">
          <h2 className="font-display text-lg font-bold text-brand-950">Status at a Glance</h2>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-ice-50 px-3 py-2.5">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Status</span>
              <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${studio.listingForm.publishStatus === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                {studio.listingForm.publishStatus === 'published' ? 'Published' : 'Draft'}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-ice-50 px-3 py-2.5">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Amenities</span>
              <span className="text-sm font-semibold text-slate-700">{studio.selectedListing?.amenities?.length || 0}</span>
            </div>
            {studio.hasUnsavedChanges ? (
              <div className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-2 text-xs font-semibold text-amber-800">
                <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                Unsaved changes
              </div>
            ) : null}
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
            <button type="button" onClick={() => onShowPage('dashboard')} className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">Review Dashboard</button>
          </div>
          <div className="mt-5">
            <PublishedListingsGrid listings={listings.slice(0, 3)} formatCurrency={formatCurrency} compact />
          </div>
        </section>
      </aside>
    </div>
  );
}