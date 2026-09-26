// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { clientPromise } from "@/lib/mongodb";
import { compare } from "bcryptjs";
import { User } from "@/types/user";

// Export authOptions separately so getServerSession() can consume it.
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const { email, password } = credentials;
        const db = await clientPromise;
        const users = db.collection("users");
        const user = await users.findOne({ email: email.toLowerCase() });
        if (!user) return null;
        const isValid = await compare(password, user.passwordHash as string);
        if (!isValid) return null;
        return {
          id: user._id.toString(),
          name: user.name as string,
          email: user.email as string,
          role: user.role as string,
        };
      },
    }),
    // OAuth providers can be enabled here when GITHUB_ID/GOOGLE_ID env vars are set:
    // GithubProvider({ clientId: process.env.GITHUB_ID!, clientSecret: process.env.GITHUB_SECRET! }),
    // GoogleProvider({ clientId: process.env.GOOGLE_ID!, clientSecret: process.env.GOOGLE_SECRET! }),
  ],
  // adapter removed: MongoDBAdapter is incompatible with CredentialsProvider + strategy:"jwt"
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.role) {
        session.user.role = token.role as string;
      }
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = ((user as unknown) as User).role;
      }
      return token;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
