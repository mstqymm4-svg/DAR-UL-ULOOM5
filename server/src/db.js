import { PrismaClient } from '@prisma/client';

// Singleton Prisma client shared across the whole backend.
export const prisma = new PrismaClient();

export default prisma;
