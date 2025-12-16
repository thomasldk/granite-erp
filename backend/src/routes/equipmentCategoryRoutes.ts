import express from 'express';
// import { PrismaClient } from '@prisma/client';
import prisma from '../prisma';

const router = express.Router();
// const prisma = new PrismaClient();

// Get all categories
router.get('/', async (req, res) => {
    try {
        const categories = await prisma.equipmentCategory.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// Create category
router.post('/', async (req, res) => {
    try {
        const { name } = req.body;
        const category = await prisma.equipmentCategory.create({
            data: { name }
        });
        res.json(category);
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ error: 'Failed to create category' });
    }
});

export default router;
