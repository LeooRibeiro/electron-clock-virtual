import { Notification, ipcMain } from 'electron';

export const NOTIFICATION_CHANNEL = 'app:notify';

function sanitize(value, fallback, maxLength) {
  const str = String(value ?? '').trim();
  return str ? str.slice(0, maxLength) : fallback;
}

export function registerNotificationHandler() {
  ipcMain.handle(NOTIFICATION_CHANNEL, (_event, payload = {}) => {
    if (!Notification.isSupported()) return false;

    const title = sanitize(payload.title, 'Clock Virtual', 80);
    const body = sanitize(payload.body, '', 240);

    const notification = new Notification({ title, body });
    notification.show();
    return true;
  });
}