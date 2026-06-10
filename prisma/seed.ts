import bcrypt from "bcryptjs";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
    const password = await bcrypt.hash("admin123", 10);

    const company = await prisma.company.upsert({
        where: { id: "main-company" },
        update: {},
        create: {
            id: "main-company",
            name: "Craft Inventors",
            email: "admin@craftinventors.co.ke",
            phone: "+254700000000",
            address: "Kenya",
        },
    });

    await prisma.user.upsert({
        where: { email: "admin@craftinventors.co.ke" },
        update: {},
        create: {
            companyId: company.id,
            name: "Admin",
            email: "admin@craftinventors.co.ke",
            password,
            role: "SUPER_ADMIN",
        },
    });

    console.log("Seed completed");
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });