import {
  NOTIFICATION_PERMISSION,
  getNotificationPermission,
  notify,
  requestNotificationPermission,
} from '../renderer/core/notify.js';

function createFakeNotification(permission) {
  const instances = [];
  let requestCalls = 0;
  const Ctor = function Notification(title, options) {
    instances.push({ title, options });
  };
  Ctor.permission = permission;
  Ctor.requestPermission = () => {
    requestCalls += 1;
    return Promise.resolve('granted');
  };
  Ctor.instances = instances;
  Ctor.getRequestCalls = () => requestCalls;
  return Ctor;
}

describe('notify — getNotificationPermission', () => {
  test('retorna unsupported sem Notification API', () => {
    expect(getNotificationPermission({ Notification: undefined })).toBe(
      NOTIFICATION_PERMISSION.UNSUPPORTED
    );
  });

  test('retorna a permissão atual do navegador', () => {
    const granted = createFakeNotification('granted');
    const denied = createFakeNotification('denied');
    const pending = createFakeNotification('default');

    expect(getNotificationPermission({ Notification: granted })).toBe('granted');
    expect(getNotificationPermission({ Notification: denied })).toBe('denied');
    expect(getNotificationPermission({ Notification: pending })).toBe('default');
  });
});

describe('notify — requestNotificationPermission', () => {
  test('não pede permissão quando já concedida', async () => {
    const fake = createFakeNotification('granted');
    const result = await requestNotificationPermission({ Notification: fake });

    expect(result).toBe(NOTIFICATION_PERMISSION.GRANTED);
    expect(fake.getRequestCalls()).toBe(0);
  });

  test('retorna denied sem pedir de novo quando bloqueada', async () => {
    const fake = createFakeNotification('denied');
    const result = await requestNotificationPermission({ Notification: fake });

    expect(result).toBe(NOTIFICATION_PERMISSION.DENIED);
    expect(fake.getRequestCalls()).toBe(0);
  });

  test('solicita permissão quando o status é default', async () => {
    const fake = createFakeNotification('default');
    const result = await requestNotificationPermission({ Notification: fake });

    expect(result).toBe(NOTIFICATION_PERMISSION.GRANTED);
    expect(fake.getRequestCalls()).toBe(1);
  });

  test('retorna unsupported sem Notification API', async () => {
    const result = await requestNotificationPermission({ Notification: undefined });

    expect(result).toBe(NOTIFICATION_PERMISSION.UNSUPPORTED);
  });
});

describe('notify — envio', () => {
  test('usa a ponte nativa (Electron) quando disponível', async () => {
    const fake = createFakeNotification('default');
    const bridge = { notify: () => Promise.resolve(true) };

    const shown = await notify({ title: 'T', body: 'B' }, { bridge, Notification: fake });

    expect(shown).toBe(true);
    expect(fake.instances).toHaveLength(0);
  });

  test('usa a Web Notification API quando a permissão está concedida', async () => {
    const fake = createFakeNotification('granted');

    const shown = await notify({ title: 'T', body: 'B' }, { Notification: fake });

    expect(shown).toBe(true);
    expect(fake.instances).toHaveLength(1);
    expect(fake.instances[0]).toEqual({ title: 'T', options: { body: 'B' } });
  });

  test('não solicita permissão automaticamente fora de gesto do usuário', async () => {
    const fake = createFakeNotification('default');

    const shown = await notify({ title: 'T', body: 'B' }, { Notification: fake });

    expect(shown).toBe(false);
    expect(fake.getRequestCalls()).toBe(0);
    expect(fake.instances).toHaveLength(0);
  });

  test('não dispara quando a permissão está bloqueada', async () => {
    const fake = createFakeNotification('denied');

    const shown = await notify({ title: 'T', body: 'B' }, { Notification: fake });

    expect(shown).toBe(false);
    expect(fake.instances).toHaveLength(0);
  });
});