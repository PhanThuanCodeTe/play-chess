export interface JwtPayload {
  sub: string; // user id
  email: string; // user email
  name: string; // user name
  iat?: number; // issued at time
  exp?: number; // expiration time
}