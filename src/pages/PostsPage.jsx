/**
 * @file Post list page.
 *
 * Displays all posts in a table with status filtering, full-text search,
 * and server-side pagination. This is the main screen after login.
 *
 * Key design decisions:
 * - **URL-driven state** — status filter, page number, and search query
 *   are stored in URL search params (`?status=draft&page=2&q=hello`),
 *   making filter states shareable and back-button friendly.
 * - **Link-based tabs** — status filters are `<Link>` elements (not
 *   buttons) so they support right-click and open-in-new-tab.
 * - **Debounced search** — the search input syncs to URL params after
 *   a delay to avoid excessive API calls while typing.
 * - **Skeleton loading** — shows placeholder rows during data fetches
 *   to prevent layout shift.
 * - **Delete flow** — confirmation dialog with an option for permanent
 *   deletion. Trashed posts show a Restore button.
 */

import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import usePosts from '../hooks/usePosts';
import usePostCounts from '../hooks/usePostCounts';
import useDebounce from '../hooks/useDebounce';
import { POSTS_PER_PAGE, EXCERPT_PREVIEW_LENGTH } from '../validation/constants';
import { plainText, fmtDate, safeImgSrc } from '../utils/format';
import StatusPill from '../components/StatusPill';
import ConfirmDialog from '../components/ConfirmDialog';
import Banner from '../components/Banner';
import styles from './PostsPage.module.css';

/** Tab definitions: [statusKey, displayLabel] pairs. */
const STATUS_TABS = [
  ['any', 'All'],
  ['publish', 'Published'],
  ['future', 'Scheduled'],
  ['draft', 'Drafts'],
  ['pending', 'Pending'],
  ['private', 'Private'],
  ['trash', 'Trash'],
];

/** Set of valid status keys for URL param validation. */
const VALID_STATUSES = new Set(STATUS_TABS.map(([k]) => k));

/** Extract the thumbnail URL from a post's embedded featured media. */
function getThumb(post) {
  const embedded = post._embedded?.['wp:featuredmedia']?.[0];
  if (!embedded) return null;
  return (
    safeImgSrc(embedded.media_details?.sizes?.thumbnail?.source_url) ||
    safeImgSrc(embedded.source_url)
  );
}

/** Returns the appropriate date column label based on post status. */
function dateLabel(status) {
  if (status === 'future') return 'Goes live';
  if (status === 'publish' || status === 'private') return 'Published';
  return 'Last modified';
}

/** Returns the relevant date for a post (modified for drafts, published for others). */
function dateValue(post) {
  if (post.status === 'draft' || post.status === 'pending') return post.modified;
  return post.date;
}

/**
 * Post list with filtering, search, pagination, and delete actions.
 *
 * @returns {JSX.Element}
 */
