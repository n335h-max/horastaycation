export const NAV_ITEMS = [
  { label: 'Introduction', sectionId: 'intro' },
  { label: 'Build with Us', page: 'owner-signup' },
  { label: 'Book a Staycation', page: 'booking' },
  { label: 'Evaluate with Us', page: 'evaluate' },
];

export const HORA_VALUES = [
  {
    letter: 'H',
    title: 'Healing',
    description:
      'Restore mind and soul with stays designed to bring calm, comfort, and a genuine sense of escape.',
    cardClass: 'from-brand-600 to-brand-700',
  },
  {
    letter: 'O',
    title: 'Outdoor',
    description:
      'Experience the beauty of landscape, from beaches to highlands, through memorable outdoor moments.',
    cardClass: 'from-brand-500 to-brand-600',
  },
  {
    letter: 'R',
    title: 'Retreat',
    description:
      'Step away from the rush and retreat into spaces created for rest, reflection, and renewal.',
    cardClass: 'from-accent-500 to-accent-400',
  },
  {
    letter: 'A',
    title: 'Ambience',
    description:
      'Enjoy thoughtfully crafted ambience where every detail adds warmth, comfort, and connection.',
    cardClass: 'from-brand-700 to-brand-800',
  },
];

export const FEATURE_PILLARS = [
  {
    title: 'Tiny House Staycation',
    description:
      'Compact staycation spaces designed wisely for maximum comfort and a more meaningful stay experience.',
    icon: 'home',
  },
  {
    title: 'Close to Nature',
    description:
      'Surrounded by greenery to support calm, comfort, and the peaceful mood guests expect from Hora.',
    icon: 'leaf',
  },
  {
    title: 'Modern Design',
    description:
      'Minimal, functional, and visually strong design concepts that feel modern while staying guest-friendly.',
    icon: 'sofa',
  },
];

export const PLATFORM_FEATURES = [
  {
    title: 'Search Bar',
    description: 'Users expect to search by location and date before they decide where to stay.',
    implementation: 'Elastic Search or Algolia',
    icon: 'location',
  },
  {
    title: 'Wishlist',
    description: 'Lets guests save favorite properties for later and return with higher booking intent.',
    implementation: 'Heart icon with user account storage',
    icon: 'star',
  },
  {
    title: 'Chat Support',
    description: 'Answers guest questions faster during browsing and booking.',
    implementation: 'Intercom or Zendesk integration',
    icon: 'email',
  },
  {
    title: 'Mobile App',
    description: 'About 60% of bookings happen on mobile, so the experience needs a strong mobile-first flow.',
    implementation: 'React Native app or PWA',
    icon: 'bars',
  },
  {
    title: 'Analytics',
    description: 'Tracks bookings, revenue, and user behavior so the business can improve conversion.',
    implementation: 'Google Analytics plus a custom dashboard',
    icon: 'chart',
  },
];

export const STATS = [
  { label: 'Happy Guests', value: 100 },
  { label: 'Star Rated', value: 5, suffix: '' },
  { label: 'Featured Escapes', value: 7 },
  { label: 'Starter Builds', value: 80, prefix: 'RM', suffix: 'K+' },
];

