import type {
  Request,
  Response,
  NextFunction,
} from "express";

import type {
  AuthenticatedRequest,
} from "../../common/middleware/auth.middleware.js";

import {
  listConversations,
  getConversation,
  deleteConversation,
} from "./conversation.service.js";

import { AppError } from "../../common/errors/app.error.js";

function getUserId(req: Request): string {
  return (req as AuthenticatedRequest).user.id;
}

function getConversationId(req: Request): string {
  const { id } = req.params;

  if (!id || Array.isArray(id)) {
    throw new AppError(
      "Invalid conversation ID",
      400,
      "INVALID_CONVERSATION_ID"
    );
  }

  return id;
}

export async function list(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const conversations = await listConversations(
      getUserId(req)
    );

    res.status(200).json({
      success: true,
      data: {
        conversations,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getOne(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const conversation = await getConversation(
      getUserId(req),
      getConversationId(req)
    );

    res.status(200).json({
      success: true,
      data: {
        conversation,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function remove(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await deleteConversation(
      getUserId(req),
      getConversationId(req)
    );

    res.status(200).json({
      success: true,
      message: "Conversation deleted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}