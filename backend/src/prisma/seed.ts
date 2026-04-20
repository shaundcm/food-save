import { PrismaClient, UserRole, FoodCategory, ListingStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Idempotent: skip if data already exists
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    console.log('✅ Database already seeded, skipping.');
    return;
  }

  console.log('🌱 Seeding database...');

  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@foodsave.com',
      passwordHash,
      name: 'Admin User',
      role: UserRole.ADMIN,
      organization: 'FoodSave Platform',
      isActive: true,
    },
  });

  const donor1 = await prisma.user.create({
    data: {
      email: 'restaurant@example.com',
      passwordHash,
      name: 'Green Garden Restaurant',
      role: UserRole.DONOR,
      phone: '+91-9876543210',
      address: '123 Anna Salai, Chennai',
      latitude: 13.0827,
      longitude: 80.2707,
      organization: 'Green Garden Pvt Ltd',
      isActive: true,
    },
  });

  const donor2 = await prisma.user.create({
    data: {
      email: 'bakery@example.com',
      passwordHash,
      name: 'Daily Bread Bakery',
      role: UserRole.DONOR,
      phone: '+91-9876543211',
      address: '45 Mount Road, Chennai',
      latitude: 13.0569,
      longitude: 80.2425,
      organization: 'Daily Bread',
      isActive: true,
    },
  });

  const recipient1 = await prisma.user.create({
    data: {
      email: 'ngo@example.com',
      passwordHash,
      name: 'Hope Foundation NGO',
      role: UserRole.RECIPIENT,
      phone: '+91-9876543212',
      address: '78 T Nagar, Chennai',
      latitude: 13.0418,
      longitude: 80.2341,
      organization: 'Hope Foundation',
      isActive: true,
    },
  });

  const recipient2 = await prisma.user.create({
    data: {
      email: 'shelter@example.com',
      passwordHash,
      name: 'Chennai Shelter Home',
      role: UserRole.RECIPIENT,
      phone: '+91-9876543213',
      address: '90 Adyar, Chennai',
      latitude: 13.0002,
      longitude: 80.2565,
      organization: 'Chennai Shelter',
      isActive: true,
    },
  });

  const listing1 = await prisma.foodListing.create({
    data: {
      title: 'Fresh Biryani - 50 Portions',
      description: 'Leftover from lunch service. Hygienic, freshly cooked chicken biryani.',
      category: FoodCategory.COOKED_MEAL,
      quantity: 50,
      unit: 'portions',
      expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
      status: ListingStatus.AVAILABLE,
      address: '123 Anna Salai, Chennai',
      latitude: 13.0827,
      longitude: 80.2707,
      donorId: donor1.id,
    },
  });

  const listing2 = await prisma.foodListing.create({
    data: {
      title: 'Assorted Bread Loaves',
      description: 'End-of-day bread, still fresh. Mix of white and whole wheat.',
      category: FoodCategory.BAKERY,
      quantity: 30,
      unit: 'loaves',
      expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
      status: ListingStatus.AVAILABLE,
      address: '45 Mount Road, Chennai',
      latitude: 13.0569,
      longitude: 80.2425,
      donorId: donor2.id,
    },
  });

  const listing3 = await prisma.foodListing.create({
    data: {
      title: 'Vegetable Curry - 40 Portions',
      description: 'Mixed veg curry, perfect for dinner distribution.',
      category: FoodCategory.COOKED_MEAL,
      quantity: 40,
      unit: 'portions',
      expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
      status: ListingStatus.CLAIMED,
      address: '123 Anna Salai, Chennai',
      latitude: 13.0827,
      longitude: 80.2707,
      donorId: donor1.id,
    },
  });

  await prisma.claim.create({
    data: {
      listingId: listing3.id,
      recipientId: recipient1.id,
      status: 'CONFIRMED',
      quantity: 40,
      notes: 'Will pick up by 7 PM',
      scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: recipient1.id,
        listingId: listing1.id,
        type: 'NEW_LISTING',
        message: 'New food available near you: Fresh Biryani - 50 Portions',
        isRead: false,
      },
      {
        userId: recipient2.id,
        listingId: listing2.id,
        type: 'NEW_LISTING',
        message: 'New food available near you: Assorted Bread Loaves',
        isRead: false,
      },
    ],
  });

  console.log('✅ Seed complete!');
  console.log('\n📋 Test Accounts (password: password123):');
  console.log('  Admin:     admin@foodsave.com');
  console.log('  Donor:     restaurant@example.com');
  console.log('  Donor:     bakery@example.com');
  console.log('  Recipient: ngo@example.com');
  console.log('  Recipient: shelter@example.com');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
