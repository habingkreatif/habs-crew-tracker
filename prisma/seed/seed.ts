import { PrismaClient, Role, Status } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DIRECT_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Memulai proses seeding data Habs Crew Tracker...');

    // 1. Bersihkan data lama (GAYA KARANGGAYAM: SAPU BERSIH)
    // Urutan hapusnya harus dari tabel yang paling bawah (anak) ke atas (induk) biar gak kena error relasi
    await prisma.dailyTask.deleteMany();
    await prisma.attendance.deleteMany();
    await prisma.project.deleteMany();
    await prisma.profile.deleteMany();

    // 2. Buat Data Karyawan (Superadmin, Mandor, Tukang)
    const owner = await prisma.profile.create({
        data: {
            id: 'uuid-dummy-owner-123',
            nik: '3402000000000001',
            nama: 'Muhammad Syifa',
            noHp: '081100001111',
            role: Role.SUPERADMIN,
            status: Status.ACTIVE,
            spesialisasi: 'Owner',
        },
    });

    const mandor = await prisma.profile.create({
        data: {
            id: 'uuid-dummy-mandor-456',
            nik: '3402000000000002',
            nama: 'Pak Budi (Mandor)',
            noHp: '081200002222',
            role: Role.MANDOR,
            status: Status.ACTIVE,
            spesialisasi: 'Mandor Proyek',
            upahPerJam: 25000,
        },
    });

    const tukang = await prisma.profile.create({
        data: {
            id: 'uuid-dummy-tukang-789',
            nik: '3402000000000003',
            nama: 'Mas Agus (Tukang Kayu)',
            noHp: '081300003333',
            role: Role.TUKANG,
            status: Status.ACTIVE,
            spesialisasi: 'Tukang Kayu',
            upahPerJam: 15000,
        },
    });

    // 3. Buat Data Proyek (Bisa pakai createMany kalau lu mau bikin banyak proyek sekaligus)
    const project = await prisma.project.create({
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

    // 4. Buat Data Absensi Dummy
    await prisma.attendance.create({
        data: {
            userId: tukang.id,
            projectId: project.id,
            photoSelfieUrl: 'https://dummyimage.com/400x600/000/fff&text=Selfie+Tukang',
            latitudeAbsen: -7.9516,
            longitudeAbsen: 110.3422,
            isVerified: true,
            clockIn: new Date(),
        },
    });

    console.log('✅ Seeding data dummy berhasil!');
}

main()
    .catch((e) => {
        console.error('Error saat seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });