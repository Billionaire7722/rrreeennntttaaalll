$env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5433/rental?schema=public"

cd d:/rental/backend

# Using Node.js directly to run the script
$script = @'
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

async function main() {
    const prisma = new PrismaClient();
    const hashedPassword = await bcrypt.hash("Admin@123", 10);
    
    const admin = await prisma.user.upsert({
        where: { email: "admin@rental.com" },
        update: {
            password: hashedPassword,
            role: "ADMIN",
            status: "ACTIVE",
            deleted_at: null
        },
        create: {
            name: "Admin User",
            username: "admin",
            email: "admin@rental.com",
            phone: "+84-123-456-789",
            password: hashedPassword,
            role: "ADMIN",
            status: "ACTIVE"
        }
    });
    
    console.log("Tao tai khoan admin thanh cong!");
    console.log("Email:", admin.email);
    console.log("Password: Admin@123");
    
    await prisma.$disconnect();
}

main().catch(console.error);
'@

# Write to temp file and execute
$tempFile = "$env:TEMP\create-admin-temp.js"
$script | Out-File -FilePath $tempFile -Encoding UTF8

node $tempFile

# Clean up
Remove-Item $tempFile -ErrorAction SilentlyContinue
