// src/types/next-auth.d.ts
// Augments NextAuth types to include the custom fields added by the JWT/session callbacks.
// This resolves TS2339 errors for session.user.id and session.user.role project-wide.

import NextAuth, { DefaultSession, DefaultUser } from 'next-auth';
import { JWT, DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    role: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id?: string;
    role?: string;
  }
}
