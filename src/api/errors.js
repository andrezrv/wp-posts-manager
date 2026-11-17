/**
 * @file API error types and user-friendly error messages.
 *
 * Maps WordPress REST API error codes to plain-language messages
 * that help users understand what went wrong and how to fix it.
 * Falls back to generic messages based on HTTP status when no
 * specific mapping exists.
 */

import { plainText } from '../utils/format';

/**
 * Custom error class for API responses with HTTP error status codes.
 *
 * @extends Error
 * @property {number} status - HTTP status code.
 * @property {string} code - WordPress error code (e.g. 'rest_forbidden').
 * @property {object} data - Additional error data from the API.
 * @property {boolean} [sessionEnded] - True when a 401 invalidated the session.
 */
export class ApiError extends Error {
  constructor(status, code, message, data) {
    super(message);
    this.status = status;
    this.code = code;
    this.data = data || {};
  }
}

const BAD_CREDENTIALS =
  "The username or Application Password is incorrect. Check both and try again. Your regular wp-admin password won't work here.";

const MESSAGE_MAP = {
  invalid_username: BAD_CREDENTIALS,
  invalid_email: BAD_CREDENTIALS,
  incorrect_password: BAD_CREDENTIALS,
  application_passwords_disabled:
    'Application Passwords are turned off on this site. Ask an administrator to enable them.',
  rest_not_logged_in: 'You need to log in again to continue.',
  rest_forbidden_context:
    "Your account can't view posts in edit mode. Ask an administrator for the Author role or higher.",
  rest_cannot_create: "Your WordPress role doesn't allow creating posts.",
  rest_cannot_edit: "Your WordPress role doesn't allow editing this post.",
  rest_cannot_delete: "Your WordPress role doesn't allow deleting this post.",
  rest_cannot_publish:
    "Your WordPress role can't publish posts. Save it as a draft or submit it for review.",
  rest_post_invalid_id: 'This post no longer exists. Someone may have deleted it.',
  rest_already_trashed: 'This post is already in the Trash.',
  rest_invalid_param:
    'The server rejected some fields. Check the highlighted fields and try again.',
  empty_content: 'WordPress needs at least a title, some content or an excerpt.',
  rest_upload_file_too_big: 'The image is larger than this site allows. Use a smaller file.',
  rest_upload_invalid_type: "WordPress doesn't accept this file type. Use JPG, PNG, GIF or WebP.",
  rest_no_route:
    "This site doesn't expose the WordPress REST API at /wp-json. Check the address or the site's permalink settings.",
};

/**
 * Map an API error to a user-friendly message.
 *
 * @param {number} status - HTTP status code.
 * @param {string} code - WordPress error code.
 * @param {string} [serverMsg] - Raw message from the server.
 * @returns {string} A plain-language error message.
 */
export function friendlyMessage(status, code, serverMsg) {
  if (MESSAGE_MAP[code]) return MESSAGE_MAP[code];
  if (status === 401) return BAD_CREDENTIALS;
  if (status === 403) return "Your account doesn't have permission to do that.";
  if (status === 404) return "The site didn't recognize this request.";
  if (status >= 500)
    return (
      'The WordPress server ran into an error (HTTP ' +
      status +
      "). Wait a moment and try again. If it keeps happening, check the site's error log."
    );
  return serverMsg
    ? plainText(serverMsg)
    : 'Something went wrong (HTTP ' + status + '). Try again.';
}
