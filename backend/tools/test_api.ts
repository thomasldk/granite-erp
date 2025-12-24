
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key';
const PORT = process.env.PORT || 5006;
const BASE_URL = `http://127.0.0.1:${PORT}/api`;

async function main() {
    console.log('🔍 Checking User table...');
    let user = await prisma.user.findFirst({ where: { email: 'admin@granitedrc.com' } });

    if (!user) {
        console.log('⚠️ No admin user found. Creating generic admin...');
        const hashedPassword = await bcrypt.hash('granite2025', 10);
        user = await prisma.user.create({
            data: {
                email: 'admin@granitedrc.com',
                password: hashedPassword,
                firstName: 'Admin',
                lastName: 'Test',
                role: 'ADMIN'
            }
        });
        console.log('✅ Created admin user.');
    } else {
        console.log('✅ Found admin user:', user.email);
    }

    // Generate Token
    const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '1h' }
    );
    console.log('🔑 Generated Token:', token.substring(0, 20) + '...');

    // Test API
    try {
        console.log(`📡 Testing GET ${BASE_URL}/work-orders...`);
        const response = await axios.get(`${BASE_URL}/work-orders`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ API Success!');
        console.log('📊 WorkOrders Count:', response.data.length);
        if (response.data.length > 0) {
            console.log('📝 First WorkOrder ID:', response.data[0].id);
        } else {
            console.log('⚠️ No WorkOrders returned (Status 200)');
        }

    } catch (e: any) {
        console.error('❌ API Failed:', e.message);
        if (e.response) {
            console.error('Status:', e.response.status);
            console.error('Data:', e.response.data);
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
