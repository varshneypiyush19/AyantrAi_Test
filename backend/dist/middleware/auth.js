"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateJWT = authenticateJWT;
exports.requireRole = requireRole;
const auth_1 = require("../utils/auth");
function authenticateJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: Access token is missing or invalid' });
    }
    const token = authHeader.split(' ')[1];
    const payload = (0, auth_1.verifyToken)(token);
    if (!payload) {
        return res.status(403).json({ error: 'Forbidden: Access token has expired or is invalid' });
    }
    req.user = payload;
    next();
}
function requireRole(roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: `Forbidden: User does not have access to this resource (${roles.join(', ')} required)` });
        }
        next();
    };
}
