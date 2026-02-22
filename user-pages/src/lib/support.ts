import { getSessionToken } from '@descope/react-sdk'

const API_BASE = import.meta.env.VITE_BACKEND_URL;

export interface SupportChat {
  id: string;
  subject: string;
  status: 'open' | 'closed';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
  last_message: string;
  unread_count: number;
  messages: SupportMessage[];
}

export interface SupportMessage {
  id: string;
  chat_id: string;
  sender: 'user' | 'support';
  message: string;
  image_url?: string;
  created_at: string;
  is_read: boolean;
}

class SupportService {
  private async request(endpoint: string, options: RequestInit = {}) {
    const token = getSessionToken();
    if (!token) throw new Error('No authentication token');

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (response.status === 401) {
      window.location.href = '/login';
      throw new Error('Authentication required');
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Request failed: ${error}`);
    }

    return response.json();
  }

  async getChats(): Promise<SupportChat[]> {
    return this.request('/support/chats');
  }

  async getChat(chatId: string): Promise<SupportChat> {
    return this.request(`/support/chats/${chatId}`);
  }

  async createChat(subject: string, message: string): Promise<SupportChat> {
    return this.request('/support/chats', {
      method: 'POST',
      body: JSON.stringify({ subject, message }),
    });
  }

  async sendMessage(chatId: string, message: string): Promise<SupportMessage> {
    return this.request(`/support/chats/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  async sendMessageWithImage(chatId: string, message: string, imageFile?: File): Promise<SupportMessage> {
    const token = getSessionToken();
    if (!token) throw new Error('No authentication token');

    const formData = new FormData();
    formData.append('message', message);
    if (imageFile) {
      formData.append('image', imageFile);
    }

    const response = await fetch(`${API_BASE}/support/chats/${chatId}/messages-with-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (response.status === 401) {
      window.location.href = '/login';
      throw new Error('Authentication required');
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Request failed: ${error}`);
    }

    return response.json();
  }

  async markChatAsRead(chatId: string): Promise<void> {
    return this.request(`/support/chats/${chatId}/read`, {
      method: 'POST',
    });
  }
}

export const supportService = new SupportService();