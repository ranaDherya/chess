// Decode JWT
export interface UserJwtClaims {
  userId: string;
  name: string;
  isGuest?: boolean;
}

// User Details
export interface UserDetails {
  id: string;
  token?: string;
  name: string;
  isGuest?: boolean;
}

// Move table DB
export type DbMove = {
  from: string;
  to: string;
  before: string;
  after: string;
  san: string;
  comments?: string | null;
};
