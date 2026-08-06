"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../utils/db");
const auth_1 = require("../utils/auth");
const client_1 = require("@prisma/client");
async function runVerification() {
    console.log('==================================================');
    console.log('     ARMOURLINK SYSTEM VALIDATION TESTS           ');
    console.log('==================================================');
    let passed = true;
    // Test 1: PostgreSQL Connection
    try {
        await db_1.prisma.$connect();
        console.log('✅ TEST 1: PostgreSQL connection successful.');
    }
    catch (error) {
        console.error('❌ TEST 1: PostgreSQL connection failed.', error);
        passed = false;
    }
    // Test 2: Verify Sites Seeded
    try {
        const siteCount = await db_1.prisma.site.count();
        if (siteCount === 3) {
            console.log(`✅ TEST 2: Found exactly ${siteCount} client sites in database.`);
        }
        else {
            console.log(`❌ TEST 2: Expected 3 client sites, found ${siteCount}.`);
            passed = false;
        }
    }
    catch (error) {
        console.error('❌ TEST 2: Failed to check sites.', error);
        passed = false;
    }
    // Test 3: Verify Workers Seeding (Exact 100)
    try {
        const workerCount = await db_1.prisma.worker.count();
        if (workerCount === 100) {
            console.log(`✅ TEST 3: Found exactly ${workerCount} workers seeded from workers_dataset.xlsx.`);
        }
        else {
            console.log(`❌ TEST 3: Expected 100 workers, found ${workerCount}.`);
            passed = false;
        }
    }
    catch (error) {
        console.error('❌ TEST 3: Failed to check workers.', error);
        passed = false;
    }
    // Test 4: Verify Admin & Supervisor Accounts
    try {
        const adminUser = await db_1.prisma.user.findUnique({
            where: { email: 'admin@safety.com' },
        });
        const supervisorUser = await db_1.prisma.user.findUnique({
            where: { email: 'supervisor1@safety.com' },
        });
        if (adminUser && adminUser.role === client_1.Role.ADMIN && supervisorUser && supervisorUser.role === client_1.Role.SUPERVISOR) {
            console.log('✅ TEST 4: Seeded Admin and Supervisor accounts verified.');
        }
        else {
            console.log('❌ TEST 4: Seeded credentials verification failed.');
            passed = false;
        }
    }
    catch (error) {
        console.error('❌ TEST 4: Failed to check users.', error);
        passed = false;
    }
    // Test 5: Verify JWT Helper Functions
    try {
        const testPayload = {
            userId: 'test-user-id',
            email: 'test@safety.com',
            role: client_1.Role.SUPERVISOR,
            siteId: 'test-site-id',
            name: 'Test Supervisor',
        };
        const token = (0, auth_1.generateToken)(testPayload);
        const verified = (0, auth_1.verifyToken)(token);
        if (verified && verified.userId === testPayload.userId && verified.role === testPayload.role) {
            console.log('✅ TEST 5: JWT Token creation and validation verified.');
        }
        else {
            console.log('❌ TEST 5: JWT verification logic failed.');
            passed = false;
        }
    }
    catch (error) {
        console.error('❌ TEST 5: JWT utility error.', error);
        passed = false;
    }
    console.log('==================================================');
    if (passed) {
        console.log('🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY!    ');
    }
    else {
        console.log('⚠️ SOME TESTS FAILED. PLEASE VERIFY SEEDING/DB. ');
    }
    console.log('==================================================');
    await db_1.prisma.$disconnect();
    process.exit(passed ? 0 : 1);
}
runVerification();
