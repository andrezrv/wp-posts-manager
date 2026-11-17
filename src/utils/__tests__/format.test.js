/** @file Tests for formatting and sanitization utility functions. */

import { describe, it, expect } from 'vitest';
import { esc, plainText, formatBytes, basicAuth, safeImgSrc } from '../format';

describe('esc', () => {
  it('escapes HTML special characters', () => {
    expect(esc('<script>"hello" & \'world\'')).toBe(
      '&lt;script&gt;&quot;hello&quot; &amp; &#39;world&#39;',
    );
  });

  it('handles null and undefined', () => {
    expect(esc(null)).toBe('');
    expect(esc(undefined)).toBe('');
  });

  it('passes through plain text', () => {
    expect(esc('hello world')).toBe('hello world');
  });
});

describe('plainText', () => {
  it('strips HTML tags', () => {
    expect(plainText('<p>Hello <strong>world</strong></p>')).toBe('Hello world');
  });

  it('collapses whitespace', () => {
    expect(plainText('<p>Hello</p>   <p>world</p>')).toBe('Hello world');
  });

  it('handles empty input', () => {
    expect(plainText('')).toBe('');
    expect(plainText(null)).toBe('');
  });
});

describe('formatBytes', () => {
  it('formats bytes', () => {
    expect(formatBytes(500)).toBe('500 B');
  });

  it('formats kilobytes', () => {
    expect(formatBytes(2048)).toBe('2 KB');
  });

  it('formats megabytes', () => {
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB');
  });
});

describe('basicAuth', () => {
  it('generates a Basic auth header', () => {
    const result = basicAuth('user', 'pass');
    expect(result).toMatch(/^Basic /);
    expect(atob(result.slice(6))).toBe('user:pass');
  });
});

describe('safeImgSrc', () => {
  it('allows https URLs', () => {
    expect(safeImgSrc('https://example.com/img.jpg')).toBe('https://example.com/img.jpg');
  });

  it('allows http URLs', () => {
    expect(safeImgSrc('http://example.com/img.jpg')).toBe('http://example.com/img.jpg');
  });

  it('allows data:image URIs', () => {
    expect(safeImgSrc('data:image/png;base64,abc')).toBe('data:image/png;base64,abc');
  });

  it('allows blob URIs', () => {
    expect(safeImgSrc('blob:http://localhost/abc')).toBe('blob:http://localhost/abc');
  });

  it('rejects javascript URIs', () => {
    expect(safeImgSrc('javascript:alert(1)')).toBe('');
  });

  it('rejects empty input', () => {
    expect(safeImgSrc('')).toBe('');
    expect(safeImgSrc(null)).toBe('');
  });
});