export const FEATURED_PROPERTIES = [
  {
    id: 'ayer-keroh',
    name: 'Ayer Keroh',
    location: 'Melaka',
    price: 1,
    ratingLabel: '4.8',
    reviewCount: 24,
    badge: 'Guest Preview',
    badgeIcon: 'fire',
    statusNote: 'Guest preview listing',
    mood: 'Compact staycation direction with tiny-house comfort, clean pathways, and a polished first impression.',
    bestFor: 'Best for cozy tiny-house stays',
    image: '/staycations/ayer-keroh-melaka.png',
    summaryImage: '/staycations/ayer-keroh-melaka.png',
    thumbnail: '/staycations/ayer-keroh-melaka.png',
    videoUrl: '',
    schedule: 'Daily check-in from 3:00 PM · Check-out before 11:00 AM',
    amenities: ['Tiny House', 'Modern Design', 'Landscape'],
    guestCapacity: 4,
    reviewSnippet: 'Beautiful entrance and very clean layout. It feels polished the moment you walk in.',
    reviewAuthor: 'Nadia, weekend guest',
  },
  {
    id: 'sama-sama-tido',
    name: 'Sama Sama Tido',
    location: 'Melaka',
    price: 1,
    ratingLabel: '5.0',
    reviewCount: 18,
    badge: 'Poolside Escape',
    badgeIcon: 'leaf',
    statusNote: 'Guest preview listing',
    mood: 'A resort-style layout that highlights poolside leisure, outdoor social space, and broad lawn views.',
    bestFor: 'Best for poolside family stays',
    image: '/staycations/sama-sama-tido-melaka.png',
    summaryImage: '/staycations/sama-sama-tido-melaka.png',
    thumbnail: '/staycations/sama-sama-tido-melaka.png',
    videoUrl: '',
    schedule: 'Weekend priority stays · Check-in from 3:00 PM',
    amenities: ['Pool', 'BBQ Place', 'Outdoor Kitchen'],
    guestCapacity: 8,
    reviewSnippet: 'The lawn and open space make this one feel perfect for relaxed family gatherings.',
    reviewAuthor: 'Faris, family stay',
  },
  {
    id: 'bohejiwa',
    name: 'Bohejiwa',
    location: 'Port Dickson',
    price: 1,
    ratingLabel: '4.7',
    reviewCount: 15,
    badge: 'Signature Ambience',
    badgeIcon: 'gem',
    statusNote: 'Guest preview listing',
    mood: 'A stronger ambience-led concept with identity-building details and memorable guest arrival moments.',
    bestFor: 'Best for concept-led branding',
    image: '/staycations/bohejiwa-port-dickson.png',
    summaryImage: '/staycations/bohejiwa-port-dickson.png',
    thumbnail: '/staycations/bohejiwa-port-dickson.png',
    videoUrl: '',
    schedule: 'Flexible weekday stays · Check-in from 2:00 PM',
    amenities: ['Ambience', 'Signboard', 'Marketing'],
    guestCapacity: 6,
    reviewSnippet: 'Strong ambience and memorable branding touches. The night atmosphere stands out.',
    reviewAuthor: 'Aina, couple trip',
  },
  {
    id: 'alang-villa',
    name: 'Alang Villa',
    location: 'Port Dickson',
    price: 1,
    ratingLabel: '4.9',
    reviewCount: 17,
    badge: 'Private Escape',
    badgeIcon: 'star',
    statusNote: 'Guest preview listing',
    mood: 'A staycation presentation shaped for private escapes, stronger branding, and destination appeal.',
    bestFor: 'Best for private villa escapes',
    image: '/staycations/alangs-villa-port-dickson.png',
    summaryImage: '/staycations/alangs-villa-port-dickson.png',
    thumbnail: '/staycations/alangs-villa-port-dickson.png',
    videoUrl: '',
    schedule: 'Daily check-in from 3:00 PM · Quiet-hour friendly stay',
    amenities: ['Private Escape', 'Branding', 'Landscape'],
    guestCapacity: 6,
    reviewSnippet: 'Private, tidy, and easy to recognize on arrival. Great for a more exclusive stay feel.',
    reviewAuthor: 'Hakim, short retreat',
  },
  {
    id: 'aviva',
    name: 'Aviva',
    location: 'Seremban 2',
    price: 1,
    ratingLabel: '4.6',
    reviewCount: 13,
    badge: 'Cozy Retreat',
    badgeIcon: 'leaf',
    statusNote: 'Guest preview listing',
    mood: 'Compact hospitality planning that supports a cozy layout with clean landscaping and approachable scale.',
    bestFor: 'Best for cozy short stays',
    image: '/staycations/aviva-seremban-2.png',
    summaryImage: '/staycations/aviva-seremban-2.png',
    thumbnail: '/staycations/aviva-seremban-2.png',
    videoUrl: '',
    schedule: 'Easy weekend stays · Check-in from 3:00 PM',
    amenities: ['Cozy Layout', 'Landscape', 'Hospitality'],
    guestCapacity: 3,
    reviewSnippet: 'Compact but cozy. The tiny-house style feels warm and comfortable at night.',
    reviewAuthor: 'Siti, solo escape',
  },
  {
    id: 'jalan-kebun',
    name: 'Jalan Kebun',
    location: 'Bangi',
    price: 1,
    ratingLabel: '4.7',
    reviewCount: 11,
    badge: 'Nature Flow',
    badgeIcon: 'fire',
    statusNote: 'Guest preview listing',
    mood: 'A practical staycation setup where outdoor circulation, guest flow, and maintenance remain manageable.',
    bestFor: 'Best for easy group circulation',
    image: '/staycations/jalan-kebun-bangi.png',
    summaryImage: '/staycations/jalan-kebun-bangi.png',
    thumbnail: '/staycations/jalan-kebun-bangi.png',
    videoUrl: '',
    schedule: 'Flexible stays · Smooth check-in access',
    amenities: ['Guest Flow', 'Landscape', 'Maintenance'],
    guestCapacity: 5,
    reviewSnippet: 'Easy circulation and practical layout. It works well for small groups and family movement.',
    reviewAuthor: 'Azri, group guest',
  },
  {
    id: 'amana-villa',
    name: 'Amana Villa',
    location: 'Port Dickson',
    price: 1,
    ratingLabel: '4.9',
    reviewCount: 16,
    badge: 'Refreshed Ambience',
    badgeIcon: 'gem',
    statusNote: 'Guest preview listing',
    mood: 'A proposal reference focused on comfort, ambience, and refreshed landscape-led guest experiences.',
    bestFor: 'Best for calm coastal escapes',
    image: '/staycations/amana-villa-port-dickson.png',
    summaryImage: '/staycations/amana-villa-port-dickson.png',
    thumbnail: '/staycations/amana-villa-port-dickson.png',
    videoUrl: '',
    schedule: 'Daily check-in from 3:00 PM · Relaxed guest pacing',
    amenities: ['Comfort', 'Ambience', 'Landscape'],
    guestCapacity: 5,
    reviewSnippet: 'Comfortable, calm, and refreshing. The landscaped front area gives a soft premium feel.',
    reviewAuthor: 'Liyana, returning guest',
  },
];

