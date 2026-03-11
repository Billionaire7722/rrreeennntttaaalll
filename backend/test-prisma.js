const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Models available in prisma:');
  console.log(Object.keys(prisma).filter(k => !k.startsWith('$') && !k.startsWith('_')));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
