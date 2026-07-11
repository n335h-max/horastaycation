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
    description: 'Restore mind and soul with stays designed to bring calm, comfort, and a genuine sense of escape.',
    cardClass: 'from-brand-600 to-brand-700',
  },
  {
    letter: 'O',
    title: 'Outdoor',
    description: 'Experience the beauty of landscape, from beaches to highlands, through memorable outdoor moments.',
    cardClass: 'from-brand-500 to-brand-600',
  },
  {
    letter: 'R',
    title: 'Retreat',
    description: 'Step away from the rush and retreat into spaces created for rest, reflection, and renewal.',
    cardClass: 'from-accent-500 to-accent-400',
  },
  {
    letter: 'A',
    title: 'Ambience',
    description: 'Enjoy thoughtfully crafted ambience where every detail adds warmth, comfort, and connection.',
    cardClass: 'from-brand-700 to-brand-800',
  },
];

export const FEATURE_PILLARS = [
  {
    title: 'Tiny House Staycation',
    description: 'Compact staycation spaces designed wisely for maximum comfort and a more meaningful stay experience.',
    icon: 'home',
  },
  {
    title: 'Close to Nature',
    description: 'Surrounded by greenery to support calm, comfort, and the peaceful mood guests expect from Hora.',
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
  { label: 'Guest Happiness', value: '100%', suffix: '' },
  { label: 'Past Projects', value: 7, suffix: '' },
  { label: 'Design Concepts', value: 3, suffix: '' },
  { label: 'Starter Budget', prefix: 'RM', value: 80, suffix: 'K+' },
];

export const FEATURED_PROPERTIES = [];

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
    image: '/staycations/concepts/modern.png',
    summary: 'A blend of clean lines, elegant forms, and natural beauty for a stylish, contemporary staycation feel.',
    points: ['Modern design', 'Natural beauty', 'Warm ambience'],
  },
  {
    id: 'japanese',
    title: 'Japanese Concept',
    icon: 'leaf',
    image: '/staycations/concepts/japanese.png',
    summary: 'A serene direction with minimalist design, natural materials, and calming ambience for peaceful stays.',
    points: ['Japanese design', 'Natural elements', 'Relaxing ambience'],
  },
  {
    id: 'natural',
    title: 'Natural Concept',
    icon: 'tree',
    image: '/staycations/concepts/natural.png',
    summary: 'A harmonious mix of greenery, stone, wood, and warm lighting to create a refreshing environment.',
    points: ['Natural design', 'Green elements', 'Warm ambience'],
  },
];

export const ADD_ON_OPTIONS = [
  {
    id: 'pool',
    title: 'Pool',
    icon: 'hotub',
    image: '/staycations/addons/pool.png',
    summary: 'Adds strong visual appeal and helps create a more relaxing resort-style guest experience.',
  },
  {
    id: 'bbq',
    title: 'BBQ Place',
    icon: 'fire',
    image: '/staycations/addons/bbq-place.png',
    summary: 'Creates a dedicated social space for outdoor dining, gathering, and memorable shared moments.',
  },
  {
    id: 'outdoor-kitchen',
    title: 'Outdoor Kitchen',
    icon: 'kitchen',
    image: '/staycations/addons/outdoor-kitchen.png',
    summary: 'Adds a practical cooking area outside the tiny house and supports light hosting activity.',
  },
  {
    id: 'marketing',
    title: 'Marketing Support',
    icon: 'chart',
    image: '/staycations/addons/marketing.png',
    summary: 'Supports awareness through professional visuals, posting plans, and stronger listing presentation.',
  },
  {
    id: 'foc-signboard',
    title: 'F.O.C Signboard',
    icon: 'shield',
    image: '/staycations/addons/foc-signboard.png',
    summary: 'Free signboard plus an additional 5% discount, included and customizable with your homestay brand name.',
    label: '01.',
    highlight: 'Included',
    bullets: ['Free signboard + less 5% discount', 'Customizable with homestay brand name'],
    features: [
      {
        title: 'Free Signboard',
        description: 'Complimentary signboard to give your homestay a more professional look.',
      },
      {
        title: 'Less 5% Discount',
        description: 'Enjoy an additional 5% off to make your staycation project even more rewarding.',
      },
      {
        title: 'Customizable',
        description: 'Personalize the signboard with your homestay or brand name.',
      },
      {
        title: 'Create Identity',
        description: 'Stand out and leave a lasting impression on your guests.',
      },
    ],
  },
  {
    id: 'plants',
    title: 'Heliconia & Jasminum',
    icon: 'leaf',
    summary:
      'Bring nature closer with low-maintenance greenery that adds freshness, texture, and a relaxing staycation vibe.',
    label: 'Plants',
    varieties: [
      {
        title: '01. Heliconia',
        image: '/staycations/addons/heliconia.png',
        points: [
          'Lush greenery that adds height, texture, and a natural touch.',
          'Perfect for tropical and modern staycation spaces.',
        ],
      },
      {
        title: '02. Jasminum',
        image: '/staycations/addons/jasminum.png',
        points: [
          'Compact and beautiful with delicate white blooms.',
          'Easy to maintain and ideal for a relaxing vibe.',
        ],
      },
    ],
  },
];

