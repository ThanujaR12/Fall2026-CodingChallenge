// Confirms a "Sign in with Google" credential with Google before we trust who it says it is.
import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

const client = new OAuth2Client();

export type GoogleProfile = { googleId: string; email: string; name: string };

export async function verifyGoogleCredential(credential: string): Promise<GoogleProfile> {
  if (!env.GOOGLE_CLIENT_ID) {
    throw new AppError(
      503,
      'GOOGLE_SIGN_IN_DISABLED',
      'Google sign-in is not set up on this server.',
    );
  }

  const failed = () =>
    new AppError(401, 'GOOGLE_SIGN_IN_FAILED', "Google sign-in didn't work. Please try again.");

  try {
    // Checks Google's signature, expiry, and that the credential was issued for this app.
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email || !payload.email_verified) throw failed();
    return { googleId: payload.sub, email: payload.email.toLowerCase(), name: payload.name ?? '' };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw failed();
  }
}