export const PREVIOUS_PROJECTS = [
  {
    id: 'ayer-keroh',
    name: 'Ayer Keroh',
    location: 'Melaka',
    label: 'Previous Project 01',
    summary: 'Compact staycation direction with tiny-house comfort, clean pathways, and a polished first impression.',
    image: '/staycations/ayer-keroh-melaka.png',
  },
  {
    id: 'sama-sama-tido',
    name: 'Sama Sama Tido',
    location: 'Melaka',
    label: 'Previous Project 02',
    summary: 'A resort-style layout that highlights poolside leisure, outdoor social space, and broad lawn views.',
    image: '/staycations/sama-sama-tido-melaka.png',
  },
  {
    id: 'bohejiwa',
    name: 'Bohejiwa',
    location: 'Port Dickson',
    label: 'Previous Project 03',
    summary: 'A stronger ambience-led concept with identity-building details and memorable guest arrival moments.',
    image: '/staycations/bohejiwa-port-dickson.png',
  },
  {
    id: 'alang-villa',
    name: 'Alang Villa',
    location: 'Port Dickson',
    label: 'Previous Project 04',
    summary: 'A staycation presentation shaped for private escapes, stronger branding, and destination appeal.',
    image: '/staycations/alangs-villa-port-dickson.png',
  },
  {
    id: 'aviva',
    name: 'Aviva',
    location: 'Seremban 2',
    label: 'Previous Project 05',
    summary: 'Compact hospitality planning that supports a cozy layout with clean landscaping and approachable scale.',
    image: '/staycations/aviva-seremban-2.png',
  },
  {
    id: 'jalan-kebun',
    name: 'Jalan Kebun',
    location: 'Bangi',
    label: 'Previous Project 06',
    summary: 'A practical staycation setup where outdoor circulation, guest flow, and maintenance remain manageable.',
    image: '/staycations/jalan-kebun-bangi.png',
  },
  {
    id: 'amana-villa',
    name: 'Amana Villa',
    location: 'Port Dickson',
    label: 'Previous Project 07',
    summary: 'A proposal reference focused on comfort, ambience, and refreshed landscape-led guest experiences.',
    image: '/staycations/amana-villa-port-dickson.png',
  },
];

