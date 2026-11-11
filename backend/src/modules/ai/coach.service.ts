import { gemini } from "../../common/ai/gemini.client.js";
import { env } from "../../config/env.js";
import { AppError } from "../../common/errors/app.error.js";
import { prisma } from "../../database/prisma.js";

import {
    buildAIUserContext
} from "./ai-context.service.js";

import {
    buildDailyCoachPrompt
} from "./prompts/daily-coach.prompt.js";

import {
    coachResponseSchema
} from "./coach.schema.js";

import type {
    CoachRequest
} from "./coach.schema.js";

import {
    createConversation,
    getConversation
} from "./conversation.service.js";

import {
    getHabitStatsTool
} from "./tools/habit.tools.js";

import {
    habitStatsToolDefinition,
    todayNutritionToolDefinition,
    todayDashboardToolDefinition,
    analyticsToolDefinition,
    createHabitToolDefinition,
    completeHabitToolDefinition,
    searchFoodsToolDefinition,
    logFoodToolDefinition
} from "./tools/tool.definitions.js";

import {
    getTodayNutritionTool
} from "./tools/nutrition.tools.js";

import {
    getTodayDashboardTool
} from "./tools/dashboard.tools.js";

import {
    getAnalyticsTool
} from "./tools/analytics.tools.js";

import {
    createHabitTool
} from "./tools/habit.actions.js";

import {
    completeHabitTool
} from "./tools/completion.actions.js";

import {
    searchFoodsTool,
    logFoodTool
} from "./tools/food.actions.js";






function getGeminiErrorStatus(
    error: unknown
): number | null {
    if (
        typeof error === "object" &&
        error !== null &&
        "status" in error &&
        typeof (error as { status?: unknown }).status === "number"
    ) {
        return (error as { status: number }).status;
    }

    return null;
}


async function retryGeminiRequest<T>(
    operation: () => Promise<T>,
    maxRetries = 2,
): Promise<T> {
    let attempt = 0;

    while (true) {
        try {
            return await operation();
        } catch (error) {
            const status = getGeminiErrorStatus(error);

            const isRetryable =
                status === 500 ||
                status === 502 ||
                status === 503 ||
                status === 504;

            if (!isRetryable || attempt >= maxRetries) {
                throw error;
            }

            // Wait 1 second, then 2 seconds.
            const delayMs = 1000 * 2 ** attempt;

            attempt++;

            console.warn(
                `Gemini returned ${status}. Retrying (${attempt}/${maxRetries}) in ${delayMs}ms...`,
            );

            await new Promise((resolve) =>
                setTimeout(resolve, delayMs),
            );
        }
    }
}


