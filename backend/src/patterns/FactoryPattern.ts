/**
 * FACTORY PATTERN — User Factory
 *
 * Defines an interface for creating objects but lets subclasses
 * decide which classes to instantiate.
 */

import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import { z, ZodTypeAny } from 'zod';

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface CreateUserDTO {
  email: string;
  password: string;
  name: string;
  phone?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  organization?: string;
}

export interface UserCreatePayload {
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  phone?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  organization?: string;
  isActive: boolean;
}

// ─── Base validation schema ───────────────────────────────────────────────────

const baseUserSchema = z.object({
  email:        z.string().email('Invalid email address'),
  password:     z.string().min(8, 'Password must be at least 8 characters'),
  name:         z.string().min(2, 'Name must be at least 2 characters'),
  phone:        z.string().optional(),
  address:      z.string().optional(),
  latitude:     z.number().optional(),
  longitude:    z.number().optional(),
  organization: z.string().optional(),
});

// ─── Abstract Creator ─────────────────────────────────────────────────────────

abstract class UserCreator {
  abstract readonly role: UserRole;
  abstract readonly validationSchema: ZodTypeAny;

  async create(dto: CreateUserDTO): Promise<UserCreatePayload> {
    this.validationSchema.parse(dto);
    const passwordHash = await bcrypt.hash(dto.password, 12);
    return {
      email:        dto.email.toLowerCase().trim(),
      passwordHash,
      name:         dto.name.trim(),
      role:         this.role,
      phone:        dto.phone,
      address:      dto.address,
      latitude:     dto.latitude,
      longitude:    dto.longitude,
      organization: dto.organization,
      isActive:     true,
    };
  }
}

// ─── Concrete Creator 1: Donor ────────────────────────────────────────────────

class DonorUserCreator extends UserCreator {
  readonly role = UserRole.DONOR;
  readonly validationSchema = baseUserSchema.extend({
    organization: z.string().min(2, 'Organization name required for donors'),
    address:      z.string().min(5, 'Address required for donors'),
  });
}

// ─── Concrete Creator 2: Recipient ───────────────────────────────────────────

class RecipientUserCreator extends UserCreator {
  readonly role = UserRole.RECIPIENT;
  readonly validationSchema = baseUserSchema.extend({
    address: z.string().min(5, 'Address required for recipients'),
  });
}

// ─── Concrete Creator 3: Admin ────────────────────────────────────────────────

class AdminUserCreator extends UserCreator {
  readonly role = UserRole.ADMIN;
  readonly validationSchema = baseUserSchema;
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export class UserFactory {
  // Explicitly type the Map as <UserRole, UserCreator> to avoid inference issues
  private static readonly creators: Map<UserRole, UserCreator> = new Map<UserRole, UserCreator>([
    [UserRole.DONOR,     new DonorUserCreator()],
    [UserRole.RECIPIENT, new RecipientUserCreator()],
    [UserRole.ADMIN,     new AdminUserCreator()],
  ]);

  static async create(role: UserRole, dto: CreateUserDTO): Promise<UserCreatePayload> {
    const creator = this.creators.get(role);
    if (!creator) throw new Error(`Unknown user role: ${role}`);
    return creator.create(dto);
  }

  static getSupportedRoles(): UserRole[] {
    return Array.from(this.creators.keys());
  }
}
