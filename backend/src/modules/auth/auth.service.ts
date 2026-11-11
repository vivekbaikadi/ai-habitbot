import { prisma } from "../../database/prisma.js";
import {
    comparePassword,
    hashPassword
} from "../../common/utils/password.js";

import { AppError } from "../../common/errors/app.error.js";

import type {
    AuthResponse,
    AuthUser
} from "./auth.types.js";
import type {
    RegisterInput,
    LoginInput
} from "./auth.schema.js";

import crypto from "node:crypto";

import {
  verifyRefreshToken,
  signAccessToken,
  signRefreshToken
} from "../../common/utils/jwt.js";

function hashRefreshToken(token: string): string {
    return crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
}

function getRefreshTokenExpiry(): Date {
    const expiresAt = new Date();

    expiresAt.setDate(expiresAt.getDate() + 30);

    return expiresAt;
}

function getRefreshSessionExpiry(): Date {
  const expiresAt = new Date();

  expiresAt.setDate(expiresAt.getDate() + 30);

  return expiresAt;
}

function toAuthUser(user: {
    id: string;
    name: string;
    email: string;
}): AuthUser {
    return {
        id: user.id,
        name: user.name,
        email: user.email
    };
}

function getSessionMetadata(
    userAgent?: string,
    ipAddress?: string
): {
    userAgent?: string;
    ipAddress?: string;
} {
    return {
        ...(userAgent !== undefined && { userAgent }),
        ...(ipAddress !== undefined && { ipAddress })
    };
}

export async function registerUser(
    input: RegisterInput,
    userAgent?: string,
    ipAddress?: string
): Promise<AuthResponse> {
    const existingUser = await prisma.user.findUnique({
        where: {
            email: input.email
        }
    });

    if (existingUser) {
        throw new AppError(
            "An account with this email already exists",
            409,
            "EMAIL_ALREADY_EXISTS"
        );
    }

    const passwordHash = await hashPassword(input.password);

    const user = await prisma.user.create({
        data: {
            name: input.name,
            email: input.email,
            passwordHash
        }
    });

    const session = await prisma.refreshSession.create({
        data: {
            userId: user.id,
            tokenHash: "pending",
            expiresAt: getRefreshTokenExpiry(),
            ...getSessionMetadata(userAgent, ipAddress)
        }
    });

    const accessToken = signAccessToken(user.id);

    const refreshToken = signRefreshToken(
        user.id,
        session.id
    );

    await prisma.refreshSession.update({
        where: {
            id: session.id
        },
        data: {
            tokenHash: hashRefreshToken(refreshToken)
        }
    });

    return {
        user: toAuthUser(user),
        accessToken,
        refreshToken
    };
}

export async function loginUser(
    input: LoginInput,
    userAgent?: string,
    ipAddress?: string
): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({
        where: {
            email: input.email
        }
    });

    if (!user) {
        throw new AppError(
            "Invalid email or password",
            401,
            "INVALID_CREDENTIALS"
        );
    }

    const passwordValid = await comparePassword(
        input.password,
        user.passwordHash
    );

    if (!passwordValid) {
        throw new AppError(
            "Invalid email or password",
            401,
            "INVALID_CREDENTIALS"
        );
    }

    const session = await prisma.refreshSession.create({
        data: {
            userId: user.id,
            tokenHash: "pending",
            expiresAt: getRefreshTokenExpiry(),
            ...getSessionMetadata(userAgent, ipAddress)
        }
    });

    const accessToken = signAccessToken(user.id);

    const refreshToken = signRefreshToken(
        user.id,
        session.id
    );

    await prisma.refreshSession.update({
        where: {
            id: session.id
        },
        data: {
            tokenHash: hashRefreshToken(refreshToken)
        }
    });

    return {
        user: toAuthUser(user),
        accessToken,
        refreshToken
    };
}

export async function getCurrentUser(
  userId: string
): Promise<AuthUser> {
  const user = await prisma.user.findUnique({
    where: {
      id: userId
    }
  });

  if (!user) {
    throw new AppError(
      "User not found",
      404,
      "USER_NOT_FOUND"
    );
  }

  return toAuthUser(user);
}

export async function refreshAccessToken(
  refreshToken: string,
  userAgent?: string,
  ipAddress?: string
): Promise<AuthResponse> {
  let payload;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(
      "Invalid or expired refresh token",
      401,
      "INVALID_REFRESH_TOKEN"
    );
  }

  const session = await prisma.refreshSession.findUnique({
    where: {
      id: payload.sessionId
    },
    include: {
      user: true
    }
  });

  if (!session) {
    throw new AppError(
      "Refresh session not found",
      401,
      "INVALID_REFRESH_SESSION"
    );
  }

  if (session.revokedAt) {
    throw new AppError(
      "Refresh session has been revoked",
      401,
      "REFRESH_SESSION_REVOKED"
    );
  }

  if (session.expiresAt <= new Date()) {
    throw new AppError(
      "Refresh session has expired",
      401,
      "REFRESH_SESSION_EXPIRED"
    );
  }

  const incomingTokenHash = hashRefreshToken(refreshToken);

  if (incomingTokenHash !== session.tokenHash) {
    throw new AppError(
      "Invalid refresh token",
      401,
      "INVALID_REFRESH_TOKEN"
    );
  }

  if (session.userId !== payload.sub) {
    throw new AppError(
      "Invalid refresh token",
      401,
      "INVALID_REFRESH_TOKEN"
    );
  }

  const newSession = await prisma.refreshSession.create({
    data: {
      userId: session.userId,
      tokenHash: "pending",
      expiresAt: getRefreshTokenExpiry(),
      ...getSessionMetadata(userAgent, ipAddress)
    }
  });

  const newAccessToken = signAccessToken(
    session.userId
  );

  const newRefreshToken = signRefreshToken(
    session.userId,
    newSession.id
  );

  await prisma.$transaction([
    prisma.refreshSession.update({
      where: {
        id: session.id
      },
      data: {
        revokedAt: new Date()
      }
    }),

    prisma.refreshSession.update({
      where: {
        id: newSession.id
      },
      data: {
        tokenHash: hashRefreshToken(newRefreshToken)
      }
    })
  ]);

  return {
    user: toAuthUser(session.user),
    accessToken: newAccessToken,
    refreshToken: newRefreshToken
  };
}

export async function logoutUser(
  refreshToken: string
): Promise<void> {
  let payload;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(
      "Invalid refresh token",
      401,
      "INVALID_REFRESH_TOKEN"
    );
  }

  const session = await prisma.refreshSession.findUnique({
    where: {
      id: payload.sessionId
    }
  });

  if (!session) {
    return;
  }

  if (session.revokedAt) {
    return;
  }

  const incomingTokenHash = hashRefreshToken(refreshToken);

  if (incomingTokenHash !== session.tokenHash) {
    throw new AppError(
      "Invalid refresh token",
      401,
      "INVALID_REFRESH_TOKEN"
    );
  }

  await prisma.refreshSession.update({
    where: {
      id: session.id
    },
    data: {
      revokedAt: new Date()
    }
  });
}