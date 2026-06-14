export const APP_PATHS = {
  landing: '/',
  ownerSignup: '/owners/apply',
  ownerSuccess: '/owners/success',
  booking: '/booking',
  bookingSuccess: '/booking/success',
  review: '/reviews/new',
  reviewSuccess: '/reviews/success',
  managementLogin: '/management/login',
  dashboard: '/management/dashboard',
};

export function getPageFromPath(pathname) {
  switch (pathname) {
    case APP_PATHS.ownerSignup:
      return 'owner-signup';
    case APP_PATHS.ownerSuccess:
      return 'owner-success';
    case APP_PATHS.booking:
      return 'booking';
    case APP_PATHS.bookingSuccess:
      return 'booking-success';
    case APP_PATHS.review:
      return 'evaluate';
    case APP_PATHS.reviewSuccess:
      return 'review-success';
    case APP_PATHS.managementLogin:
      return 'management-login';
    case APP_PATHS.dashboard:
      return 'dashboard';
    default:
      return 'landing';
  }
}

export function getPathFromPage(page) {
  switch (page) {
    case 'owner-signup':
      return APP_PATHS.ownerSignup;
    case 'owner-success':
      return APP_PATHS.ownerSuccess;
    case 'booking':
      return APP_PATHS.booking;
    case 'booking-success':
      return APP_PATHS.bookingSuccess;
    case 'evaluate':
      return APP_PATHS.review;
    case 'review-success':
      return APP_PATHS.reviewSuccess;
    case 'management-login':
      return APP_PATHS.managementLogin;
    case 'dashboard':
      return APP_PATHS.dashboard;
    default:
      return APP_PATHS.landing;
  }
}
