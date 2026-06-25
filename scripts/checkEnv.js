const required = [
  'VITE_STRIPE_PUBLISHABLE_KEY',
  'STRIPE_SECRET_KEY',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
];

const optional = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_WEBHOOK_SECRET',
];

const validators = {
  VITE_STRIPE_PUBLISHABLE_KEY: (val) => /^pk_(live|test)_/.test(val),
  STRIPE_SECRET_KEY: (val) => /^sk_(live|test)_/.test(val),
  STRIPE_WEBHOOK_SECRET: (val) => /^whsec_/.test(val),
  VITE_SUPABASE_URL: (val) => /^https:\/\//.test(val),
};

const missing = required.filter((k) => !process.env[k]);
const missingOptional = optional.filter((k) => !process.env[k]);
const invalid = required
  .filter((k) => process.env[k] && validators[k] && !validators[k](process.env[k]))
  .map((k) => `  • ${k}: Invalid format`);

if (missing.length) {
  console.error('❌ Missing required environment variables:');
  missing.forEach((k) => console.error(`  • ${k}`));
  process.exit(1);
}

if (invalid.length) {
  console.warn('⚠️  Environment variables with invalid format:');
  invalid.forEach((msg) => console.warn(msg));
}

if (missingOptional.length && process.env.NODE_ENV === 'production') {
  console.warn('⚠️  Missing optional (but recommended for production) variables:');
  missingOptional.forEach((k) => console.warn(`  • ${k}`));
}

console.log('✅ All required environment variables are present and valid.');
process.exit(0);
