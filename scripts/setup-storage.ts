import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

async function setupStorage() {
  console.log('🔄 Memeriksa Supabase Storage...');
  const bucketNames = ['attendance-photos', 'progress-photos'];

  // Dapatkan daftar bucket
  const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
  
  if (listError) {
    console.error('❌ Gagal mengambil daftar bucket:', listError.message);
    process.exit(1);
  }

  for (const bucketName of bucketNames) {
    const exists = buckets.find(b => b.name === bucketName);

    if (exists) {
      console.log(`✅ Bucket '${bucketName}' sudah ada.`);
      
      // Pastikan bucket bersifat publik (opsional)
      await supabaseAdmin.storage.updateBucket(bucketName, { public: true });
    } else {
      console.log(`Membuat bucket '${bucketName}'...`);
      const { error: createError } = await supabaseAdmin.storage.createBucket(bucketName, {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
        fileSizeLimit: 5242880, // 5MB
      });

      if (createError) {
        console.error(`❌ Gagal membuat bucket ${bucketName}:`, createError.message);
      } else {
        console.log(`✅ Bucket '${bucketName}' berhasil dibuat!`);
      }
    }
  }
}

setupStorage().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
