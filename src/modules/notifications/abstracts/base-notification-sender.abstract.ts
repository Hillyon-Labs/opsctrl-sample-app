/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, Logger } from '@nestjs/common';
import { INotificationSender } from '../interfaces/notification-service.interface';
import {
  INotification,
  INotificationContent,
  INotificationRecipient,
  INotificationDeliveryResult,
} from '../interfaces/notification.interface';
import { LoggerService } from '../../../common/services/logger.service';

/**
 * Abstract base class for all notification senders
 * Follows Single Responsibility Principle - handles common sending logic
 * Follows Template Method Pattern for extensible sending process
 */
@Injectable()
export abstract class BaseNotificationSender<
  T extends INotification = INotification,
> implements INotificationSender
{
  protected readonly logger = new Logger(this.constructor.name);

  constructor(protected readonly loggerService: LoggerService) {}

  /**
   * Sends a single notification to a recipient
   * Template method that defines the sending process
   */
  async sendSingleNotificationToRecipient(
    recipient: INotificationRecipient,
    content: INotificationContent,
    options?: Record<string, any>,
  ): Promise<INotificationDeliveryResult> {
    const startTime = Date.now();

    try {
      this.loggerService.info(
        'Starting single notification delivery',
        this.constructor.name,
        { recipientId: recipient.id, contentType: typeof content },
      );

      // Step 1: Validate recipient information
      await this.validateAndSanitizeRecipientInformation(recipient);

      // Step 2: Validate and prepare content
      const preparedContent =
        await this.validateAndPrepareNotificationContent(content);

      // Step 3: Apply rate limiting if needed
      await this.checkRateLimitingForRecipient(recipient);

      // Step 4: Perform the actual sending (implemented by concrete classes)
      const deliveryResult = await this.performActualNotificationDelivery(
        recipient,
        preparedContent,
        options,
      );

      // Step 5: Log successful delivery
      await this.logSuccessfulNotificationDelivery(
        recipient,
        deliveryResult,
        Date.now() - startTime,
      );

      return deliveryResult;
    } catch (error) {
      // Step 6: Handle and log errors
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';

      await this.logFailedNotificationDelivery(
        recipient,
        errorMessage,
        Date.now() - startTime,
      );

      return this.createFailedDeliveryResult(errorMessage);
    }
  }

  /**
   * Sends bulk notifications to multiple recipients
   */
  async sendBulkNotificationsToMultipleRecipients(
    recipients: INotificationRecipient[],
    content: INotificationContent,
    options?: Record<string, any>,
  ): Promise<INotificationDeliveryResult[]> {
    this.loggerService.info(
      'Starting bulk notification delivery',
      this.constructor.name,
      { recipientCount: recipients.length },
    );

    const batchSize = this.getBulkDeliveryBatchSize();
    const results: INotificationDeliveryResult[] = [];

    // Process recipients in batches to avoid overwhelming the service
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      const batchPromises = batch.map((recipient) =>
        this.sendSingleNotificationToRecipient(recipient, content, options),
      );

      const batchResults = await Promise.allSettled(batchPromises);

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push(
            this.createFailedDeliveryResult(
              result.reason?.message || 'Batch delivery failed',
            ),
          );
        }
      }

      // Add delay between batches to respect rate limits
      if (i + batchSize < recipients.length) {
        await this.delayBetweenBulkDeliveryBatches();
      }
    }

    return results;
  }

  /**
   * Validates recipient information
   */
  async validateRecipientInformation(
    recipient: INotificationRecipient,
  ): Promise<boolean> {
    try {
      await this.validateAndSanitizeRecipientInformation(recipient);
      return true;
    } catch (error) {
      this.logger.warn(
        `Recipient validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return false;
    }
  }

  /**
   * Checks service health and connectivity
   */
  async checkServiceHealthAndConnectivity(): Promise<boolean> {
    try {
      return await this.performServiceHealthCheck();
    } catch (error) {
      this.logger.error(
        `Service health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return false;
    }
  }

  // Abstract methods that must be implemented by concrete classes

  /**
   * Validates and sanitizes recipient information
   */
  protected abstract validateAndSanitizeRecipientInformation(
    recipient: INotificationRecipient,
  ): Promise<void>;

  /**
   * Validates and prepares notification content
   */
  protected abstract validateAndPrepareNotificationContent(
    content: INotificationContent,
  ): Promise<INotificationContent>;

  /**
   * Performs the actual notification delivery
   */
  protected abstract performActualNotificationDelivery(
    recipient: INotificationRecipient,
    content: INotificationContent,
    options?: Record<string, any>,
  ): Promise<INotificationDeliveryResult>;

  /**
   * Performs service health check
   */
  protected abstract performServiceHealthCheck(): Promise<boolean>;

  /**
   * Gets the batch size for bulk deliveries
   */
  protected abstract getBulkDeliveryBatchSize(): number;

  // Protected helper methods with default implementations

  /**
   * Checks rate limiting for recipient
   */
  protected async checkRateLimitingForRecipient(
    recipient: INotificationRecipient,
  ): Promise<void> {
    // Default implementation - no rate limiting
    // Override in concrete classes if rate limiting is needed
  }

  /**
   * Logs successful notification delivery
   */
  protected async logSuccessfulNotificationDelivery(
    _recipient: INotificationRecipient,
    result: INotificationDeliveryResult,
    duration: number,
  ): Promise<void> {
    this.loggerService.logPerformance({
      operation: 'notification_delivery_success',
      duration,
      success: true,
      metadata: {
        recipientId: _recipient.id,
        messageId: result.messageId,
        deliveredAt: result.deliveredAt,
      },
    });
  }

  /**
   * Logs failed notification delivery
   */
  protected async logFailedNotificationDelivery(
    recipient: INotificationRecipient,
    error: string,
    duration: number,
  ): Promise<void> {
    this.loggerService.logPerformance({
      operation: 'notification_delivery_failure',
      duration,
      success: false,
      metadata: {
        recipientId: recipient.id,
        error,
      },
    });
  }

  /**
   * Creates a failed delivery result
   */
  protected createFailedDeliveryResult(
    error: string,
  ): INotificationDeliveryResult {
    return {
      success: false,
      error,
      deliveredAt: new Date(),
    };
  }

  /**
   * Adds delay between bulk delivery batches
   */
  protected async delayBetweenBulkDeliveryBatches(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay
  }
}
