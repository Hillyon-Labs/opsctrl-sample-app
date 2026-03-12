import {
  INotification,
  INotificationContent,
  INotificationRecipient,
  INotificationDeliveryResult,
} from './notification.interface';

/**
 * Email-specific notification interface
 * Extends base notification for email-specific properties
 */
export interface IEmailNotification extends INotification {
  readonly senderEmail: string;
  readonly senderName?: string;
  readonly recipientEmail: string;
  readonly recipientName?: string;
  readonly replyTo?: string;
  readonly cc?: string[];
  readonly bcc?: string[];
  readonly priority?: EmailPriority;
  readonly trackingEnabled?: boolean;
}

/**
 * Email content interface with email-specific properties
 */
export interface IEmailContent extends INotificationContent {
  readonly subject: string;
  readonly textBody?: string;
  readonly htmlBody?: string;
  readonly templateName?: string;
}

/**
 * Interface for email template data
 */
export interface IEmailTemplateData {
  readonly templateName: string;
  readonly variables: Record<string, any>;
  readonly language?: string;
}

/**
 * Interface for email configuration
 */
export interface IEmailConfiguration {
  readonly host: string;
  readonly port: number;
  readonly secure: boolean;
  readonly username: string;
  readonly password: string;
  readonly defaultSenderEmail: string;
  readonly defaultSenderName: string;
  readonly replyToEmail?: string;
  readonly maxConcurrentConnections?: number;
  readonly connectionTimeout?: number;
  readonly greetingTimeout?: number;
  readonly socketTimeout?: number;
}

/**
 * Email priority levels
 */
export enum EmailPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
}

/**
 * Interface for email delivery result with email-specific data
 */
export interface IEmailDeliveryResult extends INotificationDeliveryResult {
  readonly messageId: string;
  readonly accepted: string[];
  readonly rejected: string[];
  readonly pending: string[];
  readonly envelope: {
    from: string;
    to: string[];
  };
}
