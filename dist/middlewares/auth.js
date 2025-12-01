"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));

/**
 * Middleware function to authenticate a JWT token from the request headers.
 * 
 * This function checks for the presence of an authorization header in the request,
 * extracts the JWT token, and verifies it using the secret stored in `process.env.JWT_SECRET`.
 * If the token is missing or invalid, it responds with an appropriate error status and message.
 * If valid, it attaches the decoded user object to `req.user` and proceeds to the next middleware.
 * 
 * @param {Object} req - The Express request object. Expected to have headers with 'authorization'.
 * @param {Object} res - The Express response object. Used to send error responses if authentication fails.
 * @param {Function} next - The next middleware function in the Express chain. Called if authentication succeeds.
 * @returns {void} This function does not return a value; it either sends a response or calls next().
 * @throws {Error} Throws an error if token verification fails internally (handled within the function).
 */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        console.warn('⚠️ [AUTH] Token no proporcionado');
        return res.status(401).json({ error: 'Token de acceso requerido' });
    }
    jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.error('❌ [AUTH] Token inválido:', err.message);
            return res.status(403).json({ error: 'Token inválido' });
        }
        req.user = user;
        next();
    });
};
exports.authenticateToken = authenticateToken;
