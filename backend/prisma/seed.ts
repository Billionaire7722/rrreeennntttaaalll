import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedUsers() {
    const saltRounds = 10;
    const defaultPassword = '123456';
    const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);

    const usersToSeed = [
        {
            email: 'superadmin@test.com',
            username: 'superadmin',
            name: 'Super Admin',
            role: 'SUPER_ADMIN' as any,
            password: hashedPassword,
        },
        {
            email: 'admin@test.com',
            username: 'admin',
            name: 'Admin',
            role: 'USER' as any,
            password: hashedPassword,
        },
        {
            email: 'viewer@test.com',
            username: 'viewer',
            name: 'Viewer',
            role: 'USER' as any,
            password: hashedPassword,
        }
    ];

    for (const user of usersToSeed) {
        const existingUser = await prisma.user.findUnique({ where: { email: user.email } });
        if (!existingUser) {
            await prisma.user.create({ data: user });
            console.log(`Seeded user: ${user.email} (${user.role})`);
        } else {
            console.log(`User already exists: ${user.email}`);
        }
    }
}

async function main() {
    if (process.env.NODE_ENV !== 'development') {
        console.log('Skipping seed. Auto-seeding is only allowed in development environment (NODE_ENV=development).');
        return;
    }

    console.log('Seeding Users...');
    await seedUsers();

    // ==========================================
    // Seed Houses from JSON
    // ==========================================
    console.log('Seeding Houses from JSON...');
    const houseDataPath = require('path').join(__dirname, 'data', 'house.json');
    let houseData: Record<string, any>;
    try {
        houseData = JSON.parse(require('fs').readFileSync(houseDataPath, 'utf-8'));
    } catch (err) {
        console.error('Failed to read house.json:', err);
        houseData = {};
    }

    const houseSeedData: any[] = [];
    for (const [key, house] of Object.entries(houseData)) {
        // Parse numerical fields safely
        const lat = house.latitude ? parseFloat(house.latitude) : null;
        const lng = house.longitude ? parseFloat(house.longitude) : null;
        const price = house.price ? parseInt(house.price, 10) : null;
        const bedrooms = house.bedrooms ? parseInt(house.bedrooms, 10) : null;
        const square = house.square ? parseFloat(house.square) : null;

        houseSeedData.push({
            original_id: key,
            name: house.name || '',
            address: house.address || '',
            district: house.district || '',
            city: house.city || '',
            latitude: Number.isNaN(lat) ? null : lat,
            longitude: Number.isNaN(lng) ? null : lng,
            price: Number.isNaN(price) ? null : price,
            payment_method: house.payment_method || null,
            bedrooms: Number.isNaN(bedrooms) ? null : bedrooms,
            square: Number.isNaN(square) ? null : square,
            image_url_1: house.image_url_1 || null,
            image_url_2: house.image_url_2 || null,
            image_url_3: house.image_url_3 || null,
            image_url_4: house.image_url_4 || null,
            image_url_5: house.image_url_5 || null,
            image_url_6: house.image_url_6 || null,
            image_url_7: house.image_url_7 || null,
            image_url_8: house.image_url_8 || null,
            description: house.decription || null,
            status: house.status || null,
            is_private_bathroom: house.is_private_bathroom === true || house.is_private_bathroom === 'true'
        });
    }

    // Upsert to handle re-running scripts safely
    let houseCount = 0;
    for (const data of houseSeedData) {
        await prisma.house.upsert({
            where: { original_id: data.original_id },
            update: data,
            create: data
        });
        houseCount++;
    }
    console.log(`Seeded ${houseCount} houses from JSON.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
