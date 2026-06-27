import { NextResponse } from 'next/server';
import { prisma } from '@/data/datasource/prismaClient';
import { z } from 'zod';

const RoleSchema = z.object({
  nama: z.string().min(2, 'Nama role minimal 2 karakter').toUpperCase(),
});

export async function GET() {
  try {
    const roles = await prisma.masterRole.findMany({
      orderBy: { nama: 'asc' },
    });
    return NextResponse.json({ success: true, data: roles });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nama } = RoleSchema.parse(body);

    const existing = await prisma.masterRole.findUnique({
      where: { nama },
    });

    if (existing) {
      return NextResponse.json({ success: false, error: 'Role sudah ada' }, { status: 400 });
    }

    const role = await prisma.masterRole.create({
      data: { nama },
    });

    return NextResponse.json({ success: true, data: role });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
