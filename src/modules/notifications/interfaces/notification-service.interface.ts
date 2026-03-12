/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  INotification,
  INotificationContent,
  INotificationRecipient,
  INotificationDeliveryResult,
} from './notification.interface';

export {
  INotification,
  INotificationContent,
  INotificationRecipient,
  INotificationDeliveryResult,
};

/**
 * Generic notification sender interface
 * Follows Dependency Inversion Principle - depend on abstractions
 */
export interface INotificationSender<T extends INotification = INotification> {
  sendSingleNotificationToRecipient(
    recipient: INotificationRecipient,
    content: INotificationContent,
    options?: Record<string, any>,
  ): Promise<INotificationDeliveryResult>;

  sendBulkNotificationsToMultipleRecipients(
    recipients: INotificationRecipient[],
    content: INotificationContent,
    options?: Record<string, any>,
  ): Promise<INotificationDeliveryResult[]>;

  validateRecipientInformation(
    recipient: INotificationRecipient,
  ): Promise<boolean>;

  checkServiceHealthAndConnectivity(): Promise<boolean>;
}

/**
 * Template service interface for managing notification templates
 */
export interface INotificationTemplateService {
  compileTemplateWithVariables(
    templateName: string,
    variables: Record<string, any>,
    language?: string,
  ): Promise<INotificationContent>;

  validateTemplateExists(templateName: string): Promise<boolean>;

  registerNewTemplate(
    templateName: string,
    templateContent: string,
    templateType: string,
  ): Promise<void>;

  deleteExistingTemplate(templateName: string): Promise<void>;

  listAllAvailableTemplates(): Promise<string[]>;
}

/**
 * Queue service interface for managing notification delivery
 */
export interface INotificationQueueService {
  addNotificationToDeliveryQueue(
    notification: INotification,
    priority?: number,
  ): Promise<void>;

  processNextNotificationInQueue(): Promise<INotificationDeliveryResult | null>;

  retryFailedNotificationDelivery(notificationId: string): Promise<void>;

  getQueueStatusAndStatistics(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }>;

  purgeExpiredNotificationsFromQueue(): Promise<number>;
}

/**
 * Notification tracking service interface
 */
export interface INotificationTrackingService {
  trackNotificationDelivery(
    notificationId: string,
    deliveryResult: INotificationDeliveryResult,
  ): Promise<void>;

  trackNotificationOpened(
    notificationId: string,
    openedAt: Date,
  ): Promise<void>;

  trackNotificationClicked(
    notificationId: string,
    clickedUrl: string,
    clickedAt: Date,
  ): Promise<void>;

  getNotificationDeliveryStatistics(
    startDate: Date,
    endDate: Date,
  ): Promise<{
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    failed: number;
  }>;
}

/**
 * Rate limiting service interface
 */
export interface INotificationRateLimitService {
  checkRateLimitForRecipient(recipientId: string): Promise<boolean>;

  incrementRateLimitCounterForRecipient(recipientId: string): Promise<void>;

  resetRateLimitForRecipient(recipientId: string): Promise<void>;

  getRemainingNotificationsForRecipient(recipientId: string): Promise<number>;
}
