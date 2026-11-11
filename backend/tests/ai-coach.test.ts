import {
  describe,
  expect,
  it,
  beforeEach,
  vi
} from "vitest";

import request from "supertest";

import app from "../src/app.js";
import { prisma } from "../src/database/prisma.js";

import { cleanDatabase } from "./helpers/db.js";

import {
  hashPassword
} from "../src/common/utils/password.js";

import {
  signAccessToken
} from "../src/common/utils/jwt.js";

/*
 * --------------------------------------------------
 * Gemini mocks
 * --------------------------------------------------
 *
 * vi.mock() is hoisted by Vitest.
 *
 * Therefore the mock functions must be created
 * with vi.hoisted().
 * --------------------------------------------------
 */

const {
  mockSendMessage,
  mockCreateChat
} = vi.hoisted(() => {
  const mockSendMessage =
    vi.fn();

  const mockCreateChat =
    vi.fn(() => ({
      sendMessage:
        mockSendMessage
    }));

  return {
    mockSendMessage,
    mockCreateChat
  };
});

vi.mock(
  "../src/common/ai/gemini.client.js",
  () => ({
    gemini: {
      chats: {
        create:
          mockCreateChat
      }
    }
  })
);

describe("AI Coach API", () => {
  let userId: string;
  let accessToken: string;

  beforeEach(async () => {
    await cleanDatabase();

    vi.clearAllMocks();

    const passwordHash =
      await hashPassword(
        "TestPassword123!"
      );

    const user =
      await prisma.user.create({
        data: {
          name: "AI Coach User",
          email:
            "ai-coach@habitbot.dev",
          passwordHash
        }
      });

    userId = user.id;

    await prisma.userProfile.create({
      data: {
        userId,
        timezone: "Asia/Kolkata",
        primaryGoal:
          "GENERAL_HEALTH",
        activityLevel:
          "MODERATE"
      }
    });

    accessToken =
      signAccessToken(userId);
  });

  /*
   * --------------------------------------------------
   * Helper
   * --------------------------------------------------
   */

  function mockSuccessfulGeminiResponse(
    message =
      "Keep going! You are doing well.",
    priorities: Array<{
      type:
        | "HABIT"
        | "NUTRITION"
        | "GOAL"
        | "GENERAL";
      title: string;
      reason: string;
    }> = []
  ) {
    mockSendMessage.mockResolvedValueOnce({
      text: JSON.stringify({
        message,
        priorities
      }),
      functionCalls: []
    });
  }

  describe(
    "POST /api/v1/ai/coach",
    () => {

      it(
        "requires authentication",
        async () => {
          const response =
            await request(app)
              .post(
                "/api/v1/ai/coach"
              )
              .send({
                message:
                  "How am I doing today?"
              });

          expect(
            response.status
          ).toBe(401);

          expect(
            response.body.success
          ).toBe(false);

          expect(
            mockCreateChat
          ).not.toHaveBeenCalled();
        }
      );

      it(
        "rejects an empty message",
        async () => {
          const response =
            await request(app)
              .post(
                "/api/v1/ai/coach"
              )
              .set(
                "Authorization",
                `Bearer ${accessToken}`
              )
              .send({
                message: ""
              });

          expect(
            response.status
          ).toBe(400);

          expect(
            response.body.success
          ).toBe(false);

          expect(
            mockCreateChat
          ).not.toHaveBeenCalled();
        }
      );

      it(
        "rejects a message longer than 2000 characters",
        async () => {
          const response =
            await request(app)
              .post(
                "/api/v1/ai/coach"
              )
              .set(
                "Authorization",
                `Bearer ${accessToken}`
              )
              .send({
                message:
                  "a".repeat(2001)
              });

          expect(
            response.status
          ).toBe(400);

          expect(
            response.body.success
          ).toBe(false);

          expect(
            mockCreateChat
          ).not.toHaveBeenCalled();
        }
      );

      it(
        "rejects an invalid conversation ID",
        async () => {
          const response =
            await request(app)
              .post(
                "/api/v1/ai/coach"
              )
              .set(
                "Authorization",
                `Bearer ${accessToken}`
              )
              .send({
                conversationId:
                  "not-a-uuid",
                message:
                  "How am I doing?"
              });

          expect(
            response.status
          ).toBe(400);

          expect(
            response.body.success
          ).toBe(false);

          expect(
            mockCreateChat
          ).not.toHaveBeenCalled();
        }
      );

      it(
        "creates a new conversation and returns an AI response",
        async () => {
          mockSuccessfulGeminiResponse(
            "You are making good progress today."
          );

          const response =
            await request(app)
              .post(
                "/api/v1/ai/coach"
              )
              .set(
                "Authorization",
                `Bearer ${accessToken}`
              )
              .send({
                message:
                  "How am I doing today?"
              });

          expect(
            response.status
          ).toBe(200);

          expect(
            response.body.success
          ).toBe(true);

          expect(
            response.body.data
          ).toHaveProperty(
            "response"
          );

          expect(
            response.body.data.response
          ).toHaveProperty(
            "conversationId"
          );

          expect(
            response.body.data.response
              .response
          ).toEqual({
            message:
              "You are making good progress today.",
            priorities: []
          });

          expect(
            mockCreateChat
          ).toHaveBeenCalledTimes(1);

          expect(
            mockSendMessage
          ).toHaveBeenCalledTimes(1);
        }
      );

      it(
        "persists the user and assistant messages",
        async () => {
          mockSuccessfulGeminiResponse(
            "Stay consistent with your habits."
          );

          const response =
            await request(app)
              .post(
                "/api/v1/ai/coach"
              )
              .set(
                "Authorization",
                `Bearer ${accessToken}`
              )
              .send({
                message:
                  "Give me some advice."
              });

          expect(
            response.status
          ).toBe(200);

          const conversationId =
            response.body.data.response
              .conversationId;

          const messages =
            await prisma.aIMessage.findMany({
              where: {
                conversationId
              },
              orderBy: {
                createdAt: "asc"
              }
            });

          expect(
            messages
          ).toHaveLength(2);

          expect(
            messages[0]?.role
          ).toBe("USER");

          expect(
            messages[0]?.content
          ).toBe(
            "Give me some advice."
          );

          expect(
            messages[1]?.role
          ).toBe("ASSISTANT");

          expect(
            messages[1]?.content
          ).toContain(
            "Stay consistent with your habits."
          );
        }
      );

      it(
        "returns structured priorities",
        async () => {
          mockSuccessfulGeminiResponse(
            "Here are your priorities.",
            [
              {
                type: "HABIT",
                title:
                  "Complete your workout",
                reason:
                  "Your exercise habit is still pending today."
              },
              {
                type: "NUTRITION",
                title:
                  "Increase protein intake",
                reason:
                  "Your protein intake is below your target."
              }
            ]
          );

          const response =
            await request(app)
              .post(
                "/api/v1/ai/coach"
              )
              .set(
                "Authorization",
                `Bearer ${accessToken}`
              )
              .send({
                message:
                  "What should I focus on today?"
              });

          expect(
            response.status
          ).toBe(200);

          expect(
            response.body.data.response
              .response
          ).toEqual({
            message:
              "Here are your priorities.",
            priorities: [
              {
                type: "HABIT",
                title:
                  "Complete your workout",
                reason:
                  "Your exercise habit is still pending today."
              },
              {
                type: "NUTRITION",
                title:
                  "Increase protein intake",
                reason:
                  "Your protein intake is below your target."
              }
            ]
          });
        }
      );

      it(
        "continues an existing conversation",
        async () => {
          mockSuccessfulGeminiResponse(
            "Your first message is understood."
          );

          const firstResponse =
            await request(app)
              .post(
                "/api/v1/ai/coach"
              )
              .set(
                "Authorization",
                `Bearer ${accessToken}`
              )
              .send({
                message:
                  "I want to improve my health."
              });

          expect(
            firstResponse.status
          ).toBe(200);

          const conversationId =
            firstResponse.body.data
              .response
              .conversationId;

          mockSuccessfulGeminiResponse(
            "Let's work on your next habit.",
            [
              {
                type: "HABIT",
                title:
                  "Build consistency",
                reason:
                  "Consistency is important for long-term progress."
              }
            ]
          );

          const secondResponse =
            await request(app)
              .post(
                "/api/v1/ai/coach"
              )
              .set(
                "Authorization",
                `Bearer ${accessToken}`
              )
              .send({
                conversationId,
                message:
                  "What should I do next?"
              });

          expect(
            secondResponse.status
          ).toBe(200);

          expect(
            secondResponse.body.data
              .response
              .conversationId
          ).toBe(
            conversationId
          );

          expect(
            secondResponse.body.data
              .response
              .response
              .message
          ).toBe(
            "Let's work on your next habit."
          );

          const createCalls =
            mockCreateChat.mock.calls;

          const secondCreateCall =
            createCalls.at(-1);

          expect(
            secondCreateCall
          ).toBeDefined();

          const config =
            secondCreateCall?.[0];

          expect(
            config.history
          ).toHaveLength(2);

          expect(
            config.history[0]
          ).toEqual({
            role: "user",
            parts: [
              {
                text:
                  "I want to improve my health."
              }
            ]
          });

          expect(
            config.history[1]
          ).toEqual({
            role: "model",
            parts: [
              {
                text:
                  JSON.stringify({
                    message:
                      "Your first message is understood.",
                    priorities: []
                  })
              }
            ]
          });
        }
      );

      it(
        "trims the message before validation",
        async () => {
          mockSuccessfulGeminiResponse(
            "Got it."
          );

          const response =
            await request(app)
              .post(
                "/api/v1/ai/coach"
              )
              .set(
                "Authorization",
                `Bearer ${accessToken}`
              )
              .send({
                message:
                  "   Help me stay consistent.   "
              });

          expect(
            response.status
          ).toBe(200);

          const message =
            await prisma.aIMessage.findFirst({
              where: {
                role: "USER"
              }
            });

          expect(
            message?.content
          ).toBe(
            "Help me stay consistent."
          );
        }
      );

      it(
        "rejects invalid JSON returned by Gemini",
        async () => {
          mockSendMessage.mockResolvedValueOnce({
            text:
              "This is not valid JSON",
            functionCalls: []
          });

          const response =
            await request(app)
              .post(
                "/api/v1/ai/coach"
              )
              .set(
                "Authorization",
                `Bearer ${accessToken}`
              )
              .send({
                message:
                  "Give me advice."
              });

          expect(
            response.status
          ).toBe(502);

          expect(
            response.body.success
          ).toBe(false);

          expect(
            response.body.error.code
          ).toBe(
            "AI_INVALID_RESPONSE"
          );

          expect(
            await prisma.aIMessage.count()
          ).toBe(0);
        }
      );

      it(
        "rejects an invalid structured Gemini response",
        async () => {
          mockSendMessage.mockResolvedValueOnce({
            text: JSON.stringify({
              message:
                "This response has invalid priorities.",
              priorities: [
                {
                  type: "INVALID_TYPE",
                  title: "Something",
                  reason: "Something"
                }
              ]
            }),
            functionCalls: []
          });

          const response =
            await request(app)
              .post(
                "/api/v1/ai/coach"
              )
              .set(
                "Authorization",
                `Bearer ${accessToken}`
              )
              .send({
                message:
                  "What should I prioritize?"
              });

          expect(
            response.status
          ).toBe(502);

          expect(
            response.body.success
          ).toBe(false);

          expect(
            response.body.error.code
          ).toBe(
            "AI_INVALID_RESPONSE"
          );

          expect(
            await prisma.aIMessage.count()
          ).toBe(0);
        }
      );

      it(
        "rejects an empty Gemini response",
        async () => {
          mockSendMessage.mockResolvedValueOnce({
            text: "",
            functionCalls: []
          });

          const response =
            await request(app)
              .post(
                "/api/v1/ai/coach"
              )
              .set(
                "Authorization",
                `Bearer ${accessToken}`
              )
              .send({
                message:
                  "How am I doing?"
              });

          expect(
            response.status
          ).toBe(502);

          expect(
            response.body.success
          ).toBe(false);

          expect(
            response.body.error.code
          ).toBe(
            "AI_EMPTY_RESPONSE"
          );
        }
      );

      it(
        "does not allow one user to continue another user's conversation",
        async () => {
          const otherUser =
            await prisma.user.create({
              data: {
                name:
                  "Other AI User",
                email:
                  "other-ai-coach@habitbot.dev",
                passwordHash:
                  await hashPassword(
                    "TestPassword123!"
                  )
              }
            });

          await prisma.userProfile.create({
            data: {
              userId:
                otherUser.id,
              timezone:
                "Asia/Kolkata",
              primaryGoal:
                "GENERAL_HEALTH",
              activityLevel:
                "MODERATE"
            }
          });

          const otherConversation =
            await prisma.aIConversation.create({
              data: {
                userId:
                  otherUser.id
              }
            });

          await prisma.aIMessage.create({
            data: {
              conversationId:
                otherConversation.id,
              role: "USER",
              content:
                "This is private information."
            }
          });

          const response =
            await request(app)
              .post(
                "/api/v1/ai/coach"
              )
              .set(
                "Authorization",
                `Bearer ${accessToken}`
              )
              .send({
                conversationId:
                  otherConversation.id,
                message:
                  "Tell me what is in this conversation."
              });

          expect(
            [403, 404]
          ).toContain(
            response.status
          );

          expect(
            response.body.success
          ).toBe(false);

          expect(
            mockCreateChat
          ).not.toHaveBeenCalled();
        }
      );

      it(
        "passes the configured Gemini model and tools",
        async () => {
          mockSuccessfulGeminiResponse(
            "Everything looks good."
          );

          const response =
            await request(app)
              .post(
                "/api/v1/ai/coach"
              )
              .set(
                "Authorization",
                `Bearer ${accessToken}`
              )
              .send({
                message:
                  "Give me a quick update."
              });

          expect(
            response.status
          ).toBe(200);

          expect(
            mockCreateChat
          ).toHaveBeenCalledTimes(1);

          const createCall =
            mockCreateChat.mock.calls[0];

          const config =
            createCall?.[0];

          expect(
            config.model
          ).toBe(
            process.env.GEMINI_MODEL
          );

          expect(
            config.config.tools
          ).toBeDefined();

          expect(
            config.config.responseMimeType
          ).toBe(
            "application/json"
          );

          expect(
            config.config.responseSchema
          ).toBeDefined();
        }
      );
    }
  );
});