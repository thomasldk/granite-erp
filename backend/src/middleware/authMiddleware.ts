import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// SECRET (To be moved to .env in production)
const JWT_SECRET = process.env.JWT_SECRET || 'granite-erp-super-secret-key-2025';
const AGENT_API_KEY = process.env.AGENT_API_KEY || 'GRANITE_AGENT_KEY_V527_SECURE';

interface AuthRequest extends Request {
    user?: any;
    isAgent?: boolean;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
    // 1. Check for Agent API Key
    const apiKey = req.headers['x-api-key'];
    if (apiKey === AGENT_API_KEY) {
        req.isAgent = true;
        req.user = { role: 'AGENT' };
        return next();
    }


    // 2. Check for User Token
    let token = '';
    const authHeader = req.headers.authorization;

    if (authHeader) {
        token = authHeader.split(' ')[1]; // Bearer <token>
    } else if (req.query.token) {
        // Fallback: Check Query Param (for file downloads)
        token = req.query.token as string;
    }

    if (token) {
        jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
            if (err) {
                return res.status(403).json({ error: 'Token invalid or expired' });
            }
            req.user = user;
            req.isAgent = false;
            next();
        });
    } else {
        // No Token, No API Key
        res.status(401).json({ error: 'Unauthorized: Login or API Key required' });
    }

};

export const generateToken = (user: { id: string, email: string, role: string }) => {
    return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' }); // 7 days session
};
