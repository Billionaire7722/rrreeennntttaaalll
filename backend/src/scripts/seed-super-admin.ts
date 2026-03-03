import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import { Role } from '../security/roles.enum';

// Initialize Prisma with adapter
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/rental?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Seed: Start isolating SUPER_ADMIN account...');

    // 1. Demote any existing SUPER_ADMINs to ADMIN to ensure exclusivity
    const existingSuperAdmins = await prisma.user.findMany({
        where: { role: Role.SUPER_ADMIN }
    });

    if (existingSuperAdmins.length > 0) {
        console.log(`Found ${existingSuperAdmins.length} existing SUPER_ADMIN(s). Demoting to ADMIN...`);
        await prisma.user.updateMany({
            where: { role: Role.SUPER_ADMIN },
            data: { role: Role.ADMIN }
        });
    }

    // 2. Define the exact, single SUPER_ADMIN credentials
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'ceo@rentalapp.com';
    const superAdminUsername = process.env.SUPER_ADMIN_USERNAME || 'superadmin_ceo';
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;

    if (!superAdminPassword) {
        throw new Error('SUPER_ADMIN_PASSWORD is required for seed-super-admin');
    }

    console.log(`Creating definitive SUPER_ADMIN: ${superAdminEmail}`);

    const hashedPassword = await bcrypt.hash(superAdminPassword, 10);

    // 3. Upsert the master account (Create if doesn't exist, update if it does but was somehow demoted)
    const superAdmin = await prisma.user.upsert({
        where: { email: superAdminEmail },
        update: {
            role: Role.SUPER_ADMIN,
            status: 'ACTIVE',
            deleted_at: null, // Ensure not soft-deleted
            password: hashedPassword // Reset password to known value for handoff
        },
        create: {
            name: 'Master System Administrator',
            username: superAdminUsername,
            email: superAdminEmail,
            password: hashedPassword,
            role: Role.SUPER_ADMIN,
            status: 'ACTIVE',
            phone: '+1-555-0199'
        }
    });

    console.log('✅ SUPER_ADMIN account established exclusively.');
    console.log('--------------------------------------------------');
    console.log(`Login ID: ${superAdmin.email}`);
    console.log(`Password: ${superAdminPassword}`);
    console.log('--------------------------------------------------');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
