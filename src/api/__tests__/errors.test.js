/** @file Tests for ApiError class and friendlyMessage mapping. */

import { describe, it, expect } from 'vitest';
import { ApiError, friendlyMessage } from '../errors';

describe('ApiError', () => {
  it('creates an error with status, code, message, and data', () => {
    const err = new ApiError(401, 'invalid_username', 'Bad credentials', { extra: true });
    expect(err).toBeInstanceOf(Error);
    expect(err.status).toBe(401);
    expect(err.code).toBe('invalid_username');
    expect(err.message).toBe('Bad credentials');
    expect(err.data).toEqual({ extra: true });
  });

  it('defaults data to empty object', () => {
    const err = new ApiError(500, 'server_error', 'Oops');
    expect(err.data).toEqual({});
  });
});

describe('friendlyMessage', () => {
  it('returns the same message for invalid_username and incorrect_password', () => {
    const msg1 = friendlyMessage(401, 'invalid_username', '');
    const msg2 = friendlyMessage(401, 'incorrect_password', '');
    expect(msg1).toBe(msg2);
    expect(msg1).toMatch(/incorrect/i);
  });

  it('maps rest_cannot_create', () => {
    expect(friendlyMessage(403, 'rest_cannot_create', '')).toMatch(/creating posts/);
  });

  it('maps rest_cannot_edit', () => {
    expect(friendlyMessage(403, 'rest_cannot_edit', '')).toMatch(/editing/);
  });

  it('maps rest_cannot_delete', () => {
    expect(friendlyMessage(403, 'rest_cannot_delete', '')).toMatch(/deleting/);
  });

  it('maps rest_post_invalid_id', () => {
    expect(friendlyMessage(404, 'rest_post_invalid_id', '')).toMatch(/no longer exists/);
  });

  it('maps rest_already_trashed', () => {
    expect(friendlyMessage(410, 'rest_already_trashed', '')).toMatch(/already in the Trash/);
  });

  it('maps rest_upload_file_too_big', () => {
    expect(friendlyMessage(400, 'rest_upload_file_too_big', '')).toMatch(/larger/);
  });

  it('maps rest_no_route', () => {
    expect(friendlyMessage(404, 'rest_no_route', '')).toMatch(/REST API/);
  });

  it('falls back to generic 401 message for unknown auth codes', () => {
    expect(friendlyMessage(401, 'unknown_code', '')).toMatch(/incorrect/i);
  });

  it('falls back to generic 403 message', () => {
    expect(friendlyMessage(403, 'unknown_code', '')).toMatch(/permission/);
  });

  it('falls back to generic 404 message', () => {
    expect(friendlyMessage(404, 'unknown_code', '')).toMatch(/recognize/);
  });

  it('falls back to generic 500+ message', () => {
    const msg = friendlyMessage(502, 'unknown_code', '');
    expect(msg).toMatch(/error/i);
    expect(msg).toMatch(/502/);
  });

  it('uses server message as last resort', () => {
    expect(friendlyMessage(418, 'unknown_code', 'I am a teapot')).toBe('I am a teapot');
  });

  it('strips HTML from server message', () => {
    expect(friendlyMessage(418, 'unknown_code', '<p>Error</p>')).toBe('Error');
  });

  it('shows generic fallback when no server message', () => {
    expect(friendlyMessage(418, 'unknown_code', '')).toMatch(/Something went wrong/);
  });
});
