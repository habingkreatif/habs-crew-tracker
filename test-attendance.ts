import { insertAttendance } from './src/data/datasource/prisma/attendance.datasource';

async function testInsert() {
  try {
    const res = await insertAttendance({
      userId: '6bf0d4eb-fb40-4f2d-a80d-d9191820c1cd', // mandor UUID (need to fetch from db)
      projectId: 1,
      latitudeAbsen: -6.2,
      longitudeAbsen: 106.8,
      photoSelfieUrl: 'https://test.com/photo.jpg'
    });
    console.log('Success:', res);
  } catch (error) {
    console.error('Error inserting attendance:', error);
  }
}

// First, get a real user id
import { prisma } from './src/data/datasource/prismaClient';
async function run() {
    const user = await prisma.profile.findFirst({ where: { role: 'MANDOR' }});
    if (!user) return console.log('No mandor found');
    
    try {
      const res = await insertAttendance({
        userId: user.id,
        projectId: 1,
        latitudeAbsen: -6.2,
        longitudeAbsen: 106.8,
        photoSelfieUrl: 'https://test.com/photo.jpg'
      });
      console.log('Success:', res);
    } catch (error) {
      console.error('Error inserting attendance:', error);
    }
}
run().finally(() => process.exit(0));
