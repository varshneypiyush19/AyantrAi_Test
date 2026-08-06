import { prisma } from '../utils/db';
import { generateToken, verifyToken } from '../utils/auth';
import { Role } from '@prisma/client';

async function runVerification() {
  console.log('==================================================');
  console.log('     ARMOURLINK SYSTEM VALIDATION TESTS           ');
  console.log('==================================================');
  
  let passed = true;

  // Test 1: PostgreSQL Connection
  try {
    await prisma.$connect();
    console.log('✅ TEST 1: PostgreSQL connection successful.');
  } catch (error) {
    console.error('❌ TEST 1: PostgreSQL connection failed.', error);
    passed = false;
  }

  // Test 2: Verify Sites Seeded
  try {
    const siteCount = await prisma.site.count();
    if (siteCount === 3) {
      console.log(`✅ TEST 2: Found exactly ${siteCount} client sites in database.`);
    } else {
      console.log(`❌ TEST 2: Expected 3 client sites, found ${siteCount}.`);
      passed = false;
    }
  } catch (error) {
    console.error('❌ TEST 2: Failed to check sites.', error);
    passed = false;
  }

  // Test 3: Verify Workers Seeding (Exact 100)
  try {
    const workerCount = await prisma.worker.count();
    if (workerCount === 100) {
      console.log(`✅ TEST 3: Found exactly ${workerCount} workers seeded from workers_dataset.xlsx.`);
    } else {
      console.log(`❌ TEST 3: Expected 100 workers, found ${workerCount}.`);
      passed = false;
    }
  } catch (error) {
    console.error('❌ TEST 3: Failed to check workers.', error);
    passed = false;
  }

  // Test 4: Verify Admin & Supervisor Accounts
  try {
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@safety.com' },
    });
    
    const supervisorUser = await prisma.user.findUnique({
      where: { email: 'supervisor1@safety.com' },
    });

    if (adminUser && adminUser.role === Role.ADMIN && supervisorUser && supervisorUser.role === Role.SUPERVISOR) {
      console.log('✅ TEST 4: Seeded Admin and Supervisor accounts verified.');
    } else {
      console.log('❌ TEST 4: Seeded credentials verification failed.');
      passed = false;
    }
  } catch (error) {
    console.error('❌ TEST 4: Failed to check users.', error);
    passed = false;
  }

  // Test 5: Verify JWT Helper Functions
  try {
    const testPayload = {
      userId: 'test-user-id',
      email: 'test@safety.com',
      role: Role.SUPERVISOR,
      siteId: 'test-site-id',
      name: 'Test Supervisor',
    };

    const token = generateToken(testPayload);
    const verified = verifyToken(token);

    if (verified && verified.userId === testPayload.userId && verified.role === testPayload.role) {
      console.log('✅ TEST 5: JWT Token creation and validation verified.');
    } else {
      console.log('❌ TEST 5: JWT verification logic failed.');
      passed = false;
    }
  } catch (error) {
    console.error('❌ TEST 5: JWT utility error.', error);
    passed = false;
  }

  console.log('==================================================');
  if (passed) {
    console.log('🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY!    ');
  } else {
    console.log('⚠️ SOME TESTS FAILED. PLEASE VERIFY SEEDING/DB. ');
  }
  console.log('==================================================');
  
  await prisma.$disconnect();
  process.exit(passed ? 0 : 1);
}

runVerification();
