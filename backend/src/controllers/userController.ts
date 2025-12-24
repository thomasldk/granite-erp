
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// GET all users
export const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true,
                employeeProfile: true // Include profile
            },
            orderBy: {
                lastName: 'asc'
            }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching users' });
    }
};

// GET single user
export const getUserById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true,
                employeeProfile: true
            }
        });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching user' });
    }
};

// CREATE user
export const createUser = async (req: Request, res: Response) => {
    try {
        const { firstName, lastName, email, password, role, employeeProfile } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        let profileData = undefined;
        if (employeeProfile) {
            profileData = prepareProfileData(employeeProfile);
        }

        const user = await prisma.user.create({
            data: {
                firstName,
                lastName,
                email,
                password: hashedPassword,
                role: role || 'USER',
                employeeProfile: profileData ? {
                    create: profileData
                } : undefined
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                employeeProfile: true
            }
        });

        res.status(201).json(user);
    } catch (error: any) {
        console.error("Create User Error:", error);
        res.status(500).json({ error: error.message || 'Error creating user' });
    }
};

// Helper to sanitize and format profile data
const prepareProfileData = (profileData: any) => {
    if (!profileData) return undefined;

    const data = { ...profileData };

    // Convert dates
    ['dob', 'dateHired', 'dateDeparted'].forEach(field => {
        if (data[field]) {
            data[field] = new Date(data[field]);
        } else {
            data[field] = null;
        }
    });

    // Convert numbers
    if (data.vacationDays !== undefined && data.vacationDays !== null) {
        data.vacationDays = parseInt(data.vacationDays, 10);
    }
    if (data.vacationBalance !== undefined && data.vacationBalance !== null) {
        data.vacationBalance = parseFloat(data.vacationBalance);
    }
    if (data.employeeNumber && data.employeeNumber.trim() === '') data.employeeNumber = null;

    // Explicitly remove system fields that cannot be updated directly via nested write
    delete data.id;
    delete data.userId;
    delete data.createdAt;
    delete data.updatedAt;

    // Log the prepared data for debugging
    console.log("Prepared Profile Data:", data);

    return data;
};

// UPDATE user
export const updateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, email, password, role, employeeProfile } = req.body;

        const dataToUpdate: any = {
            firstName,
            lastName,
            email,
            role
        };

        // Only hash and update password if provided
        if (password && password.trim() !== '') {
            dataToUpdate.password = await bcrypt.hash(password, 10);
        }

        // Handle nested update for profile
        if (employeeProfile) {
            const formattedProfile = prepareProfileData(employeeProfile);
            dataToUpdate.employeeProfile = {
                upsert: {
                    create: formattedProfile,
                    update: formattedProfile
                }
            };
        }

        const user = await prisma.user.update({
            where: { id },
            data: dataToUpdate,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                employeeProfile: true
            }
        });

        res.json(user);
    } catch (error: any) {
        console.error("Update User Error:", error);
        res.status(500).json({ error: error.message || 'Error updating user' });
    }
};

// DELETE user
export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Prevent deleting self? (Optional check, but good practice)
        // const currentUser = (req as any).user;
        // if (currentUser && currentUser.id === id) return res.status(400).json({ error: 'Cannot delete yourself' });

        await prisma.user.delete({ where: { id } });
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting user' });
    }
};
