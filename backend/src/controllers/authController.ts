import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateToken } from '../middleware/authMiddleware';
import crypto from 'crypto';
import { Resend } from 'resend';

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

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

        // 3.5 Fetch full profile for response
        const fullUser = await prisma.user.findUnique({
            where: { id: user.id },
            include: { employeeProfile: true }
        });

        // 4. Return
        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                employeeProfile: fullUser?.employeeProfile
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
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: { employeeProfile: true }
        });
        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            employeeProfile: user.employeeProfile
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

// FORGOT PASSWORD (Generate Token & Email)
export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            // Security: Don't reveal if user exists or not, just say "If email exists..."
            // But for internal ERP friendliness, usually we can be explicit or vague.
            // Let's be helpful:
            return res.status(404).json({ error: 'Aucun utilisateur trouvé avec cette adresse courriel.' });
        }

        // Generate Token
        // 32 bytes hex string
        const resetToken = crypto.randomBytes(32).toString('hex');
        // Expiry: 1 Hour from now
        const resetTokenExpiry = new Date(Date.now() + 3600000);

        // Update User
        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken,
                resetTokenExpiry
            }
        });

        // Send Email
        // Construct Link: http://localhost:5173/reset-password?token=XYZ
        // Ideally from env, but assuming standard vite dev port or prod url
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173'; // Fallback Dev
        const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;

        const emailHtml = `
            <p>Bonjour ${user.firstName || 'Utilisateur'},</p>
            <p>Vous avez demandé une réinitialisation de votre mot de passe.</p>
            <p>Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe (valide 1 heure) :</p>
            <p><a href="${resetLink}">Réinitialiser mon mot de passe</a></p>
            <p>Si vous n'êtes pas à l'origine de cette demande, veuillez ignorer ce message.</p>
        `;

        try {
            await resend.emails.send({
                from: 'Support Granite ERP <onboarding@resend.dev>',
                to: [email], // In Resend Dev Mode, this must be YOUR verification email.
                // If user is different, it might fail in Dev Mode unless Verified Domain.
                // Assuming 'thomasldk@granitedrc.com' for now or the user's email works if verified.
                subject: 'Réinitialisation de mot de passe',
                html: emailHtml
            });
            res.json({ message: 'Un courriel de réinitialisation a été envoyé.' });
        } catch (emailErr: any) {
            console.error("Email Error:", emailErr);
            res.status(500).json({ error: "Erreur lors de l'envoi du courriel." });
        }

    } catch (error) {
        console.error("Forgot Password Error:", error);
        res.status(500).json({ error: 'Server Error' });
    }
};

// RESET PASSWORD (Use Token & Update Password)
export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ error: 'Token et nouveau mot de passe requis.' });
        }

        // Find User with Valid Token
        // Token must match AND Expiry must be in future
        const user = await prisma.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExpiry: {
                    gt: new Date() // Greater Than Now
                }
            }
        });

        if (!user) {
            return res.status(400).json({ error: 'Le lien est invalide ou a expiré.' });
        }

        // Hash New Password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update User & Clear Token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null
            }
        });

        res.json({ message: 'Mot de passe modifié avec succès. Vous pouvez maintenant vous connecter.' });

    } catch (error) {
        console.error("Reset Password Error:", error);
        res.status(500).json({ error: 'Server Error' });
    }
};
