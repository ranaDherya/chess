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
