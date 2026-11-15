import { Node, mergeAttributes } from '@tiptap/react';

export const LockedBlock = Node.create({
  name: 'lockedBlock',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      key: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-wp-locked'),
      },
      label: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-wp-label') || '',
      },
      preview: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-wp-preview') || '',
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-wp-locked]' }];
  },

  renderHTML({ node }) {
    return [
      'div',
      {
        'data-wp-locked': node.attrs.key,
        'data-wp-label': node.attrs.label,
        'data-wp-preview': node.attrs.preview,
        contenteditable: 'false',
      },
    ];
  },

  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('div');
      dom.setAttribute('data-wp-locked', node.attrs.key || '');
      dom.contentEditable = 'false';
      dom.style.cssText =
        'background:var(--surface-2);border:1px dashed var(--line);border-radius:5px;padding:12px 14px;margin:0.6em 0;cursor:not-allowed;user-select:none';

      const header = document.createElement('div');
      header.style.cssText =
        'font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--muted);margin-bottom:8px;display:flex;align-items:center;gap:6px';
      const icon = document.createElement('span');
      icon.textContent = '🔒';
      icon.style.fontSize = '13px';
      header.appendChild(icon);
      header.append(node.attrs.label || 'Block');
      dom.appendChild(header);

      if (node.attrs.preview) {
        const previewEl = document.createElement('div');
        previewEl.style.cssText =
          'opacity:0.85;font-size:14px;line-height:1.55;pointer-events:none;overflow:hidden;max-height:200px';
        previewEl.innerHTML = node.attrs.preview;
        dom.appendChild(previewEl);
      }

      return { dom };
    };
  },
});
