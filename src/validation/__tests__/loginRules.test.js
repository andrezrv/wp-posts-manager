/** @file Tests for login form validation rules. */

import { describe, it, expect } from 'vitest';
import { validateLogin } from '../loginRules';

describe('validateLogin', () => {
  const valid = { username: 'editor', password: 'abc123', siteUrl: 'https://example.com' };

  it('passes with valid credentials', () => {
    expect(validateLogin(valid)).toEqual({});
  });

  it('requires username', () => {
    const errors = validateLogin({ ...valid, username: '' });
    expect(errors.username).toBeDefined();
  });

  it('rejects username over 60 characters', () => {
    const errors = validateLogin({ ...valid, username: 'a'.repeat(61) });
    expect(errors.username).toMatch(/60/);
  });

  it('rejects username with control characters', () => {
    const errors = validateLogin({ ...valid, username: 'user\u0000name' });
    expect(errors.username).toMatch(/invisible/);
  });

  it('requires password', () => {
    const errors = validateLogin({ ...valid, password: '' });
    expect(errors.password).toBeDefined();
  });

  it('requires site URL', () => {
    const errors = validateLogin({ ...valid, siteUrl: '' });
    expect(errors.siteUrl).toBeDefined();
  });

  it('rejects invalid URL', () => {
    const errors = validateLogin({ ...valid, siteUrl: 'not-a-url' });
    expect(errors.siteUrl).toBeDefined();
  });

  it('rejects HTTP for non-local sites', () => {
    const errors = validateLogin({ ...valid, siteUrl: 'http://example.com' });
    expect(errors.siteUrl).toMatch(/https/i);
  });

  it('allows HTTP for localhost', () => {
    const errors = validateLogin({ ...valid, siteUrl: 'http://localhost' });
    expect(errors.siteUrl).toBeUndefined();
  });

  it('allows HTTP for .local domains', () => {
    const errors = validateLogin({ ...valid, siteUrl: 'http://mysite.local' });
    expect(errors.siteUrl).toBeUndefined();
  });

  it('allows HTTP for .test domains', () => {
    const errors = validateLogin({
      ...valid,
      siteUrl: 'http://toptal-challenge.test',
    });
    expect(errors.siteUrl).toBeUndefined();
  });

  it('allows HTTPS for any site', () => {
    const errors = validateLogin({ ...valid, siteUrl: 'https://example.com' });
    expect(errors.siteUrl).toBeUndefined();
  });

  it('skips siteUrl validation when envSiteUrl is set', () => {
    const errors = validateLogin({
      ...valid,
      siteUrl: '',
      envSiteUrl: 'http://toptal-challenge.local',
    });
    expect(errors.siteUrl).toBeUndefined();
  });
});
