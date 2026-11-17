/** @file Tests for WordPress block comment parser. */

import { describe, it, expect } from 'vitest';
import { hasBlocks, parseBlocks } from '../blockParser';

describe('hasBlocks', () => {
  it('returns true for content with block comments', () => {
    expect(hasBlocks('<!-- wp:paragraph --><p>Hi</p><!-- /wp:paragraph -->')).toBe(true);
  });

  it('returns false for plain HTML', () => {
    expect(hasBlocks('<p>Hello world</p>')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(hasBlocks('')).toBe(false);
  });
});

describe('parseBlocks', () => {
  it('parses a single paragraph block', () => {
    const src = '<!-- wp:paragraph -->\n<p>Hello</p>\n<!-- /wp:paragraph -->';
    const blocks = parseBlocks(src);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].name).toBe('core/paragraph');
    expect(blocks[0].short).toBe('paragraph');
    expect(blocks[0].innerRaw).toContain('<p>Hello</p>');
    expect(blocks[0].raw).toBe(src);
  });

  it('parses multiple blocks', () => {
    const src = [
      '<!-- wp:paragraph -->\n<p>One</p>\n<!-- /wp:paragraph -->',
      '<!-- wp:heading -->\n<h2>Title</h2>\n<!-- /wp:heading -->',
    ].join('\n\n');
    const blocks = parseBlocks(src);
    expect(blocks).toHaveLength(2);
    expect(blocks[0].name).toBe('core/paragraph');
    expect(blocks[1].name).toBe('core/heading');
  });

  it('parses block attributes', () => {
    const src = '<!-- wp:heading {"level":3} -->\n<h3>Sub</h3>\n<!-- /wp:heading -->';
    const blocks = parseBlocks(src);
    expect(blocks[0].attrs).toEqual({ level: 3 });
    expect(blocks[0].attrsStr).toBe('{"level":3}');
  });

  it('parses self-closing blocks', () => {
    const src = '<!-- wp:separator /-->';
    const blocks = parseBlocks(src);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].name).toBe('core/separator');
    expect(blocks[0].innerRaw).toBe('');
  });

  it('parses nested blocks (list with list-items)', () => {
    const src =
      '<!-- wp:list -->\n<ul class="wp-block-list"><!-- wp:list-item -->\n<li>A</li>\n<!-- /wp:list-item --></ul>\n<!-- /wp:list -->';
    const blocks = parseBlocks(src);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].name).toBe('core/list');
    expect(blocks[0].children).toHaveLength(1);
    expect(blocks[0].children[0].name).toBe('core/list-item');
  });

  it('returns null for unbalanced comments', () => {
    expect(parseBlocks('<!-- wp:paragraph --><p>No close</p>')).toBeNull();
  });

  it('captures freeform content between blocks', () => {
    const src = '<p>Classic</p>\n\n<!-- wp:heading -->\n<h2>Title</h2>\n<!-- /wp:heading -->';
    const blocks = parseBlocks(src);
    expect(blocks).toHaveLength(2);
    expect(blocks[0].type).toBe('freeform');
    expect(blocks[0].raw).toContain('Classic');
    expect(blocks[1].type).toBe('block');
  });

  it('handles namespaced blocks', () => {
    const src = '<!-- wp:custom/my-block -->\n<div>Custom</div>\n<!-- /wp:custom/my-block -->';
    const blocks = parseBlocks(src);
    expect(blocks[0].name).toBe('custom/my-block');
  });
});
