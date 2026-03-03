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
const bcrypt = __importStar(require("bcrypt"));
const roles_enum_1 = require("../security/roles.enum");
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/rental?schema=public';
const pool = new pg_1.Pool({ connectionString });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    console.log('Seed: Start isolating SUPER_ADMIN account...');
    const existingSuperAdmins = await prisma.user.findMany({
        where: { role: roles_enum_1.Role.SUPER_ADMIN }
    });
    if (existingSuperAdmins.length > 0) {
        console.log(`Found ${existingSuperAdmins.length} existing SUPER_ADMIN(s). Demoting to ADMIN...`);
        await prisma.user.updateMany({
            where: { role: roles_enum_1.Role.SUPER_ADMIN },
            data: { role: roles_enum_1.Role.ADMIN }
        });
    }
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'ceo@rentalapp.com';
    const superAdminUsername = process.env.SUPER_ADMIN_USERNAME || 'superadmin_ceo';
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;
    if (!superAdminPassword) {
        throw new Error('SUPER_ADMIN_PASSWORD is required for seed-super-admin');
    }
    console.log(`Creating definitive SUPER_ADMIN: ${superAdminEmail}`);
    const hashedPassword = await bcrypt.hash(superAdminPassword, 10);
    const superAdmin = await prisma.user.upsert({
        where: { email: superAdminEmail },
        update: {
            role: roles_enum_1.Role.SUPER_ADMIN,
            status: 'ACTIVE',
            deleted_at: null,
            password: hashedPassword
        },
        create: {
            name: 'Master System Administrator',
            username: superAdminUsername,
            email: superAdminEmail,
            password: hashedPassword,
            role: roles_enum_1.Role.SUPER_ADMIN,
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
//# sourceMappingURL=seed-super-admin.js.map