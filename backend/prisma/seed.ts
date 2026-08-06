import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as xlsx from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // 1. Clear existing data
  console.log('Clearing existing data...');
  await prisma.violation.deleteMany();
  await prisma.worker.deleteMany();
  await prisma.user.deleteMany();
  await prisma.site.deleteMany();

  // 2. Create default sites
  console.log('Creating sites...');
  const sitesData = [
    { name: 'Main Factory Floor', location: 'Sector 4, Industrial Area' },
    { name: 'Warehouse North', location: 'Building B, Logistics Park' },
    { name: 'Construction Wing C', location: 'Site 10, Downtown Expansion' },
  ];

  const sites = [];
  for (const s of sitesData) {
    const site = await prisma.site.create({
      data: s,
    });
    sites.push(site);
  }
  console.log(`Created ${sites.length} sites.`);

  // 3. Create default admin and supervisors
  console.log('Creating roles/users...');
  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash('admin123', salt);
  const supervisorPasswordHash = await bcrypt.hash('super123', salt);

  // Admin
  await prisma.user.create({
    data: {
      email: 'admin@safety.com',
      passwordHash: adminPasswordHash,
      name: 'System Admin',
      role: Role.ADMIN,
    },
  });

  // Supervisors for each site
  const supervisorsData = [
    { email: 'supervisor1@safety.com', name: 'Rohan Sharma (Supervisor)', siteId: sites[0].id },
    { email: 'supervisor2@safety.com', name: 'Anjali Gupta (Supervisor)', siteId: sites[1].id },
    { email: 'supervisor3@safety.com', name: 'Vikram Singh (Supervisor)', siteId: sites[2].id },
  ];

  for (const sup of supervisorsData) {
    await prisma.user.create({
      data: {
        email: sup.email,
        passwordHash: supervisorPasswordHash,
        name: sup.name,
        role: Role.SUPERVISOR,
        siteId: sup.siteId,
      },
    });
  }
  console.log('Created admin and supervisors.');

  // 4. Parse Excel and seed workers
  const excelFilePath = '/Users/piyushvarshney/Desktop/AyantrAi_Test/workers_dataset.xlsx';
  console.log(`Parsing Excel file from: ${excelFilePath}`);

  const workbook = xlsx.readFile(excelFilePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawRows: any[] = xlsx.utils.sheet_to_json(worksheet);

  console.log(`Found ${rawRows.length} rows in the excel sheet.`);

  let seededWorkersCount = 0;
  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    
    // Extract properties and verify
    const workerId = String(row['Worker ID'] || '').trim();
    const name = String(row['Name'] || '').trim();
    const jobProfile = String(row['Job Profile'] || '').trim();
    const department = String(row['Department'] || '').trim();
    const mobileNumber = String(row['Mobile Number'] || '').trim();
    const aadharNumber = String(row['Aadhar Number'] || '').trim();

    if (!workerId || !name) {
      console.warn(`Skipping invalid row at index ${i}:`, row);
      continue;
    }

    // Assign worker to one of the 3 sites cyclically
    const assignedSite = sites[i % sites.length];

    await prisma.worker.create({
      data: {
        id: workerId,
        name,
        jobProfile,
        department,
        mobileNumber,
        aadharNumber,
        siteId: assignedSite.id,
      },
    });
    seededWorkersCount++;
  }

  console.log(`Successfully seeded ${seededWorkersCount} workers.`);
  console.log('Database seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