export const CONCEPT_OPTIONS = [
  {
    id: 'modern',
    title: 'Modern Concept',
    icon: 'home',
    image: '/staycations/ayer-keroh-melaka.png',
    summary: 'A blend of clean lines, elegant forms, and natural beauty for a stylish, contemporary staycation feel.',
    points: ['Modern design', 'Natural beauty', 'Warm ambience'],
  },
  {
    id: 'japanese',
    title: 'Japanese Concept',
    icon: 'leaf',
    image: '/staycations/sama-sama-tido-melaka.png',
    summary: 'A serene direction with minimalist design, natural materials, and calming ambience for peaceful stays.',
    points: ['Japanese design', 'Natural elements', 'Relaxing ambience'],
  },
  {
    id: 'natural',
    title: 'Natural Concept',
    icon: 'tree',
    image: '/staycations/bohejiwa-port-dickson.png',
    summary: 'A harmonious mix of greenery, stone, wood, and warm lighting to create a refreshing environment.',
    points: ['Natural design', 'Green elements', 'Warm ambience'],
  },
];

export const ADD_ON_OPTIONS = [
  {
    id: 'pool',
    title: 'Pool',
    icon: 'hotub',
    summary: 'Adds strong visual appeal and helps create a more relaxing resort-style guest experience.',
  },
  {
    id: 'bbq',
    title: 'BBQ Place',
    icon: 'fire',
    summary: 'Creates a dedicated social space for outdoor dining, gathering, and memorable shared moments.',
  },
  {
    id: 'outdoor-kitchen',
    title: 'Outdoor Kitchen',
    icon: 'kitchen',
    summary: 'Adds a practical cooking area outside the tiny house and supports light hosting activity.',
  },
  {
    id: 'water-feature',
    title: 'Water Feature',
    icon: 'star',
    summary: 'Enhances ambience with a calming effect and helps the staycation feel more curated and tranquil.',
  },
  {
    id: 'plants',
    title: 'Planting & Greenery',
    icon: 'leaf',
    summary: 'Brings nature closer, improves visual freshness, and supports the relaxing Hora atmosphere.',
  },
  {
    id: 'marketing',
    title: 'Marketing Support',
    icon: 'chart',
    summary: 'Supports awareness through professional visuals, posting plans, and stronger listing presentation.',
  },
];

export const STARTING_PACKAGE = {
  priceLabel: 'RM80,000',
  title: 'Starting From RM80,000',
  description:
    'The proposal frames this level as a compact, well worth the experience direction for a tiny-house staycation with curated design and landscape value.',
  includes: [
    'Tiny house base direction',
    'Landscape and ambience planning',
    'Flexible add-on discussion',
  ],
};

export const OWNER_BENEFITS = [
  {
    title: 'Starter Budget Guidance',
    description: 'The proposal positions a starter direction around RM80,000 for a compact, well worth the experience setup.',
    icon: 'list-check',
  },
  {
    title: 'Add-On ++ Support',
    description: 'Pool, BBQ place, outdoor kitchen, planting, water features, and other curated enhancements can be planned with Hora.',
    icon: 'chart',
  },
  {
    title: 'Marketing & Identity',
    description: 'Professional visuals, awareness support, and F.O.C signboard ideas help shape a stronger public-facing listing.',
    icon: 'shield',
  },
];

export const TESTIMONIALS = [
  {
    quote: 'Absolutely stunning property! The host was incredibly welcoming.',
    name: 'Sarah M.',
    role: 'Guest',
    rating: 5,
  },
  {
    quote: 'Perfect weekend getaway. We will definitely come back!',
    name: 'James K.',
    role: 'Guest',
    rating: 4,
  },
];

