/**
 * @file Login page.
 *
 * Presents a form for authenticating with WordPress credentials
 * (username + Application Password). The site URL field is shown
 * unless `VITE_WP_SITE_URL` is set in the environment.
 *
 * Validates inputs client-side before submitting. On success,
 * navigates to the post list. On failure, displays the API error
 * and clears the password field.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { validateLogin } from '../validation/loginRules';
import Banner from '../components/Banner';
import FieldError from '../components/FieldError';
import Spinner from '../components/Spinner';
import styles from './LoginPage.module.css';

/** Pre-configured site URL from environment, if any. */
const envSiteUrl = import.meta.env.VITE_WP_SITE_URL || '';

/**
 * Login form with credential fields and client-side validation.
 *
 * @returns {JSX.Element}
 */
export default function LoginPage() {
  const { login, loginNotice, clearLoginNotice } = useAuth();
  const navigate = useNavigate();

  const [siteUrl, setSiteUrl] = useState(envSiteUrl);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [busy, setBusy] = useState(false);

  const clearFieldError = (field) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async () => {
    if (busy) return;

    setApiError('');
    const values = { mode: 'live', siteUrl, username, password, envSiteUrl };
    const validationErrors = validateLogin(values);

    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setBusy(true);

    try {
      await login(siteUrl, username, password);
      navigate('/posts', { replace: true });
    } catch (err) {
      setApiError(err.message);
      setPassword('');
    } finally {
      setBusy(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.login}>
        <div className={styles.head}>
          <h1 tabIndex={-1}>Log in to manage posts</h1>
          <p className={styles.subtitle}>
            Use a WordPress account that can write posts (Author, Editor or Administrator).
          </p>
        </div>

        {loginNotice && (
          <Banner kind="warning" message={loginNotice} onDismiss={clearLoginNotice} />
        )}

        <div className={styles.card}>
          {envSiteUrl ? (
            <div className={styles.siteIndicator}>
              <span className={styles.siteIndicatorLabel}>Connecting to</span>
              <span className={styles.siteIndicatorUrl}>{envSiteUrl}</span>
            </div>
          ) : (
            <div className={styles.field}>
              <label htmlFor="f-siteUrl">Site address</label>
              <input
                type="url"
                id="f-siteUrl"
                placeholder="https://example.com"
                autoComplete="url"
                value={siteUrl}
                onChange={(e) => {
                  setSiteUrl(e.target.value);
                  clearFieldError('siteUrl');
                }}
                onKeyDown={handleKeyDown}
                aria-invalid={!!errors.siteUrl || undefined}
                aria-describedby="f-siteUrl-hint f-siteUrl-error"
              />
              <p className={styles.hint} id="f-siteUrl-hint">
                The app calls <code className={styles.mono}>/wp-json/wp/v2</code> on this address.
              </p>
              <FieldError id="f-siteUrl-error" message={errors.siteUrl} />
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="f-username">Username or email</label>
            <input
              type="text"
              id="f-username"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck="false"
              maxLength={100}
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                clearFieldError('username');
              }}
              onKeyDown={handleKeyDown}
              aria-invalid={!!errors.username || undefined}
              aria-describedby="f-username-error"
            />
            <FieldError id="f-username-error" message={errors.username} />
          </div>

          <div className={styles.field}>
            <label htmlFor="f-password">Application Password</label>
            <div className={styles.pwWrap}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="f-password"
                autoComplete="current-password"
                spellCheck="false"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearFieldError('password');
                }}
                onKeyDown={handleKeyDown}
                aria-invalid={!!errors.password || undefined}
                aria-describedby="f-password-hint f-password-error"
              />
              <button
                type="button"
                className={styles.pwToggle}
                onClick={() => setShowPassword(!showPassword)}
                aria-pressed={showPassword}
                aria-controls="f-password"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className={styles.hint} id="f-password-hint">
              Create one in wp-admin under Users, Profile, Application Passwords. Your regular login
              password won't work with the REST API.
            </p>
            <FieldError id="f-password-error" message={errors.password} />
          </div>

          {apiError && <Banner message={apiError} onDismiss={() => setApiError('')} />}

          <button type="button" className={styles.submitBtn} onClick={handleSubmit} disabled={busy}>
            {busy && <Spinner />}
            {busy ? 'Logging in…' : 'Log in'}
          </button>
        </div>
      </div>
    </div>
  );
}