export default function PostsPage() {
  const { session } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const perPage = import.meta.env.VITE_POSTS_PER_PAGE
    ? POSTS_PER_PAGE
    : session?.postsPerPage || POSTS_PER_PAGE;

  const rawStatus = searchParams.get('status') || 'any';
  const status = VALID_STATUSES.has(rawStatus) ? rawStatus : 'any';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const urlSearch = searchParams.get('q') || '';

  const [search, setSearch] = useState(urlSearch);
  const debouncedSearch = useDebounce(search);

  useEffect(() => {
    if (debouncedSearch === urlSearch) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (debouncedSearch) next.set('q', debouncedSearch);
        else next.delete('q');
        next.delete('page');
        return next;
      },
      { replace: true },
    );
  }, [debouncedSearch, urlSearch, setSearchParams]);

  const { posts, total, totalPages, loading, error, refetch, deletePost, restorePost } = usePosts({
    page,
    perPage,
    search: debouncedSearch,
    status,
  });

  const { counts, refetchCounts } = usePostCounts();

  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [permanent, setPermanent] = useState(false);

  const tabHref = (key) => {
    const params = new URLSearchParams();
    if (key !== 'any') params.set('status', key);
    if (urlSearch) params.set('q', urlSearch);
    const qs = params.toString();
    return `/posts${qs ? '?' + qs : ''}`;
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const openDelete = (post) => {
    setDeleting(post);
    setPermanent(post.status === 'trash');
    setDeleteError('');
  };

  const handleDelete = useCallback(async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError('');
    try {
      await deletePost(deleting.id, permanent);
      setDeleting(null);
      refetch();
      refetchCounts();
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleteBusy(false);
    }
  }, [deleting, permanent, deletePost, refetch, refetchCounts]);

  const [trashWarningDismissed, setTrashWarningDismissed] = useState(false);
  const [restoringId, setRestoringId] = useState(null);

  const handleRestore = useCallback(
    async (post) => {
      setRestoringId(post.id);
      try {
        await restorePost(post.id);
        refetch();
        refetchCounts();
      } catch (_) {
        // restore failure is visible as the post staying in the list
      } finally {
        setRestoringId(null);
      }
    },
    [restorePost, refetch, refetchCounts],
  );

  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  return (
    <div>
      <div className={styles.pageHead}>
        <div>
          <h1>Posts</h1>
          <p className={styles.sub}>
            {!loading && total > 0 ? (
              <span className={styles.fadeIn}>
                {total} {total === 1 ? 'post' : 'posts'}
              </span>
            ) : (
              ' '
            )}
          </p>
        </div>
        <Link to="/posts/new" className={styles.newBtn}>
          New post
        </Link>
      </div>

      {location.state?.trashWarning && !trashWarningDismissed && (
        <Banner
          kind="warning"
          message="That post is in the Trash. Restore it first to edit it."
          onDismiss={() => setTrashWarningDismissed(true)}
        />
      )}

      <div className={styles.card}>
        <div className={styles.toolbar}>
          <div className={styles.tabs}>
            {STATUS_TABS.map(([key, label]) => {
              const count = counts
                ? key === 'any'
                  ? Object.entries(counts).reduce((a, [k, v]) => a + (k === 'trash' ? 0 : v), 0)
                  : counts[key]
                : null;
              return (
                <Link
                  key={key}
                  to={tabHref(key)}
                  className={styles.tab}
                  aria-current={status === key ? 'page' : undefined}
                >
                  {label}
                  {count != null && <span className={styles.tabCount}>{count}</span>}
                </Link>
              );
            })}
          </div>
          <div className={styles.search}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M11 11l3.5 3.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <input
              type="search"
              placeholder="Search posts…"
              value={search}
              onChange={handleSearchChange}
              aria-label="Search posts"
            />
          </div>
        </div>

        <div className={styles.body} aria-live="polite">
          {!loading && error && (
            <div className={`${styles.state} ${styles.fadeIn}`}>
              <Banner message={error.message} onDismiss={refetch} />
              <button type="button" className={styles.retryBtn} onClick={refetch}>
                Try again
              </button>
            </div>
          )}

          {!loading && !error && posts.length === 0 && (
            <div className={`${styles.state} ${styles.fadeIn}`}>
              <h2 className={styles.stateTitle}>
                {debouncedSearch ? 'No posts match your search' : 'No posts yet'}
              </h2>
              <p className={styles.stateText}>
                {debouncedSearch ? (
                  <>
                    Nothing found for &ldquo;{debouncedSearch}&rdquo;.{' '}
                    <button
                      type="button"
                      className={styles.linkBtn}
                      onClick={() => {
                        setSearch('');
                        setSearchParams(
                          (prev) => {
                            const next = new URLSearchParams(prev);
                            next.delete('q');
                            next.delete('page');
                            return next;
                          },
                          { replace: true },
                        );
                      }}
                    >
                      Clear search
                    </button>
                  </>
                ) : (
                  'Create your first post to get started.'
                )}
              </p>
            </div>
          )}

          {(loading || (!error && posts.length > 0)) && (
            <>
              <div className={styles.tableWrap}>
                <table>
                  <thead>
                    <tr>
                      <th className={styles.cThumb}></th>
                      <th>Title</th>
                      <th className={styles.cStatus}>Status</th>
                      <th className={styles.cDate}>Date</th>
                      <th className={styles.cActions}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading
                      ? Array.from({ length: perPage }, (_, i) => (
                          <tr key={`skel-${i}`}>
                            <td className={styles.cThumb}>
                              <span className={`${styles.skel} ${styles.skelThumb}`} />
                            </td>
                            <td>
                              <div className={`${styles.skel} ${styles.skelTitle}`} />
                              <div className={`${styles.skel} ${styles.skelExcerpt}`} />
                            </td>
                            <td className={styles.cStatus}>
                              <div className={`${styles.skel} ${styles.skelPill}`} />
                            </td>
                            <td className={styles.cDate}>
                              <div className={`${styles.skel} ${styles.skelDate}`} />
                              <div className={`${styles.skel} ${styles.skelDateKind}`} />
                            </td>
                            <td className={styles.cActions}>
                              <div className={`${styles.skel} ${styles.skelActions}`} />
                            </td>
                          </tr>
                        ))
                      : posts.map((post) => {
                          const thumb = getThumb(post);
                          const title =
                            post.title?.raw || plainText(post.title?.rendered) || '(no title)';
                          const excerpt = plainText(
                            post.excerpt?.raw || post.excerpt?.rendered || '',
                          );
                          const isTrashed = post.status === 'trash';
                          return (
                            <tr key={post.id} className={styles.fadeIn}>
                              <td className={styles.cThumb}>
                                {thumb ? (
                                  <img className={styles.thumb} src={thumb} alt="" loading="lazy" />
                                ) : (
                                  <span className={styles.thumbEmpty} />
                                )}
                              </td>
                              <td>
                                {isTrashed ? (
                                  <span className={styles.postTitle}>{title}</span>
                                ) : (
                                  <Link to={`/posts/${post.id}/edit`} className={styles.postTitle}>
                                    {title}
                                  </Link>
                                )}
                                {excerpt && (
                                  <p className={styles.excerpt}>
                                    {excerpt.length > EXCERPT_PREVIEW_LENGTH
                                      ? excerpt.slice(0, EXCERPT_PREVIEW_LENGTH) + '…'
                                      : excerpt}
                                  </p>
                                )}
                              </td>
                              <td className={styles.cStatus}>
                                <StatusPill status={post.status} />
                              </td>
                              <td className={styles.cDate}>
                                <time>{fmtDate(dateValue(post))}</time>
                                <span className={styles.dateKind}>{dateLabel(post.status)}</span>
                              </td>
                              <td className={styles.cActions}>
                                {isTrashed ? (
                                  <button
                                    type="button"
                                    className={styles.actionBtn}
                                    disabled={restoringId === post.id}
                                    onClick={() => handleRestore(post)}
                                  >
                                    {restoringId === post.id ? 'Restoring…' : 'Restore'}
                                  </button>
                                ) : (
                                  <Link to={`/posts/${post.id}/edit`} className={styles.actionBtn}>
                                    Edit
                                  </Link>
                                )}
                                <button
                                  type="button"
                                  className={`${styles.actionBtn} ${styles.actionDanger}`}
                                  onClick={() => openDelete(post)}
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                  </tbody>
                </table>
              </div>

              <div className={styles.pager}>
                {loading ? (
                  <>
                    <span className={`${styles.skel} ${styles.skelPageInfo}`} />
                    <div className={styles.pageButtons}>
                      <span className={`${styles.skel} ${styles.skelPageBtn}`} />
                      <span className={`${styles.skel} ${styles.skelPageCurrent}`} />
                      <span className={`${styles.skel} ${styles.skelPageBtn}`} />
                    </div>
                  </>
                ) : totalPages > 1 ? (
                  <>
                    <span className={`${styles.pageInfo} ${styles.fadeIn}`}>
                      Showing {from}–{to} of {total}
                    </span>
                    <div className={`${styles.pageButtons} ${styles.fadeIn}`}>
                      <button
                        type="button"
                        className={styles.pageBtn}
                        disabled={page <= 1}
                        onClick={() =>
                          setSearchParams((prev) => {
                            const next = new URLSearchParams(prev);
                            const p = page - 1;
                            if (p <= 1) next.delete('page');
                            else next.set('page', String(p));
                            return next;
                          })
                        }
                      >
                        Previous
                      </button>
                      <span className={styles.pageCurrent}>
                        Page {page} of {totalPages}
                      </span>
                      <button
                        type="button"
                        className={styles.pageBtn}
                        disabled={page >= totalPages}
                        onClick={() =>
                          setSearchParams((prev) => {
                            const next = new URLSearchParams(prev);
                            next.set('page', String(page + 1));
                            return next;
                          })
                        }
                      >
                        Next
                      </button>
                    </div>
                  </>
                ) : (
                  <span>&nbsp;</span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleting}
        title="Delete post"
        confirmLabel={
          deleting?.status === 'trash'
            ? 'Delete permanently'
            : permanent
              ? 'Delete permanently'
              : 'Move to Trash'
        }
        danger
        busy={deleteBusy}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      >
        {deleting && (
          <>
            <p>
              {deleting.status === 'trash' ? (
                <>
                  This will permanently delete{' '}
                  <strong>{deleting.title?.raw || '(no title)'}</strong> and all its data. This
                  can't be undone.
                </>
              ) : (
                <>
                  Are you sure you want to delete{' '}
                  <strong>{deleting.title?.raw || '(no title)'}</strong>?
                </>
              )}
            </p>
            {deleting.status !== 'trash' && (
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={permanent}
                  onChange={(e) => setPermanent(e.target.checked)}
                />
                Delete permanently instead. This skips the Trash and can't be undone.
              </label>
            )}
            {deleteError && <Banner message={deleteError} onDismiss={() => setDeleteError('')} />}
          </>
        )}
      </ConfirmDialog>
    </div>
  );
}
