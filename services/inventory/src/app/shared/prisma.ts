// import { PrismaPg } from "@prisma/adapter-pg";
// import "dotenv/config";
// import { PrismaClient } from "../../../src/generated/prisma/client";

// // DATABASE_URL চেক
// const connectionString = process.env.DATABASE_URL!;
// console.log("DATABASE_URL:", connectionString);

// const adapter = new PrismaPg({ connectionString });
// const prisma = new PrismaClient({ adapter } as any);

// // ডাটাবেস কানেকশন চেকের জন্য ফাংশন
// async function testConnection() {
//   try {
//     await prisma.$connect(); // Prisma Client connect করে
//     console.log("✅ Database connected successfully!");
//   } catch (error) {
//     console.error("❌ Database connection failed:", error);
//   }
// }

// testConnection(); // ফাংশন কল

// export { prisma };
