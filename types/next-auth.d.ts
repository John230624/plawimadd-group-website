// types/next-auth.d.ts
// Ce fichier étend les types de NextAuth.js pour inclure vos propriétés personnalisées
// et doit être inclus dans votre tsconfig.json pour être reconnu globalement.

import { DefaultSession, DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";
import { UserRole } from "@/lib/types"; // <-- IMPORTATION CRUCIALE DE VOTRE ENUM USERROLE

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: UserRole;
    name: string;
    email: string;
    firstName: string;
    lastName: string;
  }
}

declare module "next-auth" {
  // IMPORTANT : Utiliser 'extends DefaultSession' pour augmenter le type de session par défaut
  interface Session extends DefaultSession {
    user: User & {
      role: UserRole;
      firstName: string;
      lastName: string;
    };
  }

  // IMPORTANT : Utiliser 'extends DefaultUser' pour augmenter le type d'utilisateur par défaut
  interface User extends DefaultUser {
    id: string;
    role: UserRole; // Utilise l'enum UserRole importée
    firstName: string;
    lastName: string;
    name: string;
    email: string;
  }
}
