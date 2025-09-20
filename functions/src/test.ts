import { Request, Response } from 'express';

export const test = (req: Request, res: Response) => {
  console.log('Test function called');
  res.json({
    success: true,
    message: 'Test function working',
    timestamp: new Date().toISOString()
  });
};
