async function ensurePermission(NotificationCtor) {
  if (NotificationCtor.permission === 'granted') return true;
  if (NotificationCtor.permission === 'denied') return false;
  const permission = await NotificationCtor.requestPermission();
  return permission === 'granted';
}

export async function notify({ title, body }, overrides = {}) {
  const bridge = overrides.bridge ?? window.desktop;
  const NotificationCtor = overrides.Notification ?? window.Notification;

  if (bridge && typeof bridge.notify === 'function') {
    try {
      const shown = await bridge.notify(title, body);
      if (shown) return true;
    } catch {}
  }

  if (typeof NotificationCtor !== 'undefined' && (await ensurePermission(NotificationCtor))) {
    new NotificationCtor(title, { body });
    return true;
  }

  return false;
}