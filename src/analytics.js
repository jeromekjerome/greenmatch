// Analytics — Mixpanel SDK
// Set VITE_MIXPANEL_TOKEN in Vercel project settings to activate.
// All calls are silent no-ops when the token is absent.
import mixpanel from 'mixpanel-browser';

const TOKEN = import.meta.env.VITE_MIXPANEL_TOKEN;

if (TOKEN) {
  mixpanel.init(TOKEN, { persistence: 'localStorage', track_pageview: false });
}

/**
 * Track an analytics event.
 * @param {string} event - event name
 * @param {object|string} [props] - extra properties, or legacy sessionId string
 */
export function track(event, props = {}) {
  if (!TOKEN) return;
  const safeProps = typeof props === 'string' ? { sessionId: props } : props;
  mixpanel.track(event, safeProps);
}
