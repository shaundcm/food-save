import bcrypt from 'bcryptjs';
import { UserRole, ListingStatus, ClaimStatus, FoodCategory, Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { generateToken } from '../middleware/auth';
import { UserFactory } from '../patterns/FactoryPattern';
import { MatchingEngine, createMatchingStrategy, ListingLike } from '../patterns/MatchingStrategy';
import { FoodEventBus } from '../patterns/ObserverPattern';
import { cacheGet, cacheSet, cacheDel, cacheDelPattern } from '../config/redis';

interface GQLContext {
  user: { userId: string; email: string; role: UserRole } | null;
}

function requireAuth(ctx: GQLContext) {
  if (!ctx.user) throw new Error('Authentication required');
  return ctx.user;
}

function requireRole(ctx: GQLContext, ...roles: UserRole[]) {
  const user = requireAuth(ctx);
  if (!roles.includes(user.role)) throw new Error('Insufficient permissions');
  return user;
}

export const resolvers = {
  Query: {
    me: async (_: unknown, __: unknown, ctx: GQLContext) => {
      const user = requireAuth(ctx);
      return prisma.user.findUnique({ where: { id: user.userId } });
    },

    listings: async (
      _: unknown,
      args: { status?: ListingStatus; category?: string; strategy?: string; limit?: number; offset?: number },
      ctx: GQLContext
    ) => {
      const { category, strategy = 'composite', limit = 20, offset = 0 } = args;

      // Admins can pass status: undefined to see all listings
      // Non-admin callers default to AVAILABLE only
      const isAdmin = ctx.user?.role === UserRole.ADMIN;
      const status = args.status ?? (isAdmin ? undefined : ListingStatus.AVAILABLE);

      const where: Prisma.FoodListingWhereInput = {};
      if (status) where.status = status;
      if (category) where.category = category as FoodCategory;

      const [all, total] = await Promise.all([
        prisma.foodListing.findMany({
          where,
          include: { donor: true, claims: true },
          take: 1000, // fetch more for sorting
        }),
        prisma.foodListing.count({ where }),
      ]);

      // Apply Strategy Pattern if recipient is logged in
      let sorted: ListingLike[] = all;
      if (ctx.user?.role === UserRole.RECIPIENT) {
        const recipient = await prisma.user.findUnique({ where: { id: ctx.user.userId } });
        if (recipient) {
          const engine = new MatchingEngine(createMatchingStrategy(strategy));
          sorted = engine.execute(recipient, all);
        }
      }

      const paginated = sorted.slice(offset, offset + limit);

      return {
        listings: paginated,
        total,
        hasMore: offset + limit < total,
      };
    },

    listing: async (_: unknown, { id }: { id: string }) => {
      return prisma.foodListing.findUnique({
        where: { id },
        include: { donor: true, claims: { include: { recipient: true } } },
      });
    },

    myListings: async (_: unknown, __: unknown, ctx: GQLContext) => {
      const user = requireAuth(ctx);
      return prisma.foodListing.findMany({
        where: { donorId: user.userId },
        include: { claims: { include: { recipient: true } } },
        orderBy: { createdAt: 'desc' },
      });
    },

    myClaims: async (_: unknown, __: unknown, ctx: GQLContext) => {
      const user = requireAuth(ctx);
      return prisma.claim.findMany({
        where: { recipientId: user.userId },
        include: { listing: { include: { donor: true } }, recipient: true },
        orderBy: { createdAt: 'desc' },
      });
    },

    claim: async (_: unknown, { id }: { id: string }, ctx: GQLContext) => {
      requireAuth(ctx);
      return prisma.claim.findUnique({
        where: { id },
        include: { listing: { include: { donor: true } }, recipient: true },
      });
    },

    myNotifications: async (
      _: unknown,
      { unreadOnly }: { unreadOnly?: boolean },
      ctx: GQLContext
    ) => {
      const user = requireAuth(ctx);
      return prisma.notification.findMany({
        where: {
          userId: user.userId,
          ...(unreadOnly ? { isRead: false } : {}),
        },
        include: { listing: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    },

    unreadCount: async (_: unknown, __: unknown, ctx: GQLContext) => {
      const user = requireAuth(ctx);
      return prisma.notification.count({
        where: { userId: user.userId, isRead: false },
      });
    },

    adminStats: async (_: unknown, __: unknown, ctx: GQLContext) => {
      requireRole(ctx, UserRole.ADMIN);

      const cacheKey = 'admin:stats';
      const cached = await cacheGet<unknown>(cacheKey);
      if (cached) return cached;

      const [totalListings, activeListings, totalClaims, completedClaims, totalUsers, topDonors] =
        await Promise.all([
          prisma.foodListing.count(),
          prisma.foodListing.count({ where: { status: ListingStatus.AVAILABLE } }),
          prisma.claim.count(),
          prisma.claim.count({ where: { status: ClaimStatus.PICKED_UP } }),
          prisma.user.count(),
          prisma.user.findMany({
            where: { role: UserRole.DONOR },
            include: { _count: { select: { foodListings: true } } },
            orderBy: { foodListings: { _count: 'desc' } },
            take: 5,
          }),
        ]);

      const stats = {
        totalListings,
        activeListings,
        totalClaims,
        completedClaims,
        totalUsers,
        wasteReducedKg: completedClaims * 2.5, // avg 2.5kg per claim
        topDonors,
      };

      await cacheSet(cacheKey, stats, 60);
      return stats;
    },

    allUsers: async (_: unknown, { role }: { role?: UserRole }, ctx: GQLContext) => {
      requireRole(ctx, UserRole.ADMIN);
      return prisma.user.findMany({
        where: role ? { role } : undefined,
        orderBy: { createdAt: 'desc' },
      });
    },
  },

  Mutation: {
    register: async (
      _: unknown,
      args: {
        email: string; password: string; name: string; role: UserRole;
        phone?: string; address?: string; latitude?: number; longitude?: number; organization?: string;
      }
    ) => {
      const existing = await prisma.user.findUnique({ where: { email: args.email } });
      if (existing) throw new Error('Email already registered');

      // Factory Pattern — creates user with role-specific validation
      const payload = await UserFactory.create(args.role, args);
      const user = await prisma.user.create({ data: payload });

      const token = generateToken({ userId: user.id, email: user.email, role: user.role });
      return { token, user };
    },

    login: async (_: unknown, { email, password }: { email: string; password: string }) => {
      const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      if (!user || !user.isActive) throw new Error('Invalid credentials');

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) throw new Error('Invalid credentials');

      const token = generateToken({ userId: user.id, email: user.email, role: user.role });
      return { token, user };
    },

    createListing: async (
      _: unknown,
      args: {
        title: string; description?: string; category: string; quantity: number;
        unit?: string; expiresAt: string; address: string; latitude: number; longitude: number; imageUrl?: string;
      },
      ctx: GQLContext
    ) => {
      const user = requireRole(ctx, UserRole.DONOR, UserRole.ADMIN);

      const listing = await prisma.foodListing.create({
        data: {
          title: args.title,
          description: args.description,
          category: args.category as FoodCategory,
          quantity: args.quantity,
          unit: args.unit || 'portions',
          expiresAt: new Date(args.expiresAt),
          address: args.address,
          latitude: args.latitude,
          longitude: args.longitude,
          imageUrl: args.imageUrl,
          donorId: user.userId,
        },
        include: { donor: true },
      });

      // Observer Pattern — notify all recipients
      await FoodEventBus.getInstance().notify({
        eventType: 'LISTING_CREATED',
        listingId: listing.id,
        listingTitle: listing.title,
        donorId: user.userId,
      });

      await cacheDelPattern('listings:*');
      await cacheDel('admin:stats');

      return listing;
    },

    updateListing: async (
      _: unknown,
      args: { id: string; title?: string; description?: string; quantity?: number; status?: ListingStatus },
      ctx: GQLContext
    ) => {
      const user = requireAuth(ctx);

      const listing = await prisma.foodListing.findUnique({ where: { id: args.id } });
      if (!listing) throw new Error('Listing not found');
      if (listing.donorId !== user.userId && user.role !== UserRole.ADMIN) {
        throw new Error('Not authorized');
      }

      // Build update payload with only defined fields
      const data: {
        title?: string;
        description?: string;
        quantity?: number;
        status?: ListingStatus;
      } = {};
      if (args.title       !== undefined) data.title       = args.title;
      if (args.description !== undefined) data.description = args.description;
      if (args.quantity    !== undefined) data.quantity    = args.quantity;
      if (args.status      !== undefined) data.status      = args.status;

      return prisma.foodListing.update({
        where: { id: args.id },
        data,
        include: { donor: true },
      });
    },

    deleteListing: async (_: unknown, { id }: { id: string }, ctx: GQLContext) => {
      const user = requireAuth(ctx);
      const listing = await prisma.foodListing.findUnique({ where: { id } });
      if (!listing) throw new Error('Listing not found');
      if (listing.donorId !== user.userId && user.role !== UserRole.ADMIN) {
        throw new Error('Not authorized');
      }
      await prisma.foodListing.delete({ where: { id } });
      return true;
    },

    createClaim: async (
      _: unknown,
      args: { listingId: string; quantity: number; notes?: string; scheduledAt?: string },
      ctx: GQLContext
    ) => {
      const user = requireRole(ctx, UserRole.RECIPIENT);

      const listing = await prisma.foodListing.findUnique({ where: { id: args.listingId } });
      if (!listing) throw new Error('Listing not found');
      if (listing.status !== ListingStatus.AVAILABLE) throw new Error('Listing is not available');
      if (args.quantity > listing.quantity) throw new Error('Requested quantity exceeds available');

      const claim = await prisma.claim.create({
        data: {
          listingId: args.listingId,
          recipientId: user.userId,
          quantity: args.quantity,
          notes: args.notes,
          scheduledAt: args.scheduledAt ? new Date(args.scheduledAt) : undefined,
        },
        include: { listing: { include: { donor: true } }, recipient: true },
      });

      // Update listing status
      await prisma.foodListing.update({
        where: { id: args.listingId },
        data: { status: ListingStatus.CLAIMED },
      });

      // Observer Pattern
      await FoodEventBus.getInstance().notify({
        eventType: 'LISTING_CLAIMED',
        listingId: listing.id,
        listingTitle: listing.title,
        donorId: listing.donorId,
        recipientId: user.userId,
        claimId: claim.id,
      });

      await cacheDel('admin:stats');
      return claim;
    },

    updateClaimStatus: async (
      _: unknown,
      { id, status }: { id: string; status: ClaimStatus },
      ctx: GQLContext
    ) => {
      const user = requireAuth(ctx);
      const claim = await prisma.claim.findUnique({
        where: { id },
        include: { listing: true },
      });
      if (!claim) throw new Error('Claim not found');

      const isRecipient = claim.recipientId === user.userId;
      const isDonor = claim.listing.donorId === user.userId;
      const isAdmin = user.role === UserRole.ADMIN;

      if (!isRecipient && !isDonor && !isAdmin) throw new Error('Not authorized');

      const claimData: { status: ClaimStatus; pickedUpAt?: Date } = { status };
      if (status === ClaimStatus.PICKED_UP) {
        claimData.pickedUpAt = new Date();
        // Mark listing completed
        await prisma.foodListing.update({
          where: { id: claim.listingId },
          data: { status: ListingStatus.COMPLETED },
        });
      }
      if (status === ClaimStatus.CANCELLED) {
        await prisma.foodListing.update({
          where: { id: claim.listingId },
          data: { status: ListingStatus.AVAILABLE },
        });
        await FoodEventBus.getInstance().notify({
          eventType: 'CLAIM_CANCELLED',
          listingId: claim.listingId,
          listingTitle: claim.listing.title,
          donorId: claim.listing.donorId,
        });
      }
      if (status === ClaimStatus.CONFIRMED) {
        await FoodEventBus.getInstance().notify({
          eventType: 'CLAIM_CONFIRMED',
          listingId: claim.listingId,
          listingTitle: claim.listing.title,
          recipientId: claim.recipientId,
        });
      }

      await cacheDel('admin:stats');

      // Persist the status change to the claim record
      await prisma.claim.update({
        where: { id },
        data: claimData,
      });

      return prisma.claim.findUnique({
        where: { id },
        include: { listing: { include: { donor: true } }, recipient: true },
      });
    },

    markNotificationRead: async (_: unknown, { id }: { id: string }, ctx: GQLContext) => {
      const user = requireAuth(ctx);
      const notif = await prisma.notification.findUnique({ where: { id } });
      if (!notif || notif.userId !== user.userId) throw new Error('Not found');

      return prisma.notification.update({
        where: { id },
        data: { isRead: true },
        include: { listing: true },
      });
    },

    markAllNotificationsRead: async (_: unknown, __: unknown, ctx: GQLContext) => {
      const user = requireAuth(ctx);
      await prisma.notification.updateMany({
        where: { userId: user.userId, isRead: false },
        data: { isRead: true },
      });
      return true;
    },
  },

  // Field resolvers
  FoodListing: {
    donor: (parent: { donor?: unknown; donorId: string }) => {
      if (parent.donor) return parent.donor;
      return prisma.user.findUnique({ where: { id: parent.donorId } });
    },
  },

  User: {
    unreadNotificationCount: (parent: { id: string }) => {
      return prisma.notification.count({
        where: { userId: parent.id, isRead: false },
      });
    },
  },
};
