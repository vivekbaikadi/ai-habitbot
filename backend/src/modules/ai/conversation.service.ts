import { prisma } from "../../database/prisma.js";
import { AppError } from "../../common/errors/app.error.js";

export async function createConversation(
    userId: string
) {
    return prisma.aIConversation.create({
        data: {
            userId,
            title: "New conversation"
        },

        include: {
            messages: {
                orderBy: {
                    createdAt: "asc"
                }
            }
        }
    });
}

export async function getConversation(
    userId: string,
    conversationId: string
) {
    const conversation =
        await prisma.aIConversation.findFirst({
            where: {
                id: conversationId,
                userId
            },

            include: {
                messages: {
                    orderBy: {
                        createdAt: "asc"
                    }
                }
            }
        });

    if (!conversation) {
        throw new AppError(
            "Conversation not found",
            404,
            "CONVERSATION_NOT_FOUND"
        );
    }

    return conversation;
}

export async function listConversations(userId: string) {
  return prisma.aIConversation.findMany({
    where: {
      userId,
      messages: {
        some: {},
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          messages: true,
        },
      },
    },
  });
}

export async function deleteConversation(
  userId: string,
  conversationId: string
) {
  const result = await prisma.aIConversation.deleteMany({
    where: {
      id: conversationId,
      userId,
    },
  });

  if (result.count === 0) {
    throw new AppError(
      "Conversation not found",
      404,
      "CONVERSATION_NOT_FOUND"
    );
  }

  return { id: conversationId };
}