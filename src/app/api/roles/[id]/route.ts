import { NextResponse } from 'next/server';
import { prisma } from '@/data/datasource/prismaClient';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'ID tidak valid' }, { status: 400 });
    }

    // Cek apakah role sedang digunakan
    const role = await prisma.masterRole.findUnique({ where: { id } });
    if (!role) {
      return NextResponse.json({ success: false, error: 'Role tidak ditemukan' }, { status: 404 });
    }

    // Default roles (SUPERADMIN, ADMIN) sebaiknya tidak bisa dihapus, atau terserah aturan bisnis
    if (role.nama === 'SUPERADMIN') {
      return NextResponse.json({ success: false, error: 'Role SUPERADMIN tidak dapat dihapus' }, { status: 400 });
    }

    const inUse = await prisma.profile.findFirst({
      where: { role: role.nama },
    });

    if (inUse) {
      return NextResponse.json({ success: false, error: 'Role sedang digunakan oleh karyawan, tidak dapat dihapus' }, { status: 400 });
    }

    await prisma.masterRole.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Role berhasil dihapus' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
