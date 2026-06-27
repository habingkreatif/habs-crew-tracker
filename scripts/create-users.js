require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
const pool = new Pool({ connectionString: process.env.DIRECT_URL });

const accounts = [
  { email: 'superadmin@habs.co.id', password: 'Password123!', role: 'SUPERADMIN', nama: 'Superadmin Pusat', spesialisasi: 'Owner' },
  { email: 'admin@habs.co.id', password: 'Password123!', role: 'ADMIN', nama: 'Admin Cabang', spesialisasi: 'Admin' },
  { email: 'mandor@habs.co.id', password: 'Password123!', role: 'MANDOR', nama: 'Mandor Budi', spesialisasi: 'Mandor Proyek' },
  { email: 'tukang@habs.co.id', password: 'Password123!', role: 'TUKANG', nama: 'Tukang Agus', spesialisasi: 'Tukang Kayu' }
];

async function main() {
  console.log('Mulai membuat akun dummy terpadu...');
  
  // Kita sisakan akun fajri yang sebelumnya terdaftar
  await pool.query("DELETE FROM profiles WHERE id != 'ffc7c9a0-f666-4762-888d-6d2ece6b6edc'");

  for (const acc of accounts) {
    let userId = '';
    
    // 1. Coba hapus dulu kalau sudah ada biar bersih
    const { data: existingData } = await supabase.auth.admin.listUsers();
    const existingUser = existingData.users.find(u => u.email === acc.email);
    if (existingUser) {
        await supabase.auth.admin.deleteUser(existingUser.id);
    }

    // 2. Create in Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email: acc.email,
      password: acc.password,
      email_confirm: true
    });
    
    if (error) {
        console.error(`Error create user ${acc.email}:`, error);
        continue;
    } else {
      userId = data.user.id;
      console.log(`[AUTH] Akun ${acc.email} berhasil dibuat (ID: ${userId})`);
    }

    // 3. Insert into DB Profile
    try {
      await pool.query(`
        INSERT INTO profiles (id, nama, role, status, spesialisasi, "updatedAt") 
        VALUES ($1, $2, $3, 'ACTIVE', $4, NOW())
      `, [userId, acc.nama, acc.role, acc.spesialisasi]);
      console.log(`[DB] Profil ${acc.nama} tersimpan.`);
    } catch (e) {
      console.error(`[DB ERROR] Gagal simpan profile untuk ${acc.email}:`, e.message);
    }
  }

  console.log('Semua akun berhasil dibuat!');
  process.exit(0);
}

main();
