import { INotification } from '../interfaces/notification.interface';
import {
  NotificationStatus,
  NotificationPriority,
} from '../enums/notification.enum';

/**
 * Abstract base class for all notification types
 * Follows Single Responsibility Principle - handles common notification logic
 * Follows Open/Closed Principle - open for extension, closed for modification
 */
export abstract class BaseNotification implements INotification {
  protected constructor(
    public readonly id: string,
    public readonly recipientId: string,
    public readonly type: string,
    public readonly createdAt: Date = new Date(),
    public readonly maxRetries: number = 3,
    public readonly metadata?: Record<string, any>,
  ) {}

  private _status: NotificationStatus = NotificationStatus.PENDING;
  private _sentAt?: Date;
  private _failedAt?: Date;
  private _retryCount: number = 0;

  get status(): NotificationStatus {
    return this._status;
  }

  get sentAt(): Date | undefined {
    return this._sentAt;
  }

  get failedAt(): Date | undefined {
    return this._failedAt;
  }

  get retryCount(): number {
    return this._retryCount;
  }

  /**
   * Marks the notification as queued for processing
   */
  markAsQueuedForProcessing(): void {
    this.validateStatusTransition(this._status, NotificationStatus.QUEUED);
    this._status = NotificationStatus.QUEUED;
  }

  /**
   * Marks the notification as currently being processed
   */
  markAsCurrentlyProcessing(): void {
    this.validateStatusTransition(this._status, NotificationStatus.PROCESSING);
    this._status = NotificationStatus.PROCESSING;
  }

  /**
   * Marks the notification as successfully sent
   */
  markAsSuccessfullySent(): void {
    this.validateStatusTransition(this._status, NotificationStatus.SENT);
    this._status = NotificationStatus.SENT;
    this._sentAt = new Date();
  }

  /**
   * Marks the notification as delivered to recipient
   */
  markAsDeliveredToRecipient(): void {
    this.validateStatusTransition(this._status, NotificationStatus.DELIVERED);
    this._status = NotificationStatus.DELIVERED;
  }

  /**
   * Marks the notification as failed with error details
   */
  markAsFailedWithError(error: string): void {
    this._status = NotificationStatus.FAILED;
    this._failedAt = new Date();
    this.addErrorToMetadata(error);
  }

  /**
   * Increments the retry counter for failed deliveries
   */
  incrementRetryCountForFailedDelivery(): void {
    this._retryCount++;
  }

  /**
   * Checks if the notification can be retried
   */
  canBeRetriedForDelivery(): boolean {
    return (
      this._retryCount < this.maxRetries &&
      this._status === NotificationStatus.FAILED
    );
  }

  /**
   * Marks the notification as expired
   */
  markAsExpiredDueToTimeout(): void {
    this._status = NotificationStatus.EXPIRED;
  }

  /**
   * Validates if a status transition is allowed
   */
  protected validateStatusTransition(
    currentStatus: NotificationStatus,
    newStatus: NotificationStatus,
  ): void {
    const validTransitions: Record<NotificationStatus, NotificationStatus[]> = {
      [NotificationStatus.PENDING]: [
        NotificationStatus.QUEUED,
        NotificationStatus.PROCESSING,
        NotificationStatus.CANCELLED,
      ],
      [NotificationStatus.QUEUED]: [
        NotificationStatus.PROCESSING,
        NotificationStatus.CANCELLED,
      ],
      [NotificationStatus.PROCESSING]: [
        NotificationStatus.SENT,
        NotificationStatus.FAILED,
      ],
      [NotificationStatus.SENT]: [
        NotificationStatus.DELIVERED,
        NotificationStatus.BOUNCED,
      ],
      [NotificationStatus.DELIVERED]: [NotificationStatus.OPENED],
      [NotificationStatus.OPENED]: [NotificationStatus.CLICKED],
      [NotificationStatus.FAILED]: [
        NotificationStatus.PROCESSING, // For retries
        NotificationStatus.EXPIRED,
      ],
      [NotificationStatus.BOUNCED]: [],
      [NotificationStatus.CANCELLED]: [],
      [NotificationStatus.EXPIRED]: [],
      [NotificationStatus.CLICKED]: [],
    };

    const allowedTransitions = validTransitions[currentStatus] || [];
    if (!allowedTransitions.includes(newStatus)) {
      throw new Error(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }

  /**
   * Adds error information to notification metadata
   */
  protected addErrorToMetadata(error: string): void {
    if (!this.metadata) {
      (this.metadata as any) = {};
    }
    (this.metadata as any).lastError = error;
    (this.metadata as any).errorTimestamp = new Date().toISOString();
  }

  /**
   * Gets the notification priority (default implementation)
   */
  abstract getNotificationPriority(): NotificationPriority;

  /**
   * Validates the notification data
   */
  abstract validateNotificationData(): boolean;

  /**
   * Converts the notification to a serializable format
   */
  abstract toSerializableFormat(): Record<string, any>;
}
