import { useState, useCallback, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { createBlockBridge } from '../editor/blockBridge';
import { LockedBlock } from '../editor/lockedBlockNode';
import styles from './RichEditor.module.css';

const extensions = [
  StarterKit.configure({
    heading: { levels: [2, 3, 4] },
  }),
  Link.configure({
    openOnClick: false,
    HTMLAttributes: { rel: 'noopener noreferrer nofollow' },
  }),
  Placeholder.configure({
    placeholder: 'Start writing your post…',
  }),
  LockedBlock,
];

function ToolbarButton({ active, onClick, title, children }) {
  return (
    <button
      type="button"
      className={`${styles.tbBtn} ${active ? styles.tbActive : ''}`}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      title={title}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }) {
  if (!editor) return null;

  const addLink = () => {
    const prev = editor.getAttributes('link').href || '';
    const url = window.prompt('URL', prev);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  return (
    <div className={styles.toolbar} role="toolbar" aria-label="Formatting">
      <div className={styles.tbGroup}>
        <ToolbarButton
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Strikethrough"
        >
          <s>S</s>
        </ToolbarButton>
      </div>

      <span className={styles.tbSep} />

      <div className={styles.tbGroup}>
        <ToolbarButton
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Heading 2"
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Heading 3"
        >
          H3
        </ToolbarButton>
      </div>

      <span className={styles.tbSep} />

      <div className={styles.tbGroup}>
        <ToolbarButton
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet list"
        >
          &bull;&equiv;
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered list"
        >
          1.
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Blockquote"
        >
          &ldquo;
        </ToolbarButton>
      </div>

      <span className={styles.tbSep} />

      <div className={styles.tbGroup}>
        <ToolbarButton
          active={editor.isActive('link')}
          onClick={addLink}
          title="Link"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M6.5 9.5a3.5 3.5 0 005 0l2-2a3.5 3.5 0 00-5-5l-1 1M9.5 6.5a3.5 3.5 0 00-5 0l-2 2a3.5 3.5 0 005 5l1-1"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('codeBlock')}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          title="Code block"
        >
          &lt;/&gt;
        </ToolbarButton>
      </div>
    </div>
  );
}

const RichEditor = forwardRef(function RichEditor({ value, onChange, invalid }, ref) {
  const [mode, setMode] = useState('visual');
  const [htmlDraft, setHtmlDraft] = useState('');
  const bridgeRef = useRef(null);
  const rawRef = useRef(value || '');
  const dirtyRef = useRef(false);

  /* eslint-disable react-hooks/refs -- lazy one-time init of immutable values */
  if (bridgeRef.current == null) {
    bridgeRef.current = createBlockBridge();
  }
  const bridge = bridgeRef.current;

  const prepared = useRef(null);
  if (prepared.current == null) {
    prepared.current = bridge.toVisual(rawRef.current);
  }
  const blockMode = prepared.current.blockMode;
  /* eslint-enable react-hooks/refs */

  /* eslint-disable react-hooks/refs -- bridge/blockMode/prepared are stable lazy-init values */
  const editor = useEditor({
    extensions,
    content: prepared.current.html || '',
    onUpdate: ({ editor: e }) => {
      if (mode !== 'visual') return;
      dirtyRef.current = true;
      if (!blockMode) {
        const html = e.getHTML();
        rawRef.current = html;
        onChange(html);
      }
    },
  });

  useEffect(() => {
    if (editor && prepared.current && blockMode) {
      bridge.snapshotClean(editor.view.dom);
    }
  }, [editor, bridge, blockMode]);

  const getContent = useCallback(() => {
    if (mode === 'html') return htmlDraft;
    if (!editor) return rawRef.current;
    if (blockMode) return bridge.toRaw(editor.view.dom);
    return editor.getHTML();
  }, [mode, htmlDraft, editor, blockMode, bridge]);
  /* eslint-enable react-hooks/refs */

  useImperativeHandle(ref, () => ({ getContent }), [getContent]);

  const switchToHtml = useCallback(() => {
    if (editor) {
      const raw = blockMode ? bridge.toRaw(editor.view.dom) : editor.getHTML();
      setHtmlDraft(raw);
      rawRef.current = raw;
    }
    setMode('html');
  }, [editor, bridge, blockMode]);

  const switchToVisual = useCallback(() => {
    const newPrep = bridge.toVisual(htmlDraft);
    if (newPrep.malformed) return;
    if (editor) {
      editor.commands.setContent(newPrep.html, false);
      prepared.current = newPrep;
      setTimeout(() => bridge.snapshotClean(editor.view.dom), 0);
    }
    rawRef.current = htmlDraft;
    setMode('visual');
  }, [editor, bridge, htmlDraft]);

  const handleHtmlChange = useCallback(
    (e) => {
      const html = e.target.value;
      setHtmlDraft(html);
      rawRef.current = html;
      dirtyRef.current = true;
      onChange(html);
    },
    [onChange],
  );

  return (
    <div className={`${styles.wrap} ${invalid ? styles.invalid : ''}`}>
      <div className={styles.header}>
        {mode === 'visual' && <Toolbar editor={editor} />}
        <div className={styles.modeTabs}>
          <button
            type="button"
            className={`${styles.modeTab} ${mode === 'visual' ? styles.modeActive : ''}`}
            onClick={switchToVisual}
          >
            Visual
          </button>
          <button
            type="button"
            className={`${styles.modeTab} ${mode === 'html' ? styles.modeActive : ''}`}
            onClick={switchToHtml}
          >
            HTML
          </button>
        </div>
      </div>

      {mode === 'visual' ? (
        <EditorContent editor={editor} className={styles.content} aria-labelledby="content-label" />
      ) : (
        <textarea
          className={styles.htmlArea}
          value={htmlDraft}
          onChange={handleHtmlChange}
          spellCheck={false}
          aria-label="Content (HTML)"
        />
      )}
    </div>
  );
});

export default RichEditor;
