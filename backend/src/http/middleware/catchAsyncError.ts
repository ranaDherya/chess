import { Request, Response, NextFunction } from "express";

const asyncHandler =
  (thisFunc: (req: Request, res: Response, next: NextFunction) => void) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(thisFunc(req, res, next)).catch(next);
  };

export default asyncHandler;
