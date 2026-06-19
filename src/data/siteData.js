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
      'Experience the beauty of nature, from beaches to highlands, through memorable outdoor moments.',
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
  { label: 'Projects Shown', value: 7 },
  { label: 'Core HORA Values', value: 4 },
  { label: 'Featured Concepts', value: 5 },
  { label: 'Starter Budget (RM)', value: 80, prefix: 'RM', suffix: 'K' },
];

export const FEATURED_PROPERTIES = [
  {
    id: 'villa-serena',
    name: 'Ayer Keroh',
    location: 'Melaka',
    price: 289,
    ratingLabel: '4.8',
    reviewCount: 24,
    badge: 'Previous Project',
    badgeIcon: 'fire',
    statusNote: 'Proposal reference project',
    mood: 'Tiny-house comfort with clean landscape lines, peaceful lighting, and easy guest movement.',
    bestFor: 'Best for first Hora showcase',
    image: 'https://picsum.photos/seed/ayer-keroh-hora/500/375.jpg',
    summaryImage: 'https://picsum.photos/seed/ayer-keroh-hora/400/200.jpg',
    thumbnail: 'https://picsum.photos/seed/ayer-keroh-hora/80/60.jpg',
    videoUrl: '',
    schedule: 'Daily check-in from 3:00 PM · Check-out before 11:00 AM',
    amenities: ['Tiny House', 'Modern Design', 'Landscape'],
  },
  {
    id: 'alpine-lodge',
    name: 'Sama Sama Tido',
    location: 'Melaka',
    price: 345,
    ratingLabel: '5.0',
    reviewCount: 18,
    badge: 'Featured Project',
    badgeIcon: 'leaf',
    statusNote: 'Proposal reference project',
    mood: 'Resort-style lawn, pool, and outdoor gathering areas shaped for relaxed family stays.',
    bestFor: 'Best for poolside family stays',
    image: 'https://picsum.photos/seed/sama-sama-tido-hora/500/375.jpg',
    summaryImage: 'https://picsum.photos/seed/sama-sama-tido-hora/400/200.jpg',
    thumbnail: 'https://picsum.photos/seed/sama-sama-tido-hora/80/60.jpg',
    videoUrl: '',
    schedule: 'Weekend priority stays · Check-in from 3:00 PM',
    amenities: ['Pool', 'BBQ Place', 'Outdoor Kitchen'],
  },
  {
    id: 'skyline-penthouse',
    name: 'Bohejiwa',
    location: 'Port Dickson',
    price: 475,
    ratingLabel: '4.7',
    reviewCount: 15,
    badge: 'Design Concept',
    badgeIcon: 'gem',
    statusNote: 'Proposal reference project',
    mood: 'A stronger ambience-led direction with greenery, identity signage, and a memorable guest arrival feel.',
    bestFor: 'Best for concept-led branding',
    image: 'https://picsum.photos/seed/bohejiwa-hora/500/375.jpg',
    summaryImage: 'https://picsum.photos/seed/bohejiwa-hora/400/200.jpg',
    thumbnail: 'https://picsum.photos/seed/bohejiwa-hora/80/60.jpg',
    videoUrl: '',
    schedule: 'Flexible weekday stays · Check-in from 2:00 PM',
    amenities: ['Ambience', 'Signboard', 'Marketing'],
  },
];

export const PREVIOUS_PROJECTS = [
  {
    id: 'ayer-keroh',
    name: 'Ayer Keroh',
    location: 'Melaka',
    label: 'Previous Project 01',
    summary: 'Compact staycation direction with tiny-house comfort, clean pathways, and a polished first impression.',
  },
  {
    id: 'sama-sama-tido',
    name: 'Sama Sama Tido',
    location: 'Melaka',
    label: 'Previous Project 02',
    summary: 'A resort-style layout that highlights poolside leisure, outdoor social space, and broad lawn views.',
  },
  {
    id: 'bohejiwa',
    name: 'Bohejiwa',
    location: 'Port Dickson',
    label: 'Previous Project 03',
    summary: 'A stronger ambience-led concept with identity-building details and memorable guest arrival moments.',
  },
  {
    id: 'alang-villa',
    name: 'Alang Villa',
    location: 'Port Dickson',
    label: 'Previous Project 04',
    summary: 'A staycation presentation shaped for private escapes, stronger branding, and destination appeal.',
  },
  {
    id: 'aviva',
    name: 'Aviva',
    location: 'Seremban 2',
    label: 'Previous Project 05',
    summary: 'Compact hospitality planning that supports a cozy layout with clean landscaping and approachable scale.',
  },
  {
    id: 'jalan-kebun',
    name: 'Jalan Kebun',
    location: 'Bangi',
    label: 'Previous Project 06',
    summary: 'A practical staycation setup where outdoor circulation, guest flow, and maintenance remain manageable.',
  },
  {
    id: 'amana-villa',
    name: 'Amana Villa',
    location: 'Port Dickson',
    label: 'Previous Project 07',
    summary: 'A proposal reference focused on comfort, ambience, and refreshed landscape-led guest experiences.',
  },
];

export const CONCEPT_OPTIONS = [
  {
    id: 'modern',
    title: 'Modern Concept',
    icon: 'home',
    summary: 'A blend of clean lines, elegant forms, and natural beauty for a stylish, contemporary staycation feel.',
    points: ['Modern design', 'Natural beauty', 'Warm ambience'],
  },
  {
    id: 'japanese',
    title: 'Japanese Concept',
    icon: 'leaf',
    summary: 'A serene direction with minimalist design, natural materials, and calming ambience for peaceful stays.',
    points: ['Japanese design', 'Natural elements', 'Relaxing ambience'],
  },
  {
    id: 'natural',
    title: 'Natural Concept',
    icon: 'tree',
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
  highlights: [
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
    author: 'Sarah M.',
    rating: 5,
  },
  {
    quote: 'Perfect weekend getaway. We will definitely come back!',
    author: 'James K.',
    rating: 4.5,
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
    property: 'Villa Serena — 3 nights',
    amount: 867,
    status: 'Confirmed',
    image: 'https://picsum.photos/seed/guest1/40/40.jpg',
  },
  {
    guest: 'James Rodriguez',
    property: 'Alpine Lodge — 5 nights',
    amount: 1725,
    status: 'Confirmed',
    image: 'https://picsum.photos/seed/guest2/40/40.jpg',
  },
  {
    guest: 'Emily Chen',
    property: 'Skyline Penthouse — 2 nights',
    amount: 950,
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
