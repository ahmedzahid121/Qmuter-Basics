import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            user?: {
                uid: string;
                email?: string;
                role?: string;
                isAdmin?: boolean;
            };
        }
    }
}
export declare const authenticateUser: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const requireAdmin: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const optionalAuth: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const rateLimit: (maxRequests?: number, windowMs?: number) => (req: Request, res: Response, next: NextFunction) => void;
export declare const cors: (req: Request, res: Response, next: NextFunction) => void;
export declare const errorHandler: (error: Error, req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map