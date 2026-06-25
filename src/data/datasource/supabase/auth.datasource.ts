import { createClient } from '@supabase/supabase-js';

// Menggunakan Service Role Key untuk bypass konfirmasi email dan CRUD users via Admin API
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

export const createUser = async (email: string, password?: string) => {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Langsung aktif karena didaftarkan oleh admin
  });

  if (error || !data.user) {
    throw new Error(error?.message || 'Gagal membuat user di Supabase Auth');
  }

  return data.user.id; // UUID
};

export const deleteUser = async (id: string) => {
  const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
  if (error) {
    throw new Error(error.message);
  }
};
