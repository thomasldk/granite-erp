import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateToken } from '../middleware/authMiddleware';

const prisma = new PrismaClient();

// LOGIN
export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // 1. Find User
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Identifiants invalides' });
        }

        // 2. Check Password
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Identifiants invalides' });
        }

        // 3. Generate Token
        const token = generateToken({ id: user.id, email: user.email, role: user.role });

        // 4. Return
        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Login Error", error);
        res.status(500).json({ error: 'Server error during login' });
    }
};

// GET CURRENT USER (ME)
export const getMe = async (req: Request | any, res: Response) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
        });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching user' });
    }
};

// SEED INITIAL ADMIN (Called manually or via hidden route for setup)
export const seedAdmin = async (req: Request, res: Response) => {
    try {
        const email = 'admin@granitedrc.com';
        const existing = await prisma.user.findUnique({ where: { email } });
        const hashedPassword = await bcrypt.hash('granite2025', 10);

        let user;
        if (existing) {
            user = await prisma.user.update({
                where: { email },
                data: { password: hashedPassword }
            });
            return res.json({ message: 'Admin password reset', user });
        } else {
            user = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    firstName: 'Admin',
                    lastName: 'Granite',
                    role: 'ADMIN'
                }
            });
            return res.json({ message: 'Admin user created', user });
        }
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
