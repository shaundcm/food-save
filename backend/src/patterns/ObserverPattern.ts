/**
 * OBSERVER PATTERN — Notification System
 *
 * Defines a one-to-many dependency between objects so that when
 * one object (Subject) changes state, all dependents (Observers)
 * are notified and updated automatically.
 *
 * Subject: FoodEventBus (Singleton)
 * Observers: DatabaseNotificationObserver, LoggingObserver
 */

import { UserRole } from '@prisma/client';
import { prisma } from '../config/database';
import { logger } from '../config/logger';

// ─── Event Types ──────────────────────────────────────────────────────────────

export type FoodEvent =
  | 'LISTING_CREATED'
  | 'LISTING_CLAIMED'
  | 'LISTING_COMPLETED'
  | 'LISTING_EXPIRED'
  | 'CLAIM_CONFIRMED'
  | 'CLAIM_CANCELLED';

export interface FoodEventPayload {
  eventType: FoodEvent;
  listingId?: string;
  listingTitle?: string;
  donorId?: string;
  recipientId?: string;
  claimId?: string;
  metadata?: Record<string, unknown>;
}

// ─── Observer Interface ───────────────────────────────────────────────────────

export interface FoodEventObserver {
  observerId: string;
  update(payload: FoodEventPayload): Promise<void>;
}

// ─── Subject Interface ────────────────────────────────────────────────────────

export interface FoodEventSubject {
  subscribe(observer: FoodEventObserver): void;
  unsubscribe(observerId: string): void;
  notify(payload: FoodEventPayload): Promise<void>;
}

// ─── Concrete Subject (Singleton) ─────────────────────────────────────────────

export class FoodEventBus implements FoodEventSubject {
  private static instance: FoodEventBus;
  private observers: Map<string, FoodEventObserver> = new Map();

  private constructor() {}

  static getInstance(): FoodEventBus {
    if (!FoodEventBus.instance) {
      FoodEventBus.instance = new FoodEventBus();
    }
    return FoodEventBus.instance;
  }

  subscribe(observer: FoodEventObserver): void {
    this.observers.set(observer.observerId, observer);
    logger.debug(`Observer subscribed: ${observer.observerId}`);
  }

  unsubscribe(observerId: string): void {
    this.observers.delete(observerId);
    logger.debug(`Observer unsubscribed: ${observerId}`);
  }

  async notify(payload: FoodEventPayload): Promise<void> {
    logger.debug(`Event fired: ${payload.eventType}`, { payload });
    const promises = Array.from(this.observers.values()).map((obs) =>
      obs.update(payload).catch((err) =>
        logger.error(`Observer ${obs.observerId} failed`, { err })
      )
    );
    await Promise.all(promises);
  }
}

// ─── Concrete Observer 1: Database Notifications ──────────────────────────────

export class DatabaseNotificationObserver implements FoodEventObserver {
  observerId = 'database-notification-observer';

  async update(payload: FoodEventPayload): Promise<void> {
    const { eventType, listingId, recipientId, donorId, listingTitle } = payload;

    // Prisma expects string | null | undefined — convert undefined to null
    const safeListingId = listingId ?? null;
    const title = listingTitle ?? 'Unknown listing';

    switch (eventType) {
      case 'LISTING_CREATED': {
        // Use the UserRole enum — not a raw string literal
        const recipients = await prisma.user.findMany({
          where: { role: UserRole.RECIPIENT, isActive: true },
        });

        if (recipients.length === 0) break;

        await prisma.notification.createMany({
          data: recipients.map((r) => ({
            userId: r.id,
            listingId: safeListingId,
            type: 'NEW_LISTING',
            message: `New food available near you: ${title}`,
            isRead: false,
          })),
        });
        break;
      }

      case 'LISTING_CLAIMED': {
        if (!donorId) break;
        await prisma.notification.create({
          data: {
            userId: donorId,
            listingId: safeListingId,
            type: 'LISTING_CLAIMED',
            message: `Your listing "${title}" has been claimed!`,
            isRead: false,
          },
        });
        break;
      }

      case 'CLAIM_CONFIRMED': {
        if (!recipientId) break;
        await prisma.notification.create({
          data: {
            userId: recipientId,
            listingId: safeListingId,
            type: 'CLAIM_CONFIRMED',
            message: `Your claim for "${title}" has been confirmed. Please pick up on time.`,
            isRead: false,
          },
        });
        break;
      }

      case 'LISTING_EXPIRED': {
        if (!donorId) break;
        await prisma.notification.create({
          data: {
            userId: donorId,
            listingId: safeListingId,
            type: 'LISTING_EXPIRED',
            message: `Your listing "${title}" has expired without being claimed.`,
            isRead: false,
          },
        });
        break;
      }

      case 'CLAIM_CANCELLED': {
        if (!donorId) break;
        await prisma.notification.create({
          data: {
            userId: donorId,
            listingId: safeListingId,
            type: 'CLAIM_CANCELLED',
            message: `A claim for "${title}" was cancelled. The listing is available again.`,
            isRead: false,
          },
        });
        break;
      }

      default:
        break;
    }
  }
}

// ─── Concrete Observer 2: Logging ────────────────────────────────────────────

export class LoggingObserver implements FoodEventObserver {
  observerId = 'logging-observer';

  async update(payload: FoodEventPayload): Promise<void> {
    logger.info(`[EVENT] ${payload.eventType}`, {
      listingId: payload.listingId,
      donorId: payload.donorId,
      recipientId: payload.recipientId,
    });
  }
}

// ─── Bootstrap: register all observers ───────────────────────────────────────

export function initEventBus(): FoodEventBus {
  const bus = FoodEventBus.getInstance();
  bus.subscribe(new DatabaseNotificationObserver());
  bus.subscribe(new LoggingObserver());
  return bus;
}