export async function generateCoachResponse(
    userId: string,
    input: CoachRequest
) {
    /*
     * --------------------------------------------------
     * 1. Get or create conversation
     * --------------------------------------------------
     */

    let conversation;

    if (input.conversationId) {
        conversation =
            await getConversation(
                userId,
                input.conversationId
            );
    } else {
        conversation =
            await createConversation(
                userId
            );
    }

    /*
     * --------------------------------------------------
     * 2. Build fresh user context
     * --------------------------------------------------
     */

    const context =
        await buildAIUserContext(
            userId
        );

    /*
     * --------------------------------------------------
     * 3. Build current prompt
     * --------------------------------------------------
     */

    const currentPrompt =
        buildDailyCoachPrompt(
            context,
            input.message
        );

    /*
     * --------------------------------------------------
     * 4. Convert DB history to Gemini history
     * --------------------------------------------------
     */

    const history =
        conversation.messages.map(
            (message) => ({
                role:
                    message.role === "USER"
                        ? "user"
                        : "model",

                parts: [
                    {
                        text: message.content
                    }
                ]
            })
        );

    let response;

    try {
        /*
         * --------------------------------------------------
         * 5. Create Gemini chat
         * --------------------------------------------------
         */

        const chat =
            gemini.chats.create({
                model: env.GEMINI_MODEL,

                history,

                config: {
                    tools: [
                        {
                            functionDeclarations: [
                                habitStatsToolDefinition,
                                todayNutritionToolDefinition,
                                todayDashboardToolDefinition,
                                analyticsToolDefinition,
                                createHabitToolDefinition,
                                completeHabitToolDefinition,
                                searchFoodsToolDefinition,
                                logFoodToolDefinition
                            ]
                        }
                    ],

                    responseMimeType:
                        "application/json",

                    responseSchema: {
                        type: "OBJECT",

                        properties: {
                            message: {
                                type: "STRING"
                            },

                            priorities: {
                                type: "ARRAY",

                                maxItems: 5,

                                items: {
                                    type: "OBJECT",

                                    properties: {
                                        type: {
                                            type: "STRING",

                                            enum: [
                                                "HABIT",
                                                "NUTRITION",
                                                "GOAL",
                                                "GENERAL"
                                            ]
                                        },

                                        title: {
                                            type: "STRING"
                                        },

                                        reason: {
                                            type: "STRING"
                                        }
                                    },

                                    required: [
                                        "type",
                                        "title",
                                        "reason"
                                    ]
                                }
                            }
                        },

                        required: [
                            "message",
                            "priorities"
                        ]
                    }
                }
            });

        /*
         * --------------------------------------------------
         * 6. First Gemini request
         * --------------------------------------------------
         */

        response = await retryGeminiRequest(() =>
            chat.sendMessage({
                message: currentPrompt,
            }),
        );

        /*
 * --------------------------------------------------
 * 7. Handle Gemini tool calls
 * --------------------------------------------------
 *
 * Gemini may need multiple rounds of tool calls.
 *
 * Example:
 *
 * User
 *   ↓
 * search_foods
 *   ↓
 * Gemini
 *   ↓
 * log_food
 *   ↓
 * Gemini
 *   ↓
 * final response
 *
 */
        let toolRound = 0;
        const MAX_TOOL_ROUNDS = 5;

        while (
            response.functionCalls &&
            response.functionCalls.length > 0
        ) {

            toolRound++;

            if (toolRound > MAX_TOOL_ROUNDS) {
                throw new AppError(
                    "AI exceeded the maximum number of tool calls",
                    502,
                    "AI_TOOL_LIMIT_EXCEEDED"
                );
            }


            const functionResponses: {
                name: string;
                response: Record<string, unknown>;
            }[] = [];

            for (
                const call
                of response.functionCalls
            ) {
                if (
                    call.name ===
                    "get_habit_stats"
                ) {
                    const habitId =
                        typeof call.args?.habitId === "string"
                            ? call.args.habitId
                            : null;

                    if (!habitId) {
                        throw new AppError(
                            "AI provided an invalid habit ID",
                            502,
                            "AI_INVALID_TOOL_ARGUMENT"
                        );
                    }

                    const toolResult =
                        await getHabitStatsTool(
                            userId,
                            habitId
                        );

                    functionResponses.push({
                        name: call.name,
                        response: toolResult
                    });

                    continue;
                }

                if (
                    call.name ===
                    "get_today_nutrition"
                ) {
                    const toolResult =
                        await getTodayNutritionTool(
                            userId
                        );

                    functionResponses.push({
                        name: call.name,
                        response: toolResult
                    });

                    continue;
                }

                if (
                    call.name ===
                    "get_today_dashboard"
                ) {
                    const toolResult =
                        await getTodayDashboardTool(
                            userId
                        );

                    functionResponses.push({
                        name: call.name,
                        response: toolResult
                    });

                    continue;
                }

                if (
                    call.name ===
                    "get_analytics"
                ) {
                    const toolResult =
                        await getAnalyticsTool(
                            userId,
                            call.args
                        );

                    functionResponses.push({
                        name: call.name,
                        response: toolResult
                    });

                    continue;
                }

                if (
                    call.name ===
                    "create_habit"
                ) {
                    const toolResult =
                        await createHabitTool(
                            userId,
                            call.args
                        );

                    functionResponses.push({
                        name: call.name,
                        response: toolResult
                    });

                    continue;
                }

                if (
                    call.name ===
                    "complete_habit"
                ) {
                    const toolResult =
                        await completeHabitTool(
                            userId,
                            call.args
                        );

                    functionResponses.push({
                        name: call.name,
                        response: toolResult
                    });

                    continue;
                }

                if (
                    call.name ===
                    "search_foods"
                ) {
                    const toolResult =
                        await searchFoodsTool(
                            call.args
                        );

                    functionResponses.push({
                        name: call.name,
                        response: toolResult
                    });

                    continue;
                }

                if (
                    call.name ===
                    "log_food"
                ) {
                    const toolResult =
                        await logFoodTool(
                            userId,
                            call.args
                        );

                    functionResponses.push({
                        name: call.name,
                        response: toolResult
                    });

                    continue;
                }

                throw new AppError(
                    `Unsupported AI tool: ${call.name}`,
                    502,
                    "AI_UNSUPPORTED_TOOL"
                );
            }

            /*
             * Send tool results back to Gemini.
             *
             * The response may contain another
             * function call, so the while loop
             * will continue if necessary.
             */

            response = await retryGeminiRequest(() =>
                chat.sendMessage({
                    message: functionResponses.map((item) => ({
                        functionResponse: {
                            name: item.name,
                            response: item.response,
                        },
                    })),
                }),
            );
        }
    } catch (error) {
        console.error(
            "========== GEMINI ERROR =========="
        );

        console.error(error);

        if (error instanceof Error) {
            console.error(
                "Message:",
                error.message
            );

            console.error(
                "Stack:",
                error.stack
            );
        }

        console.error(
            "=================================="
        );

        /*
         * Preserve application errors that were
         * intentionally thrown by our AI tools.
         */
        if (error instanceof AppError) {
            throw error;
        }

        const status =
            getGeminiErrorStatus(error);

        /*
         * Gemini rate limit / quota exceeded.
         */
        if (status === 429) {
            throw new AppError(
                "AI request limit reached. Please try again later.",
                429,
                "AI_RATE_LIMITED"
            );
        }

        /*
         * Gemini temporarily unavailable.
         */
        if (
            status === 500 ||
            status === 502 ||
            status === 503 ||
            status === 504
        ) {
            throw new AppError(
                "AI service is temporarily unavailable. Please try again shortly.",
                503,
                "AI_TEMPORARILY_UNAVAILABLE"
            );
        }

        /*
         * Configuration/model errors.
         *
         * Gemini may return 400 for an invalid request,
         * including an invalid model/configuration.
         */
        if (status === 400) {
            throw new AppError(
                "AI service configuration is invalid.",
                500,
                "AI_CONFIGURATION_ERROR"
            );
        }

        /*
         * Unknown Gemini/API error.
         */
        throw new AppError(
            "AI service is temporarily unavailable",
            502,
            "AI_SERVICE_UNAVAILABLE"
        );
    }

    /*
     * --------------------------------------------------
     * 9. Get final Gemini response
     * --------------------------------------------------
     */

    const output =
        response.text;

    if (!output) {
        throw new AppError(
            "AI returned an empty response",
            502,
            "AI_EMPTY_RESPONSE"
        );
    }

    /*
     * --------------------------------------------------
     * 10. Parse JSON
     * --------------------------------------------------
     */

    let parsed: unknown;

    try {
        parsed =
            JSON.parse(output);
    } catch (error) {
        console.error(
            "Failed to parse Gemini response:",
            error
        );

        throw new AppError(
            "AI returned an invalid response",
            502,
            "AI_INVALID_RESPONSE"
        );
    }

    /*
     * --------------------------------------------------
     * 11. Validate with Zod
     * --------------------------------------------------
     */

    const result =
        coachResponseSchema.safeParse(
            parsed
        );

    if (!result.success) {
        console.error(
            "Gemini response validation failed:",
            result.error.flatten()
        );

        throw new AppError(
            "AI returned an invalid response",
            502,
            "AI_INVALID_RESPONSE"
        );
    }

    /*
     * --------------------------------------------------
     * 12. Persist conversation messages
     * --------------------------------------------------
     */

    const isFirstMessage = conversation.messages.length === 0;

    await prisma.$transaction([
        prisma.aIMessage.create({
            data: {
                conversationId: conversation.id,
                role: "USER",
                content: input.message
            }
        }),

        prisma.aIMessage.create({
            data: {
                conversationId: conversation.id,
                role: "ASSISTANT",
                content: JSON.stringify(result.data)
            }
        }),

        ...(isFirstMessage
            ? [
                prisma.aIConversation.update({
                    where: {
                        id: conversation.id
                    },
                    data: {
                        title:
                            input.message.trim().slice(0, 50) +
                            (input.message.trim().length > 50 ? "..." : "")
                    }
                })
            ]
            : [])
    ]);

    /*
     * --------------------------------------------------
     * 13. Return final response
     * --------------------------------------------------
     */

    return {
        conversationId:
            conversation.id,

        response:
            result.data
    };
}