export const DASHBOARD_STATS = [
  { id: 'bookings', label: 'Total Bookings', value: 156, trend: '12%', icon: 'calendar' },
  { id: 'revenue', label: 'Revenue', value: 48290, trend: '23%', icon: 'dollar', currency: true },
  { id: 'properties', label: 'Active Properties', value: 24, icon: 'house' },
  { id: 'reviews', label: 'Average Rating', value: 4.8, icon: 'star' },
];

export const INITIAL_BOOKINGS = [
  {
    guest: 'Sarah Mitchell',
    property: 'Ayer Keroh — 3 nights',
    amount: 3,
    status: 'Confirmed',
    image: 'https://picsum.photos/seed/guest1/40/40.jpg',
  },
  {
    guest: 'James Rodriguez',
    property: 'Sama Sama Tido — 5 nights',
    amount: 5,
    status: 'Confirmed',
    image: 'https://picsum.photos/seed/guest2/40/40.jpg',
  },
  {
    guest: 'Emily Chen',
    property: 'Bohejiwa — 2 nights',
    amount: 2,
    status: 'Pending',
    image: 'https://picsum.photos/seed/guest3/40/40.jpg',
  },
];

export const INITIAL_EMAILS = [
  {
    title: 'Booking Confirmed — Customer',
    detail: 'Sent to sarah@example.com',
    tone: 'indigo',
  },
  {
    title: 'New Booking Alert — Owner',
    detail: 'Sent to villa-owner@example.com',
    tone: 'brand',
  },
  {
    title: 'New Booking Alert — Management',
    detail: 'Sent to admin@horastaycation.com',
    tone: 'accent',
  },
];

export const OWNER_AMENITIES = [
  'Swimming Pool',
  'WiFi',
  'Kitchen',
  'Parking',
  'Hot Tub',
  'Pet Friendly',
];

export const OWNER_PROPERTY_TYPES = [
  'Tiny House',
  'Villa',
  'Cabin',
  'Penthouse',
  'Cottage',
  'Glamping',
  'Beach House',
  'Lodge',
];

export const SEARCH_LOCATIONS = [
  'Any location',
  'Port Dickson',
  'Cameron Highlands',
  'Langkawi',
  'Genting Highlands',
  'Desaru Coast',
  'Melaka',
];

export const GUEST_OPTIONS = [
  { value: '1', label: '1 Guest' },
  { value: '2', label: '2 Guests' },
  { value: '3', label: '3 Guests' },
  { value: '4', label: '4 Guests' },
];

export const BUDGET_OPTIONS = [
  { value: 'RM 50,000 - RM 80,000', label: 'RM 50,000 - RM 80,000' },
  { value: 'RM 80,000 - RM 120,000', label: 'RM 80,000 - RM 120,000' },
  { value: 'RM 120,000 - RM 180,000', label: 'RM 120,000 - RM 180,000' },
  { value: 'RM 180,000+', label: 'RM 180,000+' },
];

export const SPECIAL_REQUEST_OPTIONS = [
  { value: '', label: 'No special request' },
  { value: 'Early check-in request', label: 'Early check-in' },
  { value: 'Late check-out request', label: 'Late check-out' },
  { value: 'Romantic setup request', label: 'Romantic setup' },
  { value: 'Family-ready setup request', label: 'Family-ready setup' },
];

export const RATING_OPTIONS = [
  '5 - Excellent',
  '4 - Good',
  '3 - Average',
  '2 - Below Average',
  '1 - Poor',
];

export const SOCIAL_LINKS = [
  { label: 'Instagram', href: '#', icon: 'instagram' },
  { label: 'Twitter', href: '#', icon: 'twitter' },
  { label: 'LinkedIn', href: '#', icon: 'linkedin' },
];

export const RANDOM_GUEST_NAMES = ['Alex Turner', 'Maria Garcia', 'David Kim', 'Lisa Wang', 'Omar Hassan'];
