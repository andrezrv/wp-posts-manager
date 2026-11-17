/**
 * @file Login form validation rules.
 *
 * Validates username, password, and site URL fields. Site URL
 * validation enforces HTTPS for non-local domains (WordPress
 * requires HTTPS for Application Passwords on production sites).
 */

import { LIMITS, CONTROL_CHARS } from './constants';

/**
 * Validate login form values.
 *
 * @param {object} values - Form values (username, password, siteUrl, envSiteUrl).
 * @returns {object} Error messages keyed by field name. Empty object if valid.
 */
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

  if (!values.envSiteUrl) {
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
