import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';

describe('ChatGateway', () => {
  let gateway: ChatGateway;

  const mockChatService = {
    isParticipant: jest.fn(),
    sendMessage: jest.fn(),
  };

  const mockJwtService = {
    verifyAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'JWT_SECRET') return 'test_jwt_secret_key_1234567890';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        { provide: ChatService, useValue: mockChatService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    gateway = module.get<ChatGateway>(ChatGateway);
    gateway.server = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as any;
    jest.clearAllMocks();
  });

  describe('handleConnection', () => {
    it('disconnects client when no token is provided', async () => {
      const mockClient = {
        id: 'socket-1',
        handshake: { auth: {}, headers: {} },
        disconnect: jest.fn(),
        data: {},
      } as any;

      await gateway.handleConnection(mockClient);

      expect(mockClient.disconnect).toHaveBeenCalled();
      expect(mockClient.data.userId).toBeUndefined();
    });

    it('authenticates client and sets userId when token is valid', async () => {
      const mockClient = {
        id: 'socket-1',
        handshake: { auth: { token: 'valid-jwt-token' }, headers: {} },
        disconnect: jest.fn(),
        data: {},
      } as any;

      mockJwtService.verifyAsync.mockResolvedValue({ sub: 'user-authenticated-123' });

      await gateway.handleConnection(mockClient);

      expect(mockClient.disconnect).not.toHaveBeenCalled();
      expect(mockClient.data.userId).toBe('user-authenticated-123');
    });

    it('disconnects client when jwt verification fails', async () => {
      const mockClient = {
        id: 'socket-1',
        handshake: { auth: { token: 'invalid-token' }, headers: {} },
        disconnect: jest.fn(),
        data: {},
      } as any;

      mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await gateway.handleConnection(mockClient);

      expect(mockClient.disconnect).toHaveBeenCalled();
      expect(mockClient.data.userId).toBeUndefined();
    });
  });

  describe('handleJoinConversation', () => {
    it('rejects join if user is not authenticated', async () => {
      const mockClient = {
        id: 'socket-1',
        data: {},
        disconnect: jest.fn(),
      } as any;

      const res = await gateway.handleJoinConversation(mockClient, { conversationId: 'c-1' });

      expect(res.status).toBe('unauthorized');
      expect(mockClient.disconnect).toHaveBeenCalled();
    });

    it('returns forbidden if user is not a participant in the conversation', async () => {
      const mockClient = {
        id: 'socket-1',
        data: { userId: 'intruder-user' },
        join: jest.fn(),
      } as any;

      mockChatService.isParticipant.mockResolvedValue(false);

      const res = await gateway.handleJoinConversation(mockClient, { conversationId: 'c-1' });

      expect(res.status).toBe('forbidden');
      expect(mockClient.join).not.toHaveBeenCalled();
    });

    it('joins room when user is a valid participant', async () => {
      const mockClient = {
        id: 'socket-1',
        data: { userId: 'valid-user' },
        join: jest.fn(),
      } as any;

      mockChatService.isParticipant.mockResolvedValue(true);

      const res = await gateway.handleJoinConversation(mockClient, { conversationId: 'c-1' });

      expect(res.status).toBe('joined');
      expect(mockClient.join).toHaveBeenCalledWith('conversation_c-1');
    });
  });

  describe('handleSendMessage', () => {
    it('uses authenticated userId and ignores client-supplied userId', async () => {
      const mockClient = {
        id: 'socket-1',
        data: { userId: 'actual-auth-user' },
      } as any;

      const sentMsg = { id: 'm-1', content: 'Hola' };
      mockChatService.sendMessage.mockResolvedValue(sentMsg);

      const dto = { conversationId: 'c-1', content: 'Hola', type: 'TEXT' as const };
      const res = await gateway.handleSendMessage(mockClient, {
        userId: 'spoofed-victim-user',
        dto,
      } as any);

      expect(mockChatService.sendMessage).toHaveBeenCalledWith('actual-auth-user', dto);
      expect(res.status).toBe('delivered');
      expect(gateway.server.to).toHaveBeenCalledWith('conversation_c-1');
    });
  });
});
