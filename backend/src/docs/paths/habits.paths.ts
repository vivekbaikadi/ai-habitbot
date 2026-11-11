export const habitPaths = {
    "/api/v1/habits": {
        post: {
            tags: ["Habits"],
            summary: "Create a habit",
            security: [{ bearerAuth: [] }],

            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["name", "startDate"],
                            properties: {
                                name: {
                                    type: "string",
                                    minLength: 2,
                                    maxLength: 150,
                                    example: "Walk 8000 steps"
                                },

                                description: {
                                    type: "string",
                                    maxLength: 1000,
                                    example: "Walk at least 8000 steps every day"
                                },

                                goalId: {
                                    type: "string",
                                    format: "uuid",
                                    example: "9c9266db-b69b-42c5-b987-c84d2bd7219d"
                                },

                                targetValue: {
                                    type: "number",
                                    minimum: 0,
                                    exclusiveMinimum: true,
                                    example: 8000
                                },

                                targetUnit: {
                                    type: "string",
                                    maxLength: 50,
                                    example: "steps"
                                },

                                frequency: {
                                    type: "string",
                                    enum: [
                                        "DAILY",
                                        "WEEKLY",
                                        "CUSTOM"
                                    ],
                                    default: "DAILY"
                                },

                                startDate: {
                                    type: "string",
                                    format: "date-time",
                                    example: "2026-08-27T00:00:00.000Z"
                                },

                                endDate: {
                                    type: "string",
                                    format: "date-time",
                                    example: "2026-12-31T23:59:59.999Z"
                                }
                            }
                        }
                    }
                }
            },

            responses: {
                "201": {
                    description: "Habit created successfully"
                },

                "400": {
                    description: "Validation error"
                },

                "404": {
                    description: "Goal not found"
                }
            }
        },

        get: {
            tags: ["Habits"],
            summary: "List user's habits",
            security: [{ bearerAuth: [] }],

            responses: {
                "200": {
                    description: "Habits retrieved successfully"
                },

                "401": {
                    description: "Authentication required"
                }
            }
        }
    },

    "/api/v1/habits/{id}": {
        get: {
            tags: ["Habits"],
            summary: "Get a habit",
            security: [{ bearerAuth: [] }],

            parameters: [
                {
                    name: "id",
                    in: "path",
                    required: true,
                    schema: {
                        type: "string",
                        format: "uuid"
                    }
                }
            ],

            responses: {
                "200": {
                    description: "Habit retrieved successfully"
                },

                "404": {
                    description: "Habit not found"
                }
            }
        },

        patch: {
            tags: ["Habits"],
            summary: "Update a habit",
            security: [{ bearerAuth: [] }],

            parameters: [
                {
                    name: "id",
                    in: "path",
                    required: true,
                    schema: {
                        type: "string",
                        format: "uuid"
                    }
                }
            ],

            requestBody: {
                required: true,

                content: {
                    "application/json": {
                        schema: {
                            type: "object",

                            properties: {
                                name: {
                                    type: "string",
                                    minLength: 2,
                                    maxLength: 150
                                },

                                description: {
                                    type: "string",
                                    nullable: true,
                                    maxLength: 1000
                                },

                                goalId: {
                                    type: "string",
                                    format: "uuid",
                                    nullable: true
                                },

                                targetValue: {
                                    type: "number",
                                    exclusiveMinimum: 0,
                                    nullable: true
                                },

                                targetUnit: {
                                    type: "string",
                                    maxLength: 50,
                                    nullable: true
                                },

                                frequency: {
                                    type: "string",
                                    enum: [
                                        "DAILY",
                                        "WEEKLY",
                                        "CUSTOM"
                                    ]
                                },

                                startDate: {
                                    type: "string",
                                    format: "date-time"
                                },

                                endDate: {
                                    type: "string",
                                    format: "date-time",
                                    nullable: true
                                },

                                isActive: {
                                    type: "boolean"
                                }
                            }
                        }
                    }
                }
            },

            responses: {
                "200": {
                    description: "Habit updated successfully"
                },

                "400": {
                    description: "Validation error"
                },

                "404": {
                    description: "Habit or goal not found"
                }
            }
        },

        delete: {
            tags: ["Habits"],
            summary: "Delete a habit",
            security: [{ bearerAuth: [] }],

            parameters: [
                {
                    name: "id",
                    in: "path",
                    required: true,
                    schema: {
                        type: "string",
                        format: "uuid"
                    }
                }
            ],

            responses: {
                "200": {
                    description: "Habit deleted successfully"
                },

                "404": {
                    description: "Habit not found"
                }
            }
        }
    }
};