// import type { Request, Response, NextFunction } from "express";

// import { verifyAccessToken } from "../utils/jwt.js";
// import { AppError } from "../errors/app.error.js";

// export interface AuthenticatedRequest extends Request {
//   user: {
//     id: string;
//   };
// }

// export function authMiddleware(
//   req: Request,
//   _res: Response,
//   next: NextFunction
// ): void {
//   try {
//     const authorization = req.headers.authorization;

//     if (!authorization) {
//       throw new AppError(
//         "Authentication required",
//         401,
//         "AUTHENTICATION_REQUIRED"
//       );
//     }

//     const [scheme, token] = authorization.split(" ");

//     if (scheme !== "Bearer" || !token) {
//       throw new AppError(
//         "Invalid authorization header",
//         401,
//         "INVALID_AUTHORIZATION_HEADER"
//       );
//     }

//     const payload = verifyAccessToken(token);

//     (req as AuthenticatedRequest).user = {
//       id: payload.sub
//     };

//     next();
//   } catch (error) {
//     next(error);
//   }
// }




import type {
  Request,
  Response,
  NextFunction
} from "express";

import {
  verifyAccessToken
} from "../utils/jwt.js";

import {
  AppError
} from "../errors/app.error.js";

export interface AuthenticatedRequest
  extends Request {
  user: {
    id: string;
  };
}

export function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.get("authorization");

    if (!authHeader) {
      throw new AppError(
        "Authentication required",
        401,
        "AUTHENTICATION_REQUIRED"
      );
    }

    const [scheme, token] =
      authHeader.split(" ");

    if (
      scheme !== "Bearer" ||
      !token
    ) {
      throw new AppError(
        "Invalid authorization header",
        401,
        "INVALID_ACCESS_TOKEN"
      );
    }

    let payload;

    try {
      payload = verifyAccessToken(token);
    } catch {
      throw new AppError(
        "Invalid or expired access token",
        401,
        "INVALID_ACCESS_TOKEN"
      );
    }

    const authenticatedRequest =
      req as AuthenticatedRequest;

    authenticatedRequest.user = {
      id: payload.sub
    };

    next();
  } catch (error) {
    next(error);
  }
}