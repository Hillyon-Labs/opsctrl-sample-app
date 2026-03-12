import { NotificationStatus } from '../enums/notification.enum';

/**
 * Base interface for all notification types
 * Follows Interface Segregation Principle - clients only depend on what they need
 */
export interface INotification {
  readonly id: string;
  readonly recipientId: string;
  readonly type: string;
  readonly status: NotificationStatus;
  readonly createdAt: Date;
  readonly sentAt?: Date;
  readonly failedAt?: Date;
  readonly retryCount: number;
  readonly maxRetries: number;
  readonly metadata?: Record<string, any>;
}

/**
 * Interface for notification content that can be sent
 */
export interface INotificationContent {
  readonly subject?: string;
  readonly body: string;
  readonly htmlBody?: string;
  readonly attachments?: INotificationAttachment[];
  readonly templateVariables?: Record<string, any>;
}

/**
 * Interface for notification attachments
 */
export interface INotificationAttachment {
  readonly filename: string;
  readonly content: Buffer | string;
  readonly contentType: string;
  readonly encoding?: string;
}

/**
 * Interface for notification recipients
 */
export interface INotificationRecipient {
  readonly id: string;
  readonly email?: string;
  readonly phoneNumber?: string;
  readonly name?: string;
  readonly preferredLanguage?: string;
  readonly timezone?: string;
}

/**
 * Interface for notification delivery result
 */
export interface INotificationDeliveryResult {
  readonly success: boolean;
  readonly messageId?: string;
  readonly error?: string;
  readonly deliveredAt: Date;
  readonly providerResponse?: any;
}
