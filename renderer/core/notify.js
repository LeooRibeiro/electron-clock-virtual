export const NOTIFICATION_PERMISSION = Object.freeze({
  GRANTED: 'granted',
  DENIED: 'denied',
  DEFAULT: 'default',
  UNSUPPORTED: 'unsupported',
});

function resolveBridge(overrides) {
  if ('bridge' in overrides) return overrides.bridge;
  return typeof window !== 'undefined' ? window.desktop : undefined;
}

function resolveNotification(overrides) {
  if ('Notification' in overrides) return overrides.Notification;
  return typeof window !== 'undefined' ? window.Notification : undefined;
}

export function getNotificationPermission(overrides = {}) {
  const NotificationCtor = resolveNotification(overrides);
  if (
    typeof NotificationCtor === 'undefined' ||
    typeof NotificationCtor.requestPermission !== 'function'
  ) {
    return NOTIFICATION_PERMISSION.UNSUPPORTED;
  }
  return NotificationCtor.permission;
}

export async function requestNotificationPermission(overrides = {}) {
  const NotificationCtor = resolveNotification(overrides);
  if (
    getNotificationPermission({ Notification: NotificationCtor }) ===
    NOTIFICATION_PERMISSION.UNSUPPORTED
  ) {
    return NOTIFICATION_PERMISSION.UNSUPPORTED;
  }

  if (NotificationCtor.permission === NOTIFICATION_PERMISSION.GRANTED) {
    return NOTIFICATION_PERMISSION.GRANTED;
  }
  if (NotificationCtor.permission === NOTIFICATION_PERMISSION.DENIED) {
    return NOTIFICATION_PERMISSION.DENIED;
  }

  try {
    const result = await NotificationCtor.requestPermission();
    return result ?? NOTIFICATION_PERMISSION.DEFAULT;
  } catch {
    return NOTIFICATION_PERMISSION.DEFAULT;
  }
}

export async function notify({ title, body }, overrides = {}) {
  const bridge = resolveBridge(overrides);
  const NotificationCtor = resolveNotification(overrides);

  if (bridge && typeof bridge.notify === 'function') {
    try {
      const shown = await bridge.notify(title, body);
      if (shown) return true;
    } catch {}
  }

  if (
    typeof NotificationCtor !== 'undefined' &&
    getNotificationPermission({ Notification: NotificationCtor }) ===
      NOTIFICATION_PERMISSION.GRANTED
  ) {
    try {
      new NotificationCtor(title, { body });
      return true;
    } catch {}
  }

  return false;
}