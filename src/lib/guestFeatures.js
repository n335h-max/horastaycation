export const GUEST_WISHLIST_KEY = 'guest';

export function getWishlistKey(authUser) {
  return authUser?.id || authUser?.email || GUEST_WISHLIST_KEY;
}

export function getWishlistIds(store, authUser) {
  const key = getWishlistKey(authUser);
  const wishlist = store?.wishlistByUser?.[key];
  return Array.isArray(wishlist) ? wishlist : [];
}

export function isRangeBlocked(property, checkin, checkout) {
  if (!property || !checkin || !checkout) {
    return false;
  }

  const blockedDates = new Set(property.blockedDates || []);
  const cursor = new Date(checkin);
  const endDate = new Date(checkout);

  while (cursor < endDate) {
    const isoDate = cursor.toISOString().slice(0, 10);

    if (blockedDates.has(isoDate)) {
      return true;
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return false;
}

export function summarizeAnalytics(events = [], bookingTransactions = [], supportRequests = [], wishlistByUser = {}) {
  const counts = events.reduce((summary, event) => {
    const nextSummary = { ...summary };
    nextSummary[event.type] = (nextSummary[event.type] || 0) + 1;
    return nextSummary;
  }, {});

  const uniqueWishlistedProperties = new Set(
    Object.values(wishlistByUser)
      .flatMap((wishlist) => (Array.isArray(wishlist) ? wishlist : []))
      .filter(Boolean),
  ).size;

  const searches = counts.search || 0;
  const bookings = bookingTransactions.length;
  const conversionRate = searches ? Math.round((bookings / searches) * 100) : 0;

  return {
    searches,
    bookings,
    pageViews: counts.page_view || 0,
    wishlistAdds: counts.wishlist_add || 0,
    wishlistRemoves: counts.wishlist_remove || 0,
    supportOpens: counts.support_open || 0,
    supportMessages: supportRequests.length,
    installPrompts: counts.install_prompt || 0,
    uniqueWishlistedProperties,
    conversionRate,
    recentEvents: events.slice(0, 6),
  };
}
