import { LIMITS, CONTROL_CHARS } from './constants';

export function validateLogin(values) {
  const errors = {};

  if (!values.username) {
    errors.username = 'Enter your WordPress username or email address.';
  } else if (values.username.length > LIMITS.username) {
    errors.username = 'WordPress usernames are at most 60 characters.';
  } else if (CONTROL_CHARS.test(values.username)) {
    errors.username = 'The username contains invisible characters. Retype it.';
  }

  if (!values.password) {
    errors.password = 'Enter the Application Password for this user.';
  }

  if (values.mode === 'live' && !values.envSiteUrl) {
    let u = null;
    try {
      u = new URL(values.siteUrl);
    } catch (_) {
      /* invalid */
    }

    if (!values.siteUrl) {
      errors.siteUrl = 'Enter the address of your WordPress site.';
    } else if (!u || !/^https?:$/.test(u.protocol)) {
      errors.siteUrl = 'Enter a full address, for example https://example.com';
    } else if (
      u.protocol === 'http:' &&
      !/^(localhost|127\.0\.0\.1|.+\.(local|test))$/.test(u.hostname)
    ) {
      errors.siteUrl =
        'Use https://. WordPress only accepts Application Passwords over HTTPS, except on local development sites.';
    }
  }

  return errors;
}
