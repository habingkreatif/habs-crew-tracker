const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
