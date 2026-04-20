export const typeDefs = `#graphql

  # ─── Enums ────────────────────────────────────────────────────────────────

  enum UserRole {
    DONOR
    RECIPIENT
    ADMIN
  }

  enum FoodCategory {
    COOKED_MEAL
    RAW_PRODUCE
    PACKAGED_FOOD
    BAKERY
    DAIRY
    BEVERAGES
    OTHER
  }

  enum ListingStatus {
    AVAILABLE
    CLAIMED
    COMPLETED
    EXPIRED
    CANCELLED
  }

  enum ClaimStatus {
    PENDING
    CONFIRMED
    PICKED_UP
    CANCELLED
  }

  enum MatchingStrategy {
    proximity
    urgency
    quantity
    composite
  }

  # ─── Types ────────────────────────────────────────────────────────────────

  type User {
    id: ID!
    email: String!
    name: String!
    role: UserRole!
    phone: String
    address: String
    latitude: Float
    longitude: Float
    organization: String
    isActive: Boolean!
    createdAt: String!
    foodListings: [FoodListing!]
    claims: [Claim!]
    unreadNotificationCount: Int
  }

  type FoodListing {
    id: ID!
    title: String!
    description: String
    category: FoodCategory!
    quantity: Int!
    unit: String!
    expiresAt: String!
    status: ListingStatus!
    address: String!
    latitude: Float!
    longitude: Float!
    imageUrl: String
    createdAt: String!
    donor: User!
    claims: [Claim!]
    distanceKm: Float
  }

  type Claim {
    id: ID!
    status: ClaimStatus!
    quantity: Int!
    notes: String
    scheduledAt: String
    pickedUpAt: String
    createdAt: String!
    listing: FoodListing!
    recipient: User!
  }

  type Notification {
    id: ID!
    type: String!
    message: String!
    isRead: Boolean!
    createdAt: String!
    listing: FoodListing
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type DashboardStats {
    totalListings: Int!
    activeListings: Int!
    totalClaims: Int!
    completedClaims: Int!
    totalUsers: Int!
    wasteReducedKg: Float!
    topDonors: [User!]!
  }

  type PaginatedListings {
    listings: [FoodListing!]!
    total: Int!
    hasMore: Boolean!
  }

  # ─── Queries ──────────────────────────────────────────────────────────────

  type Query {
    # Auth
    me: User

    # Listings
    listings(
      status: ListingStatus
      category: FoodCategory
      strategy: MatchingStrategy
      limit: Int
      offset: Int
    ): PaginatedListings!

    listing(id: ID!): FoodListing

    myListings: [FoodListing!]!

    # Claims
    myClaims: [Claim!]!
    claim(id: ID!): Claim

    # Notifications
    myNotifications(unreadOnly: Boolean): [Notification!]!
    unreadCount: Int!

    # Admin
    adminStats: DashboardStats!
    allUsers(role: UserRole): [User!]!
  }

  # ─── Mutations ────────────────────────────────────────────────────────────

  type Mutation {
    # Auth
    register(
      email: String!
      password: String!
      name: String!
      role: UserRole!
      phone: String
      address: String
      latitude: Float
      longitude: Float
      organization: String
    ): AuthPayload!

    login(email: String!, password: String!): AuthPayload!

    # Listings
    createListing(
      title: String!
      description: String
      category: FoodCategory!
      quantity: Int!
      unit: String
      expiresAt: String!
      address: String!
      latitude: Float!
      longitude: Float!
      imageUrl: String
    ): FoodListing!

    updateListing(
      id: ID!
      title: String
      description: String
      quantity: Int
      status: ListingStatus
    ): FoodListing!

    deleteListing(id: ID!): Boolean!

    # Claims
    createClaim(
      listingId: ID!
      quantity: Int!
      notes: String
      scheduledAt: String
    ): Claim!

    updateClaimStatus(id: ID!, status: ClaimStatus!): Claim!

    # Notifications
    markNotificationRead(id: ID!): Notification!
    markAllNotificationsRead: Boolean!
  }
`;
