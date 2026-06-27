import { NextResponse } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-response';
import { PrismaPayrollRepository } from '@/data/repositories/payroll.repository';
import { generatePayrollUseCase } from '@/domain/usecase/admin/generate-payroll.usecase';
import { prisma } from '@/data/datasource/prismaClient';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const startStr = searchParams.get('start');
    const endStr = searchParams.get('end');

    const start = startStr ? new Date(startStr) : undefined;
    const end = endStr ? new Date(endStr) : undefined;

    const repo = new PrismaPayrollRepository();
    const data = await repo.getPayrolls(start, end);
    
    return apiSuccess(data);
  } catch (error: any) {
    return apiError(error.message || 'Gagal mengambil data gaji');
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userIds, periodeMulai, periodeSelesai } = body;

    if (!userIds || !Array.isArray(userIds) || !periodeMulai || !periodeSelesai) {
      return apiError('Parameter tidak lengkap (butuh userIds, periodeMulai, periodeSelesai)');
    }

    const start = new Date(periodeMulai);
    start.setHours(0, 0, 0, 0);

    const end = new Date(periodeSelesai);
    end.setHours(23, 59, 59, 999);
    
    const repo = new PrismaPayrollRepository();
    
    const results = [];
    const errors = [];

    // Fetch upah per jam for these users from Profile table
    const profiles = await prisma.profile.findMany({
      where: { id: { in: userIds } },
      select: { id: true, upahPerJam: true, nama: true }
    });

    for (const profile of profiles) {
      try {
        const payroll = await generatePayrollUseCase(
          {
            userId: profile.id,
            periodeMulai: start,
            periodeSelesai: end,
          },
          repo,
          profile.upahPerJam || 0
        );
        results.push(payroll);
      } catch (err: any) {
        errors.push({ nama: profile.nama, error: err.message });
      }
    }

    return apiSuccess({ generated: results, errors });
  } catch (error: any) {
    return apiError(error.message || 'Gagal membuat slip gaji');
  }
}
