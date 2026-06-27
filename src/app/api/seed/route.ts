import { NextResponse } from 'next/server';
import { prisma } from '@/data/datasource/prismaClient';

export async function GET() {
  try {
    // 1. Bersihkan data (Kecuali Profile agar Supabase Auth tetap jalan)
    await prisma.dailyTask.deleteMany();
    await prisma.attendance.deleteMany();
    await prisma.project.deleteMany();

    // 2. Buat Project Dummy (Sesuai lokasi testing user sebelumnya "Proyek Keren")
    const project = await prisma.project.create({
      data: {
        namaProyek: 'Proyek Keren',
        alamat: 'AA Futsal',
        latitude: -7.8045,
        longitude: 110.3696,
        radiusMeter: 20,
        estimasiDurasiHari: 30,
        status: 'on-track',
      },
    });

    const project2 = await prisma.project.create({
      data: {
        namaProyek: 'Pembangunan Villa Pundong',
        alamat: 'Kec. Pundong, Kab. Bantul, Yogyakarta',
        latitude: -7.9515,
        longitude: 110.3421,
        radiusMeter: 100,
        estimasiDurasiHari: 120,
        status: 'on-track',
      },
    });

    // 3. Ambil data User dari database yang valid dari Supabase (jangan di hapus)
    const mandor = await prisma.profile.findFirst({
      where: { role: 'MANDOR' }
    });

    const tukangList = await prisma.profile.findMany({
      where: { role: 'TUKANG' }
    });

    if (!mandor || tukangList.length === 0) {
      return NextResponse.json({ success: false, message: 'Harap pastikan ada minimal 1 Mandor dan 1 Tukang di database sebelum seeding.' });
    }

    // 4. Seed Data Attendance (Absensi Hari Ini)
    const today = new Date();
    today.setHours(7, 30, 0, 0); // Datang jam 07:30

    await prisma.attendance.create({
      data: {
        userId: mandor.id,
        projectId: project.id,
        photoSelfieUrl: 'https://images.unsplash.com/photo-1541888086925-0c13d4cc4458?w=400&q=80',
        latitudeAbsen: -7.8045,
        longitudeAbsen: 110.3696,
        isVerified: true,
        clockIn: today,
      }
    });

    for (const tukang of tukangList) {
      await prisma.attendance.create({
        data: {
          userId: tukang.id,
          projectId: project.id,
          photoSelfieUrl: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400&q=80',
          latitudeAbsen: -7.8045,
          longitudeAbsen: 110.3696,
          isVerified: true,
          clockIn: today,
        }
      });
    }

    // 5. Seed Data Daily Task (Target & Progres)
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Task kemarin (Sudah Selesai)
    await prisma.dailyTask.create({
      data: {
        projectId: project.id,
        userId: mandor.id,
        namaPekerjaan: 'Pengecoran Pondasi Utama',
        tanggal: yesterday,
        isLockedPagi: true,
        progressPercentage: 100,
        photoProgresUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80',
        catatanTambahan: 'Selesai tanpa kendala cuaca.',
      }
    });

    // Task hari ini (Sedang Berjalan - 50%)
    await prisma.dailyTask.create({
      data: {
        projectId: project.id,
        userId: mandor.id,
        namaPekerjaan: 'Pemasangan Dinding Bata Lantai 1',
        tanggal: today,
        isLockedPagi: true,
        progressPercentage: 50,
        photoProgresUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&q=80',
        catatanTambahan: 'Material kurang sedikit, sedang dipesan.',
      }
    });

    return NextResponse.json({ success: true, message: 'Seeding berhasil dilakukan dengan API Route!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
