import { StreamChat, Channel } from 'stream-chat';
import { chatApi, StreamTokenResponse } from './chatApi';
import { getAccessToken } from './apiClient';

class StreamChatService {
  private client: StreamChat | null = null;
  private currentUserId: string | null = null;
  private connectionPromise: Promise<StreamChat | null> | null = null;

  /**
   * Obtiene la instancia conectada de Stream Chat para el usuario autenticado
   */
  async getConnectedClient(forceRefresh = false): Promise<StreamChat | null> {
    if (this.client && this.client.userID && !forceRefresh) {
      return this.client;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = (async () => {
      try {
        const accessToken = await getAccessToken();
        if (!accessToken) {
          return null;
        }

        const tokenData: StreamTokenResponse = await chatApi.getStreamToken();
        if (!tokenData || !tokenData.token || !tokenData.apiKey) {
          return null;
        }

        if (this.client && this.currentUserId !== tokenData.userId) {
          await this.disconnect();
        }

        const client = StreamChat.getInstance(tokenData.apiKey);

        if (!client.userID) {
          await client.connectUser(
            {
              id: tokenData.userId,
              name: tokenData.user.name,
              image: tokenData.user.image,
            },
            tokenData.token,
          );
        }

        this.client = client;
        this.currentUserId = tokenData.userId;
        return client;
      } catch {
        return null;
      } finally {
        this.connectionPromise = null;
      }
    })();

    return this.connectionPromise;
  }

  /**
   * Obtener o crear canal 1-a-1 entre dos usuarios
   */
  async getOrCreateDirectChannel(
    currentUserId: string,
    otherUserId: string,
    metadata?: {
      conversationId?: string;
      orderId?: string;
      requestId?: string;
      title?: string;
    },
  ): Promise<Channel | null> {
    const client = await this.getConnectedClient();
    if (!client) return null;

    try {
      const channelId = metadata?.conversationId
        ? `yewi-conv-${metadata.conversationId.replace(/[^a-zA-Z0-9_-]/g, '')}`
        : [currentUserId, otherUserId].sort().join('-').replace(/[^a-zA-Z0-9_-]/g, '');

      const channel = client.channel('messaging', channelId, {
        members: [currentUserId, otherUserId],
        ...(metadata as any),
      });

      await channel.watch();
      return channel;
    } catch (err) {
      console.warn('Stream channel watch note:', err);
      return null;
    }
  }

  /**
   * Desconectar cliente de Stream de forma segura
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.disconnectUser();
      } catch {
        // Ignorado en desmontaje
      }
      this.client = null;
      this.currentUserId = null;
    }
  }

  getCurrentClient(): StreamChat | null {
    return this.client;
  }
}

export const streamChatService = new StreamChatService();
