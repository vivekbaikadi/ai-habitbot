import jwt, {
  type SignOptions,
  type JwtPayload
} from "jsonwebtoken";

import { env } from "../../config/env.js";

export interface AccessTokenPayload {
  sub: string;
  type: "access";
}

export interface RefreshTokenPayload {
  sub: string;
  type: "refresh";
  sessionId: string;
}

export function signAccessToken(userId: string): string {
  const payload: AccessTokenPayload = {
    sub: userId,
    type: "access"
  };

  return jwt.sign(
    payload,
    env.JWT_ACCESS_SECRET,
    {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"] & {}
    }
  );
}

export function signRefreshToken(
  userId: string,
  sessionId: string
): string {
  const payload: RefreshTokenPayload = {
    sub: userId,
    type: "refresh",
    sessionId
  };

  return jwt.sign(
    payload,
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"] & {}
    }
  );
}

export function verifyAccessToken(
  token: string
): AccessTokenPayload {
  const decoded = jwt.verify(
    token,
    env.JWT_ACCESS_SECRET
  ) as JwtPayload & AccessTokenPayload;

  if (
    decoded.type !== "access" ||
    typeof decoded.sub !== "string"
  ) {
    throw new Error("Invalid access token");
  }

  return {
    sub: decoded.sub,
    type: "access"
  };
}

export function verifyRefreshToken(
  token: string
): RefreshTokenPayload {
  const decoded = jwt.verify(
    token,
    env.JWT_REFRESH_SECRET
  ) as JwtPayload & RefreshTokenPayload;

  if (
    decoded.type !== "refresh" ||
    typeof decoded.sub !== "string" ||
    typeof decoded.sessionId !== "string"
  ) {
    throw new Error("Invalid refresh token");
  }

  return {
    sub: decoded.sub,
    type: "refresh",
    sessionId: decoded.sessionId
  };
}