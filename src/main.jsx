/**
 * @file Application entry point.
 *
 * Mounts the React application into the DOM element with id "root"
 * defined in index.html. The app is wrapped in React's StrictMode,
 * which enables additional development-time checks for common issues
 * such as impure renders, missing effect cleanups, and deprecated APIs.
 *
 * Global styles (design tokens, base resets, and typography) are
 * imported here so they apply before any component renders.
 *
 * In development, Vite serves this file with on-the-fly JSX
 * transformation. In production, `npm run build` compiles it into a
 * vanilla JS bundle inside `dist/`.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Global styles: CSS custom properties, resets, and base typography.
import './styles/global.css';

/**
 * Initialize and render the React application.
 *
 * Uses React 18+'s `createRoot` API for concurrent rendering support.
 * The root element is expected to exist in index.html as `<div id="root">`.
 *
 * @see {@link https://react.dev/reference/react-dom/client/createRoot}
 */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
