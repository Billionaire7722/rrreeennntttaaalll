"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const dotenv = __importStar(require("dotenv"));
const bcrypt = __importStar(require("bcrypt"));
dotenv.config();
const connectionString = process.env.DATABASE_URL;
const pool = new pg_1.Pool({ connectionString });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
async function seedUsers() {
    const saltRounds = 10;
    const defaultPassword = '123456';
    const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);
    const usersToSeed = [
        {
            email: 'superadmin@test.com',
            username: 'superadmin',
            name: 'Super Admin',
            role: 'SUPER_ADMIN',
            password: hashedPassword,
        },
        {
            email: 'admin@test.com',
            username: 'admin',
            name: 'Admin',
            role: 'ADMIN',
            password: hashedPassword,
        },
        {
            email: 'viewer@test.com',
            username: 'viewer',
            name: 'Viewer',
            role: 'VIEWER',
            password: hashedPassword,
        }
    ];
    for (const user of usersToSeed) {
        const existingUser = await prisma.user.findUnique({ where: { email: user.email } });
        if (!existingUser) {
            await prisma.user.create({ data: user });
            console.log(`Seeded user: ${user.email} (${user.role})`);
        }
        else {
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
    console.log('Clearing existing houses...');
    await prisma.house.deleteMany({});
    console.log('Seeding Houses from JSON...');
    const houseDataPath = require('path').join(__dirname, 'data', 'house.json');
    let houseData;
    try {
        houseData = JSON.parse(require('fs').readFileSync(houseDataPath, 'utf-8'));
    }
    catch (err) {
        console.error('Failed to read house.json:', err);
        houseData = {};
    }
    const houseSeedData = [];
    for (const [key, house] of Object.entries(houseData)) {
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
//# sourceMappingURL=seed.js.map