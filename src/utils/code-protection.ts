/**
 * CHOICE iD Code Protection System
 * Prevents unauthorized execution and distribution
 * 
 * This file contains critical anti-piracy measures
 */

// Hardcoded protection fingerprints
const OFFICIAL_DOMAINS = [
  'choiceid.app',
  'www.choiceid.app',
  'app.choiceid.app',
  'staging.choiceid.app',
];

const OFFICIAL_ORIGINS = [
  'https://choiceid.app',
  'https://www.choiceid.app',
  'https://app.choiceid.app',
];

/**
 * CRITICAL: Prevents execution on unauthorized domains
 * Runs on every app load
 */
export const enforceOriginRestriction = (): boolean => {
  if (typeof window === 'undefined') return false;

  const currentOrigin = window.location.origin;
  const currentHostname = window.location.hostname;

  // Check if running on official platform
  const isOfficialDomain = OFFICIAL_DOMAINS.some(
    domain => currentHostname === domain || currentHostname.endsWith(domain)
  );

  const isOfficialOrigin = OFFICIAL_ORIGINS.some(
    origin => currentOrigin === origin
  );

  if (!isOfficialDomain && !isOfficialOrigin) {
    // Log violation
    logViolation('UNAUTHORIZED_ORIGIN', {
      origin: currentOrigin,
      hostname: currentHostname,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    });

    // Block execution
    blockApplication(
      'This code can only run on choiceid.app\n\n' +
      'Downloading or self-hosting is prohibited.\n\n' +
      'Your access attempt has been logged.\n\n' +
      'Learn more: https://choiceid.app/terms'
    );

    return false;
  }

  return true;
};

/**
 * Detects if code is running in development/debug mode
 */
export const detectDebugMode = (): boolean => {
  // Check for debugger
  if ((globalThis as any).chrome?.devtools?.inspectedWindow) {
    logViolation('DEBUG_MODE_DETECTED', { type: 'chrome_devtools' });
    return true;
  }

  // Check for React DevTools
  if ((globalThis as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    logViolation('DEBUG_MODE_DETECTED', { type: 'react_devtools' });
    return true;
  }

  // Check for Vue DevTools
  if ((globalThis as any).__VUE_DEVTOOLS_GLOBAL_HOOK__) {
    logViolation('DEBUG_MODE_DETECTED', { type: 'vue_devtools' });
    return true;
  }

  return false;
};

/**
 * Prevents code execution outside of app container
 */
export const enforceContainerExecution = (): boolean => {
  // Check if running in web worker (not allowed)
  if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
    logViolation('WORKER_EXECUTION_ATTEMPT', {});
    blockApplication('Code cannot be executed in workers.\n\nContact support@choiceid.app');
    return false;
  }

  // Check DOM requirements
  const requiredElements = [
    '#root', // React root
  ];

  const missingElements = requiredElements.filter(
    selector => !document.querySelector(selector)
  );

  if (missingElements.length > 0) {
    logViolation('INVALID_DOM_STRUCTURE', { missing: missingElements });
    blockApplication('Invalid execution environment.\n\nThis application can only run on choiceid.app');
    return false;
  }

  return true;
};

/**
 * Blocks all execution
 */
export const blockApplication = (message: string): void => {
  // Clear everything
  document.body.innerHTML = '';

  // Show blocking message
  const blocker = document.createElement('div');
  blocker.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #000;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999999;
    color: #fff;
    font-family: monospace;
    padding: 20px;
  `;

  blocker.innerHTML = `
    <div style="text-align: center; max-width: 600px;">
      <h1 style="color: #ff0000; font-size: 32px; margin: 0;">⚠️ UNAUTHORIZED EXECUTION</h1>
      <p style="margin-top: 20px; white-space: pre-wrap; line-height: 1.6;">
        ${message}
      </p>
      <p style="margin-top: 30px; color: #888; font-size: 12px;">
        Request ID: ${generateRequestId()}<br/>
        Timestamp: ${new Date().toISOString()}<br/>
        This incident has been logged and reported.
      </p>
    </div>
  `;

  document.body.appendChild(blocker);

  // Disable all interactions
  document.addEventListener('click', (e) => e.preventDefault(), true);
  document.addEventListener('keydown', (e) => e.preventDefault(), true);
};

/**
 * Logs violations for legal action
 */
export const logViolation = async (
  type: string,
  details: Record<string, any>
): Promise<void> => {
  try {
    const violation = {
      type,
      details,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      referrer: document.referrer,
      fingerprint: generateDeviceFingerprint(),
    };

    // Send to security server
    await fetch('https://security.choiceid.app/api/log-violation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(violation),
      mode: 'no-cors',
    }).catch(() => {
      // Silently fail - logs are sent regardless
    });

    // Store locally
    localStorage.setItem(
      `violation_${Date.now()}`,
      JSON.stringify(violation)
    );
  } catch (error) {
    console.error('Violation logging failed:', error);
  }
};

/**
 * Generates unique device fingerprint
 */
export const generateDeviceFingerprint = (): string => {
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency,
    getWebGLInfo(),
  ].join('|');

  return hashString(fingerprint);
};

/**
 * Gets WebGL info for device fingerprinting
 */
export const getWebGLInfo = (): string => {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    if (!gl) return 'no-webgl';

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return 'no-debug';

    return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
  } catch {
    return 'error';
  }
};

/**
 * Hash string using simple algorithm
 */
export const hashString = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
};

/**
 * Generates unique request ID for tracking
 */
export const generateRequestId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
