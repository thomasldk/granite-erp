"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// SECRET (To be moved to .env in production)
const JWT_SECRET = process.env.JWT_SECRET || 'granite-erp-super-secret-key-2025';
const AGENT_API_KEY = process.env.AGENT_API_KEY || 'GRANITE_AGENT_KEY_V527_SECURE';
const authenticate = (req, res, next) => {
    // 1. Check for Agent API Key
    const apiKey = req.headers['x-api-key'];
    if (apiKey === AGENT_API_KEY) {
        req.isAgent = true;
        req.user = { role: 'AGENT' };
        return next();
    }
    // 2. Check for User Token
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1]; // Bearer <token>
        jsonwebtoken_1.default.verify(token, JWT_SECRET, (err, user) => {
            if (err) {
                return res.status(403).json({ error: 'Token invalid or expired' });
            }
            req.user = user;
            req.isAgent = false;
            next();
        });
    }
    else {
        // No Token, No API Key
        res.status(401).json({ error: 'Unauthorized: Login or API Key required' });
    }
};
exports.authenticate = authenticate;
const generateToken = (user) => {
    return jsonwebtoken_1.default.sign(user, JWT_SECRET, { expiresIn: '7d' }); // 7 days session
};
exports.generateToken = generateToken;
