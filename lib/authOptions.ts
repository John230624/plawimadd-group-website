import type { Session, User } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

import prisma from '@/lib/prisma';
import type { UserRole } from '@/lib/types';

interface CustomUser extends User {
  id: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}

interface CustomJWT extends JWT {
  id: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text', placeholder: 'jsmith@example.com' },
        password: { label: 'Password', type: 'password', placeholder: '********' },
      },
      async authorize(credentials): Promise<CustomUser | null> {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email.toLowerCase() },
          });

          if (!user?.password) return null;

          const isPasswordCorrect = await bcrypt.compare(credentials.password, user.password);
          if (!isPasswordCorrect) return null;

          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
            role: (user.role as UserRole) || 'USER',
            firstName: user.firstName ?? '',
            lastName: user.lastName ?? '',
          };
        } catch (error) {
          console.error('[NextAuth] Credentials authorize failed:', error);
          return null;
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' && profile && user.email) {
        const email = user.email.toLowerCase();
        const existingUser = await prisma.user.findUnique({ where: { email } });

        if (!existingUser) {
          const hashedPassword = await bcrypt.hash(uuidv4(), 10);

          await prisma.user.create({
            data: {
              email,
              password: hashedPassword,
              firstName: user.name?.split(' ')[0] ?? '',
              lastName: user.name?.split(' ')[1] ?? '',
              role: 'USER',
              image: (profile as { picture?: string }).picture ?? '/default-profile.png',
            },
          });
        } else {
          const newPicture = (profile as { picture?: string }).picture;
          if (newPicture && newPicture !== existingUser.image) {
            await prisma.user.update({
              where: { email },
              data: { image: newPicture },
            });
          }
        }
      }

      return true;
    },
    async jwt({ token, user }): Promise<CustomJWT> {
      if (user) {
        const email = user.email?.toLowerCase();
        let dbUser = null;

        if (email) {
          try {
            dbUser = await prisma.user.findUnique({
              where: { email },
              select: { id: true, role: true, firstName: true, lastName: true, email: true },
            });
          } catch (error) {
            console.error('[NextAuth] Error fetching user in jwt callback:', error);
          }
        }

        if (dbUser) {
          token.id = dbUser.id;
          token.role = (dbUser.role as UserRole) || 'USER';
          token.firstName = dbUser.firstName ?? '';
          token.lastName = dbUser.lastName ?? '';
          token.name = `${dbUser.firstName ?? ''} ${dbUser.lastName ?? ''}`.trim() || dbUser.email;
          token.email = dbUser.email;
        } else {
          const nextUser = user as CustomUser;
          token.id = nextUser.id;
          token.role = nextUser.role || 'USER';
          token.firstName = nextUser.firstName ?? '';
          token.lastName = nextUser.lastName ?? '';
          token.name = nextUser.name ?? '';
          token.email = nextUser.email ?? '';
        }
      }

      return token as CustomJWT;
    },
    async session({ session, token }): Promise<Session> {
      const nextToken = token as CustomJWT;

      try {
        let dbUser = null;
        if (nextToken.id) {
          dbUser = await prisma.user.findUnique({
            where: { id: nextToken.id },
            select: { id: true, role: true, banned: true, firstName: true, lastName: true, email: true },
          });
        }

        // Fallback: si dbUser non trouvé via id, essayer par email (cas des tokens Google créés précédemment)
        if (!dbUser && nextToken.email) {
          dbUser = await prisma.user.findUnique({
            where: { email: nextToken.email.toLowerCase() },
            select: { id: true, role: true, banned: true, firstName: true, lastName: true, email: true },
          });
          if (dbUser) {
            nextToken.id = dbUser.id;
          }
        }

        if (!dbUser || dbUser.banned) {
          return {
            ...session,
            user: undefined as unknown as CustomUser,
            expires: new Date(0).toISOString(),
          };
        }

        if (session.user) {
          session.user.id = dbUser.id;
          session.user.role = (dbUser.role as UserRole) || 'USER';
          session.user.firstName = dbUser.firstName ?? '';
          session.user.lastName = dbUser.lastName ?? '';
          session.user.name = `${dbUser.firstName ?? ''} ${dbUser.lastName ?? ''}`.trim() || dbUser.email;
          session.user.email = dbUser.email;
        }
      } catch (error) {
        console.error('[NextAuth] Error verifying session with database:', error);
        if (session.user) {
          session.user.id = nextToken.id;
          session.user.role = nextToken.role;
          session.user.firstName = nextToken.firstName;
          session.user.lastName = nextToken.lastName;
          session.user.name = nextToken.name;
          session.user.email = nextToken.email;
        }
      }

      return session;
    },
    async redirect({ url, baseUrl }) {
      try {
        if (url.startsWith(baseUrl)) return url;
        if (url.startsWith('/')) return `${baseUrl}${url}`;
        return baseUrl;
      } catch (error) {
        console.error('Erreur dans redirect callback:', error);
        return baseUrl;
      }
    },
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
