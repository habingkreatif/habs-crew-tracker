import { createClient } from '@supabase/supabase-js';
import { PrismaClient, Role, Status } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!, // Admin Service Role Key
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

const pool = new Pool({ connectionString: process.env.DIRECT_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function setupUsers() {
  console.log('🔄 Setup Supabase Auth dan Prisma Profiles...');

  const usersToCreate = [
    { email: 'admin@habs.co.id', password: 'password123', role: Role.SUPERADMIN, nama: 'Admin Pusat', spesialisasi: 'Owner' },
    { email: 'mandor@habs.co.id', password: 'password123', role: Role.MANDOR, nama: 'Pak Budi (Mandor)', spesialisasi: 'Mandor Lapangan' },
    { email: 'tukang@habs.co.id', password: 'password123', role: Role.TUKANG, nama: 'Mas Agus (Tukang)', spesialisasi: 'Tukang Batu' },
  ];

  for (const u of usersToCreate) {
    // 1. Create in Supabase Auth
    console.log(`Membuat akun Supabase untuk ${u.email}...`);
    
    // Hapus dulu kalau ada
    const { data: searchData } = await supabase.auth.admin.listUsers();
    const existing = searchData?.users?.find(x => x.email === u.email);
    if (existing) {
      await supabase.auth.admin.deleteUser(existing.id);
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true, // Langsung aktif
    });

    if (error) {
      console.error(`❌ Gagal Supabase: ${u.email}`, error.message);
    } else if (data.user) {
      // 2. Simpan Profile di Prisma
      console.log(`Menyimpan profile Prisma untuk UUID: ${data.user.id}`);
      await prisma.profile.upsert({
        where: { id: data.user.id },
        update: {
          nama: u.nama,
          role: u.role,
          spesialisasi: u.spesialisasi,
        },
        create: {
          id: data.user.id,
          nama: u.nama,
          role: u.role,
          spesialisasi: u.spesialisasi,
        }
      });
      console.log(`✅ Berhasil: ${u.email} -> ${data.user.id}`);
    }
  }

  // 3. Create Dummy Project (id: 1)
  console.log('🔄 Membuat Proyek Dummy...');
  await prisma.project.upsert({
    where: { id: 1 },
    update: {
      namaProyek: 'Proyek Renovasi Kantor Pusat',
      alamat: 'Jl. Sudirman, Jakarta Pusat',
      latitude: -6.200000,
      longitude: 106.816666,
      radiusMeter: 5000, // 5km radius for testing so user won't get geofence error easily
      estimasiDurasiHari: 30,
      status: 'on-track'
    },
    create: {
      id: 1,
      namaProyek: 'Proyek Renovasi Kantor Pusat',
      alamat: 'Jl. Sudirman, Jakarta Pusat',
      latitude: -6.200000,
      longitude: 106.816666,
      radiusMeter: 5000, // 5km radius for testing
      estimasiDurasiHari: 30,
      status: 'on-track'
    }
  });
  console.log(`✅ Proyek Dummy berhasil dibuat!`);

  console.log('🎉 Setup Selesai! Kamu sekarang bisa login menggunakan email tersebut.');
}

setupUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
