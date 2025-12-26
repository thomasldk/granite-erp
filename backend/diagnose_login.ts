
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function diagnose() {
    console.log("Starting diagnosis...");

    // 1. Check DB Connection
    try {
        await prisma.$connect();
        console.log("✅ Database Connected");
    } catch (e) {
        console.error("❌ Database Connection Failed:", e);
        return;
    }

    // 2. Check User
    const email = 'admin@granitedrc.com';
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        console.log("❌ User not found:", email);
    } else {
        console.log("✅ User found:", user.email, "Role:", user.role);

        // 3. Check Password
        const isValid = await bcrypt.compare('granite2025', user.password);
        console.log("Password Valid ('granite2025'):", isValid ? "YES" : "NO");
    }

    // 4. Check Environment
    console.log("JWT_SECRET present:", !!process.env.JWT_SECRET);

    await prisma.$disconnect();
}

diagnose();
