import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import prisma from '@/lib/prisma';
import bcrypt from "bcryptjs";

import { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "admin" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.username || !credentials?.password) return null;

        let user = await prisma.user.findUnique({
          where: { username: credentials.username }
        });

        if (!user && credentials.username === 'admin') {
          const userCount = await prisma.user.count();
          if (userCount === 0) {
            const passwordHash = await bcrypt.hash('admin123', 10);
            user = await prisma.user.create({
              data: {
                username: 'admin',
                passwordHash,
                name: 'PhilHealth Administrator',
                role: 'Clinic Admin',
              }
            });
          }
        }

        if (!user) return null;

        const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);
        
        if (!isPasswordValid) return null;

        return { 
          id: user.id, 
          name: user.name, 
          email: user.email ?? user.username,
          role: user.role 
        };
      }
    })
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    }
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
