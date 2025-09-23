export interface TokenPayload {
  sub: string;
  deviceId?: string;
  username?: string;
  role?: string;
  type: 'device' | 'admin';
  iat?: number;
  exp?: number;
}
