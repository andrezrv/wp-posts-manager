import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getPost, createPost, updatePost, uploadMedia } from '../api/endpoints';
import { STATUSES } from '../validation/constants';
import { validatePost } from '../validation/postRules';
import { toLocalInput, toWpDate, fmtDate, safeImgSrc, formatBytes } from '../utils/format';
import Banner from '../components/Banner';
import FieldError from '../components/FieldError';
import Spinner from '../components/Spinner';
import styles from './EditorPage.module.css';

const STATUS_OPTIONS = Object.entries(STATUSES);

function getThumbUrl(post) {
  const m = post?._embedded?.['wp:featuredmedia']?.[0];
  if (!m) return '';
  return safeImgSrc(m.media_details?.sizes?.medium?.source_url) || safeImgSrc(m.source_url) || '';
}

export default function EditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;

  const [loading, setLoading] = useState(!isNew);
  const [loadError, setLoadError] = useState('');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [status, setStatus] = useState('draft');
  const [date, setDate] = useState('');

  const [existingThumb, setExistingThumb] = useState('');
  const [featuredMediaId, setFeaturedMediaId] = useState(0);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(false);
    setApiError('');
    setErrors({});
    setImageFile(null);
    setImagePreview('');

    if (isNew) {
      setTitle('');
      setContent('');
      setExcerpt('');
      setStatus('draft');
      setDate('');
      setExistingThumb('');
      setFeaturedMediaId(0);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError('');

    getPost(id)
      .then((res) => {
        if (cancelled) return;
        const p = res.data;
        setTitle(p.title?.raw || '');
        setContent(p.content?.raw || '');
        setExcerpt(p.excerpt?.raw || '');
        setStatus(p.status);
        setDate(toLocalInput(new Date(p.date)));
        setFeaturedMediaId(p.featured_media || 0);
        setExistingThumb(getThumbUrl(p));
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, isNew]);

  const clearFieldError = (field) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    clearFieldError('image');
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    setExistingThumb('');
    setFeaturedMediaId(0);
  };

  const handleSave = useCallback(async () => {
    if (saving) return;

    setApiError('');
    setSaved(false);
    const validationErrors = validatePost({ title, content, excerpt, imageFile });

    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setSaving(true);

    try {
      let mediaId = featuredMediaId;

      if (imageFile) {
        const mediaRes = await uploadMedia(imageFile);
        mediaId = mediaRes.data.id;
      }

      const postData = {
        title,
        content,
        excerpt,
        status,
        featured_media: mediaId,
      };

      if (date) {
        postData.date = toWpDate(new Date(date));
      }

      if (isNew) {
        const res = await createPost(postData);
        navigate(`/posts/${res.data.id}/edit`, { replace: true });
      } else {
        await updatePost(id, postData);
        setSaved(true);
        setImageFile(null);
        if (imagePreview) {
          setExistingThumb(imagePreview);
          setImagePreview('');
        }
      }
    } catch (err) {
      setApiError(err.message);
    } finally {
      setSaving(false);
    }
  }, [saving, title, content, excerpt, status, date, imageFile, featuredMediaId, isNew, id, navigate, imagePreview]);

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  };

  if (loading) {
    return (
      <div className={styles.wrap}>
        <div className={styles.loading}>
          <Spinner /> Loading post…
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={styles.wrap}>
        <Banner message={loadError} />
        <Link to="/posts" className={styles.backLink}>
          &larr; Back to posts
        </Link>
      </div>
    );
  }

  const thumbSrc = imagePreview || existingThumb;

  return (
    <div className={styles.wrap} onKeyDown={handleKeyDown}>
      <div className={styles.header}>
        <Link to="/posts" className={styles.backLink}>
          &larr; Posts
        </Link>
        <h1>{isNew ? 'New post' : 'Edit post'}</h1>
      </div>

      <div className={styles.grid}>
        <div className={styles.main}>
          <div className={styles.card}>
            <div className={styles.field}>
              <label htmlFor="f-title">Title</label>
              <input
                type="text"
                id="f-title"
                value={title}
                maxLength={200}
                autoFocus
                onChange={(e) => {
                  setTitle(e.target.value);
                  clearFieldError('title');
                  setSaved(false);
                }}
                aria-invalid={!!errors.title || undefined}
                aria-describedby="f-title-error"
              />
              <FieldError id="f-title-error" message={errors.title} />
            </div>

            <div className={styles.field}>
              <label htmlFor="f-content">Content</label>
              <textarea
                id="f-content"
                rows={14}
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  clearFieldError('content');
                  setSaved(false);
                }}
                aria-invalid={!!errors.content || undefined}
                aria-describedby="f-content-error"
              />
              <FieldError id="f-content-error" message={errors.content} />
            </div>

            <div className={styles.field}>
              <label htmlFor="f-excerpt">Excerpt</label>
              <textarea
                id="f-excerpt"
                rows={3}
                value={excerpt}
                maxLength={600}
                onChange={(e) => {
                  setExcerpt(e.target.value);
                  clearFieldError('excerpt');
                  setSaved(false);
                }}
                aria-invalid={!!errors.excerpt || undefined}
                aria-describedby="f-excerpt-hint f-excerpt-error"
              />
              <p className={styles.hint} id="f-excerpt-hint">
                A short summary shown in feeds and search results.
              </p>
              <FieldError id="f-excerpt-error" message={errors.excerpt} />
            </div>
          </div>
        </div>

        <div className={styles.sidebar}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Publish</h2>

            <div className={styles.field}>
              <label htmlFor="f-status">Status</label>
              <select
                id="f-status"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setSaved(false);
                }}
              >
                {STATUS_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label htmlFor="f-date">Publish date</label>
              <input
                type="datetime-local"
                id="f-date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setSaved(false);
                }}
              />
              <p className={styles.hint}>Leave empty to publish immediately.</p>
            </div>

            {apiError && <Banner message={apiError} />}
            {saved && <Banner kind="ok" message="Post saved." />}

            <button
              type="button"
              className={styles.saveBtn}
              onClick={handleSave}
              disabled={saving}
            >
              {saving && <Spinner />}
              {saving ? 'Saving…' : isNew ? 'Create post' : 'Update post'}
            </button>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Featured image</h2>

            {thumbSrc ? (
              <div className={styles.imagePreview}>
                <img src={thumbSrc} alt="" />
                <button
                  type="button"
                  className={styles.removeImage}
                  onClick={removeImage}
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className={styles.imageUpload} htmlFor="f-image">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <rect
                    x="3"
                    y="3"
                    width="18"
                    height="18"
                    rx="3"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                  <path
                    d="M3 16l5-5 4 4 3-3 6 6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Choose an image</span>
                <span className={styles.imageHint}>JPEG, PNG, GIF, WebP up to 5 MB</span>
              </label>
            )}

            <input
              type="file"
              id="f-image"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className={styles.fileInput}
              onChange={handleImageChange}
            />

            {imageFile && (
              <p className={styles.imageMeta}>
                {imageFile.name} ({formatBytes(imageFile.size)})
              </p>
            )}

            <FieldError message={errors.image} />
          </div>
        </div>
      </div>
    </div>
  );
}
