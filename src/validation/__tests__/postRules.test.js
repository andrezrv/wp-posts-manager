import { describe, it, expect } from 'vitest';
import { validatePost } from '../postRules';

describe('validatePost', () => {
  const valid = { title: 'My Post', content: '<p>Hello world</p>' };

  it('passes with valid title and content', () => {
    expect(validatePost(valid)).toEqual({});
  });

  it('requires title', () => {
    const result = validatePost({ ...valid, title: '' });
    expect(result.title).toMatch(/required/i);
  });

  it('requires title after trimming whitespace', () => {
    const result = validatePost({ ...valid, title: '   ' });
    expect(result.title).toMatch(/required/i);
  });

  it('rejects title over 200 characters', () => {
    const result = validatePost({ ...valid, title: 'a'.repeat(201) });
    expect(result.title).toMatch(/200/);
  });

  it('rejects title with control characters', () => {
    const result = validatePost({ ...valid, title: 'Bad\x00title' });
    expect(result.title).toMatch(/invalid/i);
  });

  it('requires content', () => {
    const result = validatePost({ ...valid, content: '' });
    expect(result.content).toMatch(/required/i);
  });

  it('requires content after trimming whitespace', () => {
    const result = validatePost({ ...valid, content: '  \n  ' });
    expect(result.content).toMatch(/required/i);
  });

  it('allows empty excerpt', () => {
    const result = validatePost({ ...valid, excerpt: '' });
    expect(result.excerpt).toBeUndefined();
  });

  it('rejects excerpt over 600 characters', () => {
    const result = validatePost({ ...valid, excerpt: 'a'.repeat(601) });
    expect(result.excerpt).toMatch(/600/);
  });

  it('rejects unsupported image type', () => {
    const file = new File(['x'], 'doc.pdf', { type: 'application/pdf' });
    const result = validatePost({ ...valid, imageFile: file });
    expect(result.image).toMatch(/JPEG|PNG|GIF|WebP/i);
  });

  it('rejects image over 5 MB', () => {
    const big = new File([new ArrayBuffer(5 * 1024 * 1024 + 1)], 'big.jpg', {
      type: 'image/jpeg',
    });
    const result = validatePost({ ...valid, imageFile: big });
    expect(result.image).toMatch(/5 MB/);
  });

  it('accepts a valid image file', () => {
    const file = new File(['pixel'], 'photo.png', { type: 'image/png' });
    const result = validatePost({ ...valid, imageFile: file });
    expect(result.image).toBeUndefined();
  });

  it('returns multiple errors at once', () => {
    const result = validatePost({ title: '', content: '' });
    expect(result.title).toBeDefined();
    expect(result.content).toBeDefined();
  });
});
