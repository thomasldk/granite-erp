"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedAdmin = exports.getMe = exports.login = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const prisma = new client_1.PrismaClient();
// LOGIN
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        // 1. Find User
        const user = yield prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Identifiants invalides' });
        }
        // 2. Check Password
        const isValid = yield bcryptjs_1.default.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Identifiants invalides' });
        }
        // 3. Generate Token
        const token = (0, authMiddleware_1.generateToken)({ id: user.id, email: user.email, role: user.role });
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
    }
    catch (error) {
        console.error("Login Error", error);
        res.status(500).json({ error: 'Server error during login' });
    }
});
exports.login = login;
// GET CURRENT USER (ME)
const getMe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        res.json({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Error fetching user' });
    }
});
exports.getMe = getMe;
// SEED INITIAL ADMIN (Called manually or via hidden route for setup)
const seedAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const email = 'admin@granitedrc.com';
        const existing = yield prisma.user.findUnique({ where: { email } });
        const hashedPassword = yield bcryptjs_1.default.hash('granite2025', 10);
        let user;
        if (existing) {
            user = yield prisma.user.update({
                where: { email },
                data: { password: hashedPassword }
            });
            return res.json({ message: 'Admin password reset', user });
        }
        else {
            user = yield prisma.user.create({
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
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.seedAdmin = seedAdmin;
