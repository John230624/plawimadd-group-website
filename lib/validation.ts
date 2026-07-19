import { z } from 'zod';

export const emailSchema = z.string().email('Email invalide.').max(255);

export const passwordSchema = z
  .string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères.')
  .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une lettre majuscule.')
  .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une lettre minuscule.')
  .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre.')
  .regex(/[^A-Za-z0-9]/, 'Le mot de passe doit contenir au moins un caractère spécial.');

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().max(255).optional().nullable(),
  lastName: z.string().max(255).optional().nullable(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Le mot de passe est requis.'),
});

export const contactSchema = z.object({
  name: z.string().min(1, 'Le nom est requis.').max(255),
  email: emailSchema,
  subject: z.string().min(1, 'Le sujet est requis.').max(500),
  message: z.string().min(1, 'Le message est requis.').max(5000),
});

export const productSchema = z.object({
  name: z.string().min(1, 'Le nom du produit est requis.').max(255),
  description: z.string().max(5000).optional().nullable(),
  price: z.number().positive('Le prix doit être positif.'),
  stock: z.number().int().nonnegative('Le stock doit être un nombre positif ou nul.'),
  categoryId: z.string().uuid('Catégorie invalide.'),
  imgUrl: z.union([z.string(), z.array(z.string())]).optional().nullable(),
  videoUrl: z.string().max(500).optional().nullable(),
  offerPrice: z.number().positive('Le prix promo doit être positif.').optional().nullable(),
  brand: z.string().max(255).optional().nullable(),
  color: z.string().max(255).optional().nullable(),
});

export const categorySchema = z.object({
  name: z.string().min(1, 'Le nom de la catégorie est requis.').max(255),
  description: z.string().max(2000).optional().nullable(),
  imageUrl: z
    .string()
    .max(500)
    .regex(/^(https?:\/\/|\/).+/, 'Image invalide (URL ou chemin relatif attendu).')
    .optional()
    .nullable(),
  parentId: z.string().uuid().optional().nullable(),
});

export const addressSchema = z.object({
  fullName: z.string().min(1, 'Le nom complet est requis.').max(255),
  phoneNumber: z.string().min(1, 'Le numéro de téléphone est requis.').max(20),
  area: z.string().min(1, 'La zone est requise.').max(500),
  city: z.string().min(1, 'La ville est requise.').max(100),
  state: z.string().min(1, 'La région est requise.').max(100),
  country: z.string().min(1, 'Le pays est requis.').max(100),
  street: z.string().max(255).optional().nullable(),
  pincode: z.string().max(10).optional().nullable(),
  isDefault: z.boolean().optional(),
});

export const orderStatusSchema = z.object({
  orderId: z.string().uuid('ID de commande invalide.'),
  status: z.enum([
    'PENDING', 'PAID_SUCCESS', 'PAYMENT_FAILED', 'PROCESSING',
    'SHIPPED', 'DELIVERED', 'CANCELLED', 'ON_HOLD',
  ]),
});

export const studentInstallmentSchema = z.object({
  fullName: z.string().min(1, 'Le nom complet est requis.').max(255),
  phoneNumber: z.string().min(1, 'Le numéro de téléphone est requis.').max(20),
  schoolName: z.string().min(1, "Le nom de l'école est requis.").max(255),
  studentEmail: emailSchema,
  studentIdNumber: z.string().min(1, "Le numéro d'étudiant est requis.").max(100),
  requestedMonths: z.number().int().positive('Le nombre de mois doit être positif.'),
  notes: z.string().max(2000).optional().nullable(),
});
