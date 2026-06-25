import { getWishlistKey } from '../lib/guestFeatures';
import { loadStore, saveStore } from './localStore';

export async function toggleWishlistProperty({ authUser, propertyId }) {
  const store = loadStore();
  const wishlistKey = getWishlistKey(authUser);
  const currentWishlist = Array.isArray(store.wishlistByUser[wishlistKey]) ? store.wishlistByUser[wishlistKey] : [];
  const alreadySaved = currentWishlist.includes(propertyId);

  store.wishlistByUser = {
    ...store.wishlistByUser,
    [wishlistKey]: alreadySaved ? currentWishlist.filter((id) => id !== propertyId) : [...currentWishlist, propertyId],
  };

  saveStore(store);

  return {
    store,
    saved: !alreadySaved,
    wishlist: store.wishlistByUser[wishlistKey],
  };
}
