import { SignJWT, jwtVerify } from 'jose';

// Use an environment variable for the secret in production
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_fallback_key_xyz_12345';
const secretKey = new TextEncoder().encode(JWT_SECRET);

export interface JWTPayload {
  id: string;
  emp_id: string;
  name: string;
  email: string;
  role: string;
  [key: string]: any;
}

export async function signJWT(payload: JWTPayload, expiresIn: string = '24h') {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secretKey);
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload as JWTPayload;
  } catch (error) {
    console.error('JWT Verification failed:', error);
    return null;
  }
}
