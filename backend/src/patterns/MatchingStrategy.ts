/**
 * STRATEGY PATTERN — Food Matching Algorithm
 *
 * Defines a family of matching algorithms, encapsulates each one,
 * and makes them interchangeable at runtime.
 */

import { FoodListing, User } from '@prisma/client';

// ─── Prisma includes donor + claims on listings fetched in resolvers.
// We use a generic type so the strategy works with both plain FoodListing
// and any extended payload (with relations) that Prisma returns.
// ─────────────────────────────────────────────────────────────────────

export type ListingLike = FoodListing & Record<string, unknown>;

// ─── Strategy Interface ───────────────────────────────────────────────────────

export interface MatchingStrategy {
  name: string;
  match(recipient: User, listings: ListingLike[]): ListingLike[];
}

// ─── Helper: Haversine distance (km) ─────────────────────────────────────────

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Concrete Strategy 1: Proximity-Based ────────────────────────────────────

export class ProximityMatchingStrategy implements MatchingStrategy {
  name = 'proximity';

  match(recipient: User, listings: ListingLike[]): ListingLike[] {
    if (!recipient.latitude || !recipient.longitude) return listings;
    return [...listings].sort((a, b) => {
      const dA = haversine(recipient.latitude!, recipient.longitude!, a.latitude, a.longitude);
      const dB = haversine(recipient.latitude!, recipient.longitude!, b.latitude, b.longitude);
      return dA - dB;
    });
  }
}

// ─── Concrete Strategy 2: Urgency-Based ──────────────────────────────────────

export class UrgencyMatchingStrategy implements MatchingStrategy {
  name = 'urgency';

  match(_recipient: User, listings: ListingLike[]): ListingLike[] {
    return [...listings].sort(
      (a, b) => a.expiresAt.getTime() - b.expiresAt.getTime()
    );
  }
}

// ─── Concrete Strategy 3: Quantity-Based ─────────────────────────────────────

export class QuantityMatchingStrategy implements MatchingStrategy {
  name = 'quantity';

  match(_recipient: User, listings: ListingLike[]): ListingLike[] {
    return [...listings].sort((a, b) => b.quantity - a.quantity);
  }
}

// ─── Concrete Strategy 4: Composite Scoring ──────────────────────────────────

export class CompositeMatchingStrategy implements MatchingStrategy {
  name = 'composite';

  private score(recipient: User, listing: ListingLike): number {
    const now = Date.now();
    const expiresIn = listing.expiresAt.getTime() - now;
    const urgencyScore = Math.max(0, 1 - expiresIn / (24 * 60 * 60 * 1000));

    let proximityScore = 0.5;
    if (recipient.latitude && recipient.longitude) {
      const dist = haversine(recipient.latitude, recipient.longitude, listing.latitude, listing.longitude);
      proximityScore = Math.max(0, 1 - dist / 20);
    }

    const quantityScore = Math.min(1, listing.quantity / 100);
    // Weights: urgency 40%, proximity 40%, quantity 20%
    return urgencyScore * 0.4 + proximityScore * 0.4 + quantityScore * 0.2;
  }

  match(recipient: User, listings: ListingLike[]): ListingLike[] {
    return [...listings].sort((a, b) => this.score(recipient, b) - this.score(recipient, a));
  }
}

// ─── Context: Matching Engine ─────────────────────────────────────────────────

export class MatchingEngine {
  private strategy: MatchingStrategy;

  constructor(strategy: MatchingStrategy = new CompositeMatchingStrategy()) {
    this.strategy = strategy;
  }

  setStrategy(strategy: MatchingStrategy): void {
    this.strategy = strategy;
  }

  getStrategyName(): string {
    return this.strategy.name;
  }

  execute(recipient: User, listings: ListingLike[]): ListingLike[] {
    return this.strategy.match(recipient, listings);
  }
}

// ─── Factory for strategies ───────────────────────────────────────────────────

export function createMatchingStrategy(type: string): MatchingStrategy {
  switch (type) {
    case 'proximity': return new ProximityMatchingStrategy();
    case 'urgency':   return new UrgencyMatchingStrategy();
    case 'quantity':  return new QuantityMatchingStrategy();
    default:          return new CompositeMatchingStrategy();
  }
}
