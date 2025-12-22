
import prisma from './src/prisma';
import bcrypt from 'bcryptjs';

async function resetAdmin() {
    console.log("🔒 Resetting Admin Password...");
    const email = 'admin@granitedrc.com';
    const hashedPassword = await bcrypt.hash('password123', 10);

    const user = await prisma.user.upsert({
        where: { email },
        update: { password: hashedPassword },
        create: {
            email,
            password: hashedPassword,
            firstName: 'Admin',
            lastName: 'Granite',
            role: 'ADMIN'
        }
    });

    console.log(`✅ Admin (${email}) password set to: password123`);
}

resetAdmin()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
