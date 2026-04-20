import { gql } from '@apollo/client';

// ─── Fragments ────────────────────────────────────────────────────────────────

export const USER_FIELDS = gql`
  fragment UserFields on User {
    id email name role phone address latitude longitude organization isActive createdAt
  }
`;

export const LISTING_FIELDS = gql`
  fragment ListingFields on FoodListing {
    id title description category quantity unit expiresAt status address
    latitude longitude imageUrl createdAt distanceKm
    donor { id name organization phone }
  }
`;

export const CLAIM_FIELDS = gql`
  fragment ClaimFields on Claim {
    id status quantity notes scheduledAt pickedUpAt createdAt
    recipient { id name organization phone }
    listing { ...ListingFields }
  }
  ${LISTING_FIELDS}
`;

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user { ...UserFields }
    }
  }
  ${USER_FIELDS}
`;

export const REGISTER = gql`
  mutation Register(
    $email: String! $password: String! $name: String! $role: UserRole!
    $phone: String $address: String $latitude: Float $longitude: Float $organization: String
  ) {
    register(
      email: $email password: $password name: $name role: $role
      phone: $phone address: $address latitude: $latitude longitude: $longitude organization: $organization
    ) {
      token
      user { ...UserFields }
    }
  }
  ${USER_FIELDS}
`;

export const ME = gql`
  query Me {
    me { ...UserFields unreadNotificationCount }
  }
  ${USER_FIELDS}
`;

// ─── Listings ─────────────────────────────────────────────────────────────────

export const GET_LISTINGS = gql`
  query GetListings($status: ListingStatus $category: FoodCategory $strategy: MatchingStrategy $limit: Int $offset: Int) {
    listings(status: $status category: $category strategy: $strategy limit: $limit offset: $offset) {
      listings { ...ListingFields }
      total hasMore
    }
  }
  ${LISTING_FIELDS}
`;

export const GET_LISTING = gql`
  query GetListing($id: ID!) {
    listing(id: $id) {
      ...ListingFields
      claims { ...ClaimFields }
    }
  }
  ${LISTING_FIELDS}
  ${CLAIM_FIELDS}
`;

export const MY_LISTINGS = gql`
  query MyListings {
    myListings {
      ...ListingFields
      claims { id status quantity notes createdAt scheduledAt recipient { id name organization phone } }
    }
  }
  ${LISTING_FIELDS}
`;

export const CREATE_LISTING = gql`
  mutation CreateListing(
    $title: String! $description: String $category: FoodCategory!
    $quantity: Int! $unit: String $expiresAt: String!
    $address: String! $latitude: Float! $longitude: Float! $imageUrl: String
  ) {
    createListing(
      title: $title description: $description category: $category
      quantity: $quantity unit: $unit expiresAt: $expiresAt
      address: $address latitude: $latitude longitude: $longitude imageUrl: $imageUrl
    ) { ...ListingFields }
  }
  ${LISTING_FIELDS}
`;

export const UPDATE_LISTING = gql`
  mutation UpdateListing($id: ID! $title: String $description: String $quantity: Int $status: ListingStatus) {
    updateListing(id: $id title: $title description: $description quantity: $quantity status: $status) {
      ...ListingFields
    }
  }
  ${LISTING_FIELDS}
`;

export const DELETE_LISTING = gql`
  mutation DeleteListing($id: ID!) {
    deleteListing(id: $id)
  }
`;

// ─── Claims ───────────────────────────────────────────────────────────────────

export const MY_CLAIMS = gql`
  query MyClaims {
    myClaims { ...ClaimFields }
  }
  ${CLAIM_FIELDS}
`;

export const CREATE_CLAIM = gql`
  mutation CreateClaim($listingId: ID! $quantity: Int! $notes: String $scheduledAt: String) {
    createClaim(listingId: $listingId quantity: $quantity notes: $notes scheduledAt: $scheduledAt) {
      ...ClaimFields
    }
  }
  ${CLAIM_FIELDS}
`;

export const UPDATE_CLAIM_STATUS = gql`
  mutation UpdateClaimStatus($id: ID! $status: ClaimStatus!) {
    updateClaimStatus(id: $id status: $status) { ...ClaimFields }
  }
  ${CLAIM_FIELDS}
`;

// ─── Notifications ────────────────────────────────────────────────────────────

export const MY_NOTIFICATIONS = gql`
  query MyNotifications($unreadOnly: Boolean) {
    myNotifications(unreadOnly: $unreadOnly) {
      id type message isRead createdAt
      listing { id title }
    }
  }
`;

export const MARK_READ = gql`
  mutation MarkNotificationRead($id: ID!) {
    markNotificationRead(id: $id) { id isRead }
  }
`;

export const MARK_ALL_READ = gql`
  mutation MarkAllNotificationsRead {
    markAllNotificationsRead
  }
`;

// ─── Admin ────────────────────────────────────────────────────────────────────

export const ADMIN_STATS = gql`
  query AdminStats {
    adminStats {
      totalListings activeListings totalClaims completedClaims totalUsers wasteReducedKg
      topDonors { id name organization }
    }
  }
`;

export const ALL_USERS = gql`
  query AllUsers($role: UserRole) {
    allUsers(role: $role) { ...UserFields }
  }
  ${USER_FIELDS}
`;
