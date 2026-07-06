import prisma from '@/lib/prisma';

export interface LogActivityParams {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: string | null;
}

export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        userId: params.userId || null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId || null,
        details: params.details || null,
      },
    });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du journal:', error);
  }
}
