import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DIRECT_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  const updated = await prisma.attendance.updateMany({
    data: {
      clockIn: yesterday,
      clockOut: yesterday,
    }
  });

  const updatedTasks = await prisma.dailyTask.updateMany({
    data: {
      tanggal: yesterday,
    }
  });

  console.log(`Berhasil mengubah ${updated.count} absen dan ${updatedTasks.count} tugas menjadi kemarin.`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
