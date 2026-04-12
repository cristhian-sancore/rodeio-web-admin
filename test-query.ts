import { prisma } from "./src/lib/db";

async function main() {
  const users = await prisma.user.findMany();
  console.log("USERS IN DB:", users.length);
  users.forEach(u => console.log("-", u.username));
  
  const competitors = await prisma.competidor.findMany();
  console.log("COMPETIDORES IN DB:", competitors.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());
