import { useMemo } from 'react';
import { formatCurrency } from '../../lib/formatters';

function getListingBadge(property) {
  if (property.publishStatus === 'draft') {
    return { label: 'Draft', className: 'bg-slate-100 text-slate-700' };
  }
  if (property.blockedDates?.length) {
    return { label: 'Blocked', className: 'bg-amber-50 text-amber-700' };
  }
  return { label: 'Published', className: 'bg-emerald-50 text-emerald-700' };
}

export function PublishedListingsGrid({ listings, compact = false }) {
  return (
    <div className={`grid gap-4 ${compact ? 'md:grid-cols-1' : 'md:grid-cols-2 xl:grid-cols-3'}`}>
      {listings.map((property) => {
        const badge = getListingBadge(property);
        return (
          <article
            key={property.id}
            className="overflow-hidden rounded-[1.8rem] border border-ice-200 bg-white shadow-sm"
          >
            <img
              src={property.thumbnail}
              alt={property.name}
              className={`w-full object-cover ${compact ? 'h-36' : 'h-40'}`}
            />
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
