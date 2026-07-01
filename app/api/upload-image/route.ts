import { NextRequest, NextResponse } from 'next/server';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { v2 as cloudinary } from 'cloudinary';
import { authorizeLoggedInUser } from '@/lib/authUtils';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
}

const cloudinaryConfig = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
};

const hasCloudinaryConfig = Boolean(
  cloudinaryConfig.cloud_name &&
    cloudinaryConfig.api_key &&
    cloudinaryConfig.api_secret
);

if (hasCloudinaryConfig) {
  cloudinary.config(cloudinaryConfig);
}

function getFileExtension(file: File): string {
  const extensionFromName = path.extname(file.name || '').toLowerCase();

  if (extensionFromName) {
    return extensionFromName;
  }

  const mimeTypeMap: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'image/avif': '.avif',
  };

  return mimeTypeMap[file.type] || '.jpg';
}

async function saveImageLocally(file: File, buffer: Buffer): Promise<string> {
  const uploadsDirectory = path.join(process.cwd(), 'public', 'images', 'uploads');
  const fileName = `${randomUUID()}${getFileExtension(file)}`;

  await mkdir(uploadsDirectory, { recursive: true });
  await writeFile(path.join(uploadsDirectory, fileName), buffer);

  return `/images/uploads/${fileName}`;
}

async function uploadToCloudinary(buffer: Buffer): Promise<string> {
  const uploadResult: CloudinaryUploadResult = await new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: 'plawimadd_products',
          resource_type: 'image',
        },
        (error, result) => {
          if (error) {
            return reject(error);
          }

          if (result?.secure_url) {
            return resolve(result as CloudinaryUploadResult);
          }

          reject(new Error('Cloudinary result is missing secure_url.'));
        }
      )
      .end(buffer);
  });

  return uploadResult.secure_url;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const auth = await authorizeLoggedInUser(req);
    if (!auth.authorized) {
      return auth.response!;
    }

    const formData = await req.formData();
    const file = formData.get('image');

    if (!(file instanceof File)) {
      return NextResponse.json({ message: 'Aucun fichier image fourni.' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: `Fichier trop volumineux. Taille maximale : ${MAX_FILE_SIZE / 1024 / 1024} Mo.` },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { message: 'Type de fichier non autorisé. Formats acceptés : JPEG, PNG, WebP, GIF, AVIF.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let imageUrl: string;

    if (hasCloudinaryConfig) {
      imageUrl = await uploadToCloudinary(buffer);
    } else {
      imageUrl = await saveImageLocally(file, buffer);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Image telechargee avec succes.',
        imageUrl,
        storage: hasCloudinaryConfig ? 'cloudinary' : 'local',
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Erreur lors du traitement du telechargement de l'image:", error);

    return NextResponse.json(
      { message: "Erreur serveur lors du telechargement de l'image." },
      { status: 500 }
    );
  }
}
