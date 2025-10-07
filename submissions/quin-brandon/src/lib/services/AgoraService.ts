/**
 * Agora Service
 * Handles Agora RTC token generation and client utilities
 */

import type { AgoraTokenRequest, AgoraTokenResponse } from '@/lib/types/agora';

export class AgoraService {
  /**
   * Request an RTC token from the server
   */
  static async getToken(params: AgoraTokenRequest): Promise<AgoraTokenResponse> {
    try {
      const response = await fetch('/api/agora/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get token');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting Agora token:', error);
      throw error;
    }
  }

  /**
   * Check if Agora is properly configured
   */
  static async checkConfiguration(): Promise<boolean> {
    try {
      const response = await fetch('/api/agora/token');
      const data = await response.json();
      return data.configured === true;
    } catch (error) {
      console.error('Configuration check failed:', error);
      return false;
    }
  }

  /**
   * Generate a unique channel name
   */
  static generateChannelName(userId?: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return userId ? `${userId}_${timestamp}` : `session_${timestamp}_${random}`;
  }

  /**
   * Generate a random UID
   */
  static generateUID(): number {
    return Math.floor(Math.random() * 100000);
  }
}

