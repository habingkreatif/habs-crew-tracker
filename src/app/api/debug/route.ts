import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/data/datasource/prismaClient';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const date = new Date();
  const startOfDay = new Date(date);
  startOfDay.setUTCHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setUTCHours(23, 59, 59, 999);

  const tasks = await prisma.dailyTask.findMany({
    where: {
      tanggal: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
    orderBy: { id: 'desc' },
  });
  return NextResponse.json({ startOfDay, endOfDay, tasks });
}
