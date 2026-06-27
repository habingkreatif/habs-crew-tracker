import { NextResponse } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-response';
import { PrismaPayrollRepository } from '@/data/repositories/payroll.repository';

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await context.params;
    const id = parseInt(idStr, 10);
    if (isNaN(id)) return apiError('ID tidak valid', 'BAD_REQUEST', 400);

    const body = await req.json();
    const repo = new PrismaPayrollRepository();

    const existing = await repo.findById(id);
    if (!existing) return apiError('Data gaji tidak ditemukan', 'NOT_FOUND', 404);

    // Calculate new totalBersih if bonus/potongan is updated
    let newBonus = existing.bonusLembur;
    let newPotongan = existing.potongan;

    if (body.bonusLembur !== undefined) newBonus = Number(body.bonusLembur);
    if (body.potongan !== undefined) newPotongan = Number(body.potongan);

    const newTotalBersih = existing.totalGajiPokok + newBonus - newPotongan;

    const updated = await repo.update(id, {
      bonusLembur: newBonus,
      potongan: newPotongan,
      totalBersih: newTotalBersih,
      status: body.status, // e.g. 'PAID'
    });

    return apiSuccess(updated);
  } catch (error: any) {
    return apiError(error.message || 'Gagal update data gaji');
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await context.params;
    const id = parseInt(idStr, 10);
    if (isNaN(id)) return apiError('ID tidak valid', 'BAD_REQUEST', 400);

    const repo = new PrismaPayrollRepository();
    const existing = await repo.findById(id);
    if (!existing) return apiError('Data gaji tidak ditemukan', 'NOT_FOUND', 404);

    await repo.delete(id);
    return apiSuccess({ deleted: true });
  } catch (error: any) {
    return apiError(error.message || 'Gagal menghapus data gaji');
  }
}
