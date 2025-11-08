//app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions, User, Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { JWT } from "next-auth/jwt";
import { PrismaClient } from "@prisma/client";
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from "@prisma/client/runtime/library";
import type { UserRole } from "@/lib/types";

// --- Prisma Singleton ---
declare global {
  var prismaGlobal: PrismaClient | undefined;
}

const prisma =
  global.prismaGlobal ||
  new PrismaClient({
    // log: ["query", "info", "warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prismaGlobal = prisma;
}

// --- Typage étendu ---
interface CustomUser extends User {
  id: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  token?: string;
}

interface CustomJWT extends JWT {
  id: string;
  role: UserRole;
  accessToken: string;
  firstName: string;
  lastName: string;
}

// --- Configuration principale NextAuth ---
export const authOptions: NextAuthOptions = {
  providers: [
    // === Connexion par email/mot de passe ===
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "jsmith@example.com" },
        password: { label: "Password", type: "password", placeholder: "********" },
      },
      async authorize(credentials): Promise<CustomUser | null> {
        if (!credentials?.email || !credentials?.password) {
          console.log("[NextAuth] Authorize: Email ou mot de passe manquant.");
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email.toLowerCase() },
          });

          if (!user || !user.password) return null;

          const isPasswordCorrect = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordCorrect) return null;

          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
            role: (user.role as UserRole) || "USER",
            firstName: user.firstName ?? "",
            lastName: user.lastName ?? "",
          };
        } catch (error: unknown) {
          if (error instanceof PrismaClientKnownRequestError) {
            console.error(`[NextAuth] Prisma error ${error.code}: ${error.message}`);
          } else if (error instanceof PrismaClientValidationError) {
            console.error(`[NextAuth] Validation error: ${error.message}`);
          } else if (error instanceof Error) {
            console.error(`[NextAuth] Erreur inattendue: ${error.message}`);
          }
          return null;
        }
      },
    }),

    // === Connexion via Google ===
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],

  // === Pages personnalisées ===
  pages: {
    signIn: "/login",
  },

  callbacks: {
    // --- Lors de la connexion (signIn) ---
    async signIn({ user, account, profile }) {
      // Si l'utilisateur vient de Google
      if (account?.provider === "google" && profile) {
        const email = user.email!.toLowerCase();
        const existingUser = await prisma.user.findUnique({ where: { email } });

        if (!existingUser) {
          const randomPassword = uuidv4();
          const hashedPassword = await bcrypt.hash(randomPassword, 10);

          await prisma.user.create({
            data: {
              email,
              password: hashedPassword,
              firstName: user.name?.split(" ")[0] ?? "",
              lastName: user.name?.split(" ")[1] ?? "",
              role: "USER",
              image:
                (profile as { picture?: string }).picture ??
                "/default-profile.png", // enregistre la photo du profil Google
            },
          });
        } else {
          // Met à jour la photo si elle a changé sur Google
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

    // --- JWT Token personnalisé ---
    async jwt({ token, user }): Promise<CustomJWT> {
      if (user) {
        const u = user as CustomUser;
        token.id = u.id;
        token.role = u.role;
        token.accessToken = uuidv4();
        token.firstName = u.firstName;
        token.lastName = u.lastName;
        token.name = u.name ?? "";
        token.email = u.email ?? "";
      }
      return token as CustomJWT;
    },

    // --- Session utilisateur ---
    async session({ session, token }): Promise<Session> {
      const t = token as CustomJWT;

      if (session.user) {
        session.user.id = t.id;
        session.user.role = t.role;
        session.user.token = t.accessToken;
        session.user.firstName = t.firstName;
        session.user.lastName = t.lastName;
        session.user.name = t.name;
        session.user.email = t.email;
      }

      return session;
    },

    // --- Redirection après connexion ---
    async redirect({ url, baseUrl }) {
      try {
        // Si l’utilisateur venait d’une page spécifique avant login → on le renvoie là-bas
        if (url.startsWith(baseUrl)) {
          return url;
        }
        // Si c’est une URL externe, sécurité : on redirige vers la home
        else if (url.startsWith("/")) {
          return `${baseUrl}${url}`;
        }
        // Par défaut → accueil
        return baseUrl;
      } catch (e) {
        console.error("Erreur dans redirect callback:", e);
        return baseUrl;
      }
    },
  },

  session: {
    strategy: "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET,
};

// --- Export des handlers NextAuth ---
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
