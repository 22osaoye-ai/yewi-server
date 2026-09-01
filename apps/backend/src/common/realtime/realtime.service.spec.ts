import { RealtimeService } from './realtime.service';

describe('RealtimeService', () => {
  it('emits notifications to the authenticated user room', () => {
    const emit = jest.fn();
    const gateway = { server: { to: jest.fn(() => ({ emit })) } } as any;
    const service = new RealtimeService(gateway);
    const notification = {
      id: 'notification_1',
      userId: 'user_1',
      type: 'SYSTEM_ALERT',
      title: 'Aviso',
      message: 'Mensaje',
      link: null,
      isRead: false,
      createdAt: new Date(),
    };

    service.emitNotification(notification);

    expect(gateway.server.to).toHaveBeenCalledWith('user:user_1');
    expect(emit).toHaveBeenCalledWith('notification:new', notification);
  });
});
