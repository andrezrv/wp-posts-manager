import { describe, it, expect } from 'vitest';
import { validateLogin } from '../loginRules';

describe('validateLogin', () => {
  const valid = { mode: 'mock', username: 'editor', password: 'abc123', siteUrl: '' };

  it('passes with valid demo credentials', () => {
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

  it('requires site URL in live mode', () => {
    const errors = validateLogin({ ...valid, mode: 'live', siteUrl: '' });
    expect(errors.siteUrl).toBeDefined();
  });

  it('rejects invalid URL in live mode', () => {
    const errors = validateLogin({ ...valid, mode: 'live', siteUrl: 'not-a-url' });
    expect(errors.siteUrl).toBeDefined();
  });

  it('rejects HTTP for non-local sites in live mode', () => {
    const errors = validateLogin({ ...valid, mode: 'live', siteUrl: 'http://example.com' });
    expect(errors.siteUrl).toMatch(/https/i);
  });

  it('allows HTTP for localhost in live mode', () => {
    const errors = validateLogin({ ...valid, mode: 'live', siteUrl: 'http://localhost' });
    expect(errors.siteUrl).toBeUndefined();
  });

  it('allows HTTP for .local domains in live mode', () => {
    const errors = validateLogin({ ...valid, mode: 'live', siteUrl: 'http://mysite.local' });
    expect(errors.siteUrl).toBeUndefined();
  });

  it('allows HTTP for .test domains in live mode', () => {
    const errors = validateLogin({
      ...valid,
      mode: 'live',
      siteUrl: 'http://toptal-challenge.test',
    });
    expect(errors.siteUrl).toBeUndefined();
  });

  it('allows HTTPS for any site in live mode', () => {
    const errors = validateLogin({ ...valid, mode: 'live', siteUrl: 'https://example.com' });
    expect(errors.siteUrl).toBeUndefined();
  });

  it('does not validate siteUrl in mock mode', () => {
    const errors = validateLogin({ ...valid, mode: 'mock', siteUrl: '' });
    expect(errors.siteUrl).toBeUndefined();
  });

  it('skips siteUrl validation when envSiteUrl is set', () => {
    const errors = validateLogin({
      ...valid,
      mode: 'live',
      siteUrl: '',
      envSiteUrl: 'http://toptal-challenge.local',
    });
    expect(errors.siteUrl).toBeUndefined();
  });
});
