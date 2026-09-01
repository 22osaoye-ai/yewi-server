import { RealtimeGateway } from './realtime.gateway';

describe('RealtimeGateway', () => {
  it('authenticates a socket and joins its user room', async () => {
    const gateway = new RealtimeGateway(
      { verifyAsync: jest.fn().mockResolvedValue({ sub: 'user_1' }) } as any,
      { get: jest.fn().mockReturnValue('secret') } as any,
    );
    const join = jest.fn();
    const client = {
      id: 'socket_1',
      handshake: { auth: { token: 'token' }, headers: {} },
      data: {},
      join,
      disconnect: jest.fn(),
    } as any;

    await gateway.handleConnection(client);

    expect(join).toHaveBeenCalledWith('user:user_1');
    expect(client.data.userId).toBe('user_1');
    expect(client.disconnect).not.toHaveBeenCalled();
  });
});