export const STARTING_PACKAGE = {
  priceLabel: 'RM80,000',
  title: 'Starting From RM80,000',
  description:
    'The proposal frames this level as a compact, well worth the experience direction for a tiny-house staycation with curated design and landscape value.',
  includes: ['Tiny house base direction', 'Landscape and ambience planning', 'Flexible add-on discussion'],
};

export const OWNER_BENEFITS = [
  {
    title: 'Starter Budget Guidance',
    description:
      'The proposal positions a starter direction around RM80,000 for a compact, well worth the experience setup.',
    icon: 'list-check',
  },
  {
    title: 'Add-On ++ Support',
    description:
      'Pool, BBQ place, outdoor kitchen, planting, water features, and other curated enhancements can be planned with Hora.',
    icon: 'chart',
  },
  {
    title: 'Marketing & Identity',
    description:
      'Professional visuals, awareness support, and F.O.C signboard ideas help shape a stronger public-facing listing.',
    icon: 'shield',
  },
];

export const TESTIMONIALS = [
  {
    quote:
      'The best... a pleasure to deal with. 5 stars for the green group team. Let the pictures speak for themselves 🤭',
    name: 'lera. Hsn',
    role: 'Reviewer',
    rating: 5,
    image: 'image_d67fc7.png',
  },
  {
    quote:
      'Excellent landscape service by Hijau Group. Provided a design up to my expectation and executed the job vey well. Good value for money. Highly recommend.',
    name: 'Subra Perumal',
    role: 'Reviewer',
    rating: 5,
    image: 'image_d67fd0.jpg',
  },
  {
    quote: 'Had a very smooth project with Hijau Group recently . Best timeline with best results!',
    name: 'Qaesya Azizi',
    role: 'Reviewer',
    rating: 5,
    image: 'image_d67fea.jpg',
  },
  {
    quote:
      'I am pleased and delighted with the services provided. End to end services provided seamlessly. The professionalism and artistic design given put me at ease in living everthing in their hand. Highly recommends Hijau Group for quick turnaround of your landscape refresh need.',
    name: 'Zarul Zarul',
    role: 'Reviewer',
    rating: 5,
    image: 'image_d67fef.png',
  },
  {
    quote: 'Decent owner and best service provided',
    name: 'ouija81 Ask',
    role: 'Reviewer',
    rating: 5,
    image: 'image_d6800a.jpg',
  },
  {
    quote:
      "I am very satisfied with Hijau Landscape's service. The work was neat, professional and met my and my husband's needs. My house has really changed and looks much more beautiful after their touch. Highly recommended for anyone looking for quality landscaping services. 👍🌿",
    name: 'ZULIANA ZOOLKEFLI',
    role: 'Reviewer',
    rating: 5,
  },
];

// Placeholder: Management stats will be computed from real data once listings and bookings are live.
export const DASHBOARD_STATS = [];

export const INITIAL_BOOKINGS = [];

export const INITIAL_EMAILS = [];

export const OWNER_AMENITIES = ['Swimming Pool', 'WiFi', 'Kitchen', 'Parking', 'Hot Tub', 'Pet Friendly'];

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

export const RATING_OPTIONS = ['5 - Excellent', '4 - Good', '3 - Average', '2 - Below Average', '1 - Poor'];

export const SOCIAL_LINKS = [
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/p/Hijau-Group-Landscape-100063573459541/',
    icon: 'facebook',
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/hijaugroup.landscape/',
    icon: 'instagram',
  },
  {
    label: 'TikTok',
    href: 'https://www.tiktok.com/@hijaugrouplandscape',
    icon: 'tiktok',
  },
];

