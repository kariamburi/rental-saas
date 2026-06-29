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

    await prisma.user.upsert({
        where: { email: "admin@craftinventors.co.ke" },
        update: {
            companyId: null,
            name: "Admin",
            password,
            role: "SUPER_ADMIN",
            status: "ACTIVE",
        },
        create: {
            companyId: null,
            name: "Admin",
            email: "admin@craftinventors.co.ke",
            password,
            role: "SUPER_ADMIN",
            status: "ACTIVE",
        },
    });

    await prisma.subscriptionPlan.upsert({
        where: { name: "Trial" },
        update: {
            monthlyFee: 0,
            propertyLimit: 1,
            unitLimit: 20,
            active: true,
        },
        create: {
            name: "Trial",
            monthlyFee: 0,
            propertyLimit: 1,
            unitLimit: 20,
            active: true,
        },
    });

    await prisma.subscriptionPlan.upsert({
        where: { name: "Starter" },
        update: {
            monthlyFee: 2000,
            propertyLimit: 1,
            unitLimit: 20,
            active: true,
        },
        create: {
            name: "Starter",
            monthlyFee: 2000,
            propertyLimit: 1,
            unitLimit: 20,
            active: true,
        },
    });

    await prisma.subscriptionPlan.upsert({
        where: { name: "Growth" },
        update: {
            monthlyFee: 5000,
            propertyLimit: 5,
            unitLimit: 100,
            active: true,
        },
        create: {
            name: "Growth",
            monthlyFee: 5000,
            propertyLimit: 5,
            unitLimit: 100,
            active: true,
        },
    });

    await prisma.subscriptionPlan.upsert({
        where: { name: "Pro" },
        update: {
            monthlyFee: 10000,
            propertyLimit: null,
            unitLimit: 300,
            active: true,
        },
        create: {
            name: "Pro",
            monthlyFee: 10000,
            propertyLimit: null,
            unitLimit: 300,
            active: true,
        },
    });

    console.log("Seed completed");
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });