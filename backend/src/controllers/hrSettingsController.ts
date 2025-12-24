import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// --- Role Settings ---
export const getRoles = async (req: Request, res: Response) => {
    try {
        const roles = await prisma.role.findMany({ orderBy: { name: 'asc' } });
        res.json(roles);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching roles' });
    }
};

export const createRole = async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });

        const role = await prisma.role.create({ data: { name } });
        res.status(201).json(role);
    } catch (error) {
        res.status(500).json({ error: 'Error creating role' });
    }
};

export const deleteRole = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.role.delete({ where: { id } });
        res.json({ message: 'Role deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting role' });
    }
};

export const updateRole = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });

        const role = await prisma.role.update({ where: { id }, data: { name } });
        res.json(role);
    } catch (error) {
        res.status(500).json({ error: 'Error updating role' });
    }
};

// --- HR Sites Settings ---
export const getHRSites = async (req: Request, res: Response) => {
    try {
        const sites = await prisma.hRSite.findMany({ orderBy: { name: 'asc' } });
        res.json(sites);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching HR sites' });
    }
};

export const createHRSite = async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });

        const site = await prisma.hRSite.create({ data: { name } });
        res.status(201).json(site);
    } catch (error) {
        res.status(500).json({ error: 'Error creating HR site' });
    }
};

export const deleteHRSite = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.hRSite.delete({ where: { id } });
        res.json({ message: 'HR site deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting HR site' });
    }
};

export const updateHRSite = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });

        const site = await prisma.hRSite.update({ where: { id }, data: { name } });
        res.json(site);
    } catch (error) {
        res.status(500).json({ error: 'Error updating HR site' });
    }
};

// --- Department Settings ---

export const getDepartments = async (req: Request, res: Response) => {
    try {
        const items = await prisma.department.findMany({ orderBy: { name: 'asc' } });
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching departments' });
    }
};

export const createDepartment = async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });

        const item = await prisma.department.create({ data: { name } });
        res.status(201).json(item);
    } catch (error) {
        res.status(500).json({ error: 'Error creating department' });
    }
};

export const deleteDepartment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.department.delete({ where: { id } });
        res.json({ message: 'Deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting department' });
    }
};

export const updateDepartment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });

        const item = await prisma.department.update({ where: { id }, data: { name } });
        res.json(item);
    } catch (error) {
        res.status(500).json({ error: 'Error updating department' });
    }
};

// --- JOB TITLES ---

export const getJobTitles = async (req: Request, res: Response) => {
    try {
        const items = await prisma.jobTitle.findMany({ orderBy: { name: 'asc' } });
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching job titles' });
    }
};

export const createJobTitle = async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });

        const item = await prisma.jobTitle.create({ data: { name } });
        res.status(201).json(item);
    } catch (error) {
        res.status(500).json({ error: 'Error creating job title' });
    }
};

export const deleteJobTitle = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.jobTitle.delete({ where: { id } });
        res.json({ message: 'Deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting job title' });
    }
};

export const updateJobTitle = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });

        const item = await prisma.jobTitle.update({ where: { id }, data: { name } });
        res.json(item);
    } catch (error) {
        res.status(500).json({ error: 'Error updating job title' });
    }
};

// --- PRINTERS ---
export const getPrinters = async (req: Request, res: Response) => {
    try {
        const printers = await prisma.printer.findMany({ orderBy: { name: 'asc' } });
        res.json(printers);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching printers' });
    }
};

export const createPrinter = async (req: Request, res: Response) => {
    try {
        const { name, type } = req.body;
        const printer = await prisma.printer.create({ data: { name, type } });
        res.status(201).json(printer);
    } catch (error) {
        res.status(500).json({ error: 'Error creating printer' });
    }
};

export const updatePrinter = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, type } = req.body;
        const printer = await prisma.printer.update({ where: { id }, data: { name, type } });
        res.json(printer);
    } catch (error) {
        res.status(500).json({ error: 'Error updating printer' });
    }
};

export const deletePrinter = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.printer.delete({ where: { id } });
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting printer' });
    }
};
