export const aiPaths = {
  "/api/v1/ai/context": {
    get: {
      tags: ["AI Coach"],
      summary: "Get AI user context",
      description:
        "Returns the authenticated user's profile, goals, today's habit progress, habit statistics, nutrition data, and dietary restrictions. This is the context used by the AI coach.",

      security: [
        {
          bearerAuth: []
        }
      ],

      responses: {
        "200": {
          description:
            "AI user context retrieved successfully",

          content: {
            "application/json": {
              schema: {
                type: "object",

                properties: {
                  success: {
                    type: "boolean",
                    example: true
                  },

                  data: {
                    type: "object",

                    properties: {
                      user: {
                        type: "object",

                        properties: {
                          id: {
                            type: "string",
                            format: "uuid"
                          },

                          name: {
                            type: "string",
                            example: "testuser2"
                          },

                          timezone: {
                            type: "string",
                            example: "Asia/Kolkata"
                          },

                          dietType: {
                            type: "string",
                            nullable: true,
                            example: "VEGETARIAN"
                          },

                          primaryGoal: {
                            type: "string",
                            nullable: true
                          },

                          activityLevel: {
                            type: "string",
                            nullable: true
                          }
                        }
                      },

                      today: {
                        type: "object",

                        properties: {
                          date: {
                            type: "string",
                            format: "date"
                          },

                          habits: {
                            type: "object",

                            properties: {
                              total: {
                                type: "integer"
                              },

                              completed: {
                                type: "integer"
                              },

                              pending: {
                                type: "integer"
                              },

                              completionRate: {
                                type: "number"
                              }
                            }
                          },

                          nutrition: {
                            $ref: "#/components/schemas/NutritionTotals"
                          }
                        }
                      },

                      goals: {
                        type: "array",

                        items: {
                          type: "object",

                          properties: {
                            id: {
                              type: "string",
                              format: "uuid"
                            },

                            title: {
                              type: "string"
                            },

                            description: {
                              type: "string",
                              nullable: true
                            }
                          }
                        }
                      },

                      habits: {
                        type: "array",

                        items: {
                          type: "object",

                          properties: {
                            id: {
                              type: "string",
                              format: "uuid"
                            },

                            name: {
                              type: "string"
                            },

                            targetValue: {
                              type: "number",
                              nullable: true
                            },

                            targetUnit: {
                              type: "string",
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

                            today: {
                              type: "object",

                              properties: {
                                completed: {
                                  type: "boolean"
                                },

                                value: {
                                  type: "number",
                                  nullable: true
                                }
                              }
                            },

                            stats: {
                              type: "object",

                              properties: {
                                currentStreak: {
                                  type: "integer"
                                },

                                longestStreak: {
                                  type: "integer"
                                },

                                completionRate: {
                                  type: "number"
                                }
                              }
                            }
                          }
                        }
                      },

                      dietaryRestrictions: {
                        type: "object",

                        properties: {
                          dislikedFoods: {
                            type: "array",

                            items: {
                              type: "string"
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },

        "401": {
          description: "Authentication required"
        }
      }
    }
  },

  "/api/v1/ai/coach": {
    post: {
      tags: ["AI Coach"],
      summary: "Send a message to AI Coach",

      description:
        "Sends a message to AI HabitBot. The AI can use habit, nutrition, analytics, food search, and habit completion tools to answer questions and perform supported actions.",

      security: [
        {
          bearerAuth: []
        }
      ],

      requestBody: {
        required: true,

        content: {
          "application/json": {
            schema: {
              type: "object",

              required: [
                "message"
              ],

              properties: {
                conversationId: {
                  type: "string",
                  format: "uuid",
                  nullable: true,
                  description:
                    "Existing conversation ID. Omit this to start a new conversation."
                },

                message: {
                  type: "string",
                  minLength: 1,
                  maxLength: 2000,
                  example:
                    "How am I doing today?"
                }
              }
            }
          }
        }
      },

      responses: {
        "200": {
          description:
            "AI response generated successfully",

          content: {
            "application/json": {
              schema: {
                type: "object",

                properties: {
                  success: {
                    type: "boolean",
                    example: true
                  },

                  data: {
                    type: "object",

                    properties: {
                      conversationId: {
                        type: "string",
                        format: "uuid"
                      },

                      response: {
                        type: "object",

                        properties: {
                          message: {
                            type: "string",
                            example:
                              "You have completed 2 of your 4 habits today."
                          },

                          priorities: {
                            type: "array",

                            maxItems: 5,

                            items: {
                              type: "object",

                              properties: {
                                type: {
                                  type: "string",

                                  enum: [
                                    "HABIT",
                                    "NUTRITION",
                                    "GOAL",
                                    "GENERAL"
                                  ]
                                },

                                title: {
                                  type: "string"
                                },

                                reason: {
                                  type: "string"
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },

        "400": {
          description:
            "Invalid coach request"
        },

        "401": {
          description:
            "Authentication required"
        },

        "429": {
          description:
            "AI provider rate limit exceeded"
        },

        "502": {
          description:
            "AI service temporarily unavailable"
        }
      }
    }
  },

  "/api/v1/ai/conversations": {
    get: {
      tags: ["AI Coach"],
      summary: "List AI conversations",

      description:
        "Returns conversations belonging to the authenticated user.",

      security: [
        {
          bearerAuth: []
        }
      ],

      responses: {
        "200": {
          description:
            "Conversations retrieved successfully",

          content: {
            "application/json": {
              schema: {
                type: "object",

                properties: {
                  success: {
                    type: "boolean",
                    example: true
                  },

                  data: {
                    type: "object",

                    properties: {
                      conversations: {
                        type: "array",

                        items: {
                          type: "object",

                          properties: {
                            id: {
                              type: "string",
                              format: "uuid"
                            },

                            createdAt: {
                              type: "string",
                              format: "date-time"
                            },

                            updatedAt: {
                              type: "string",
                              format: "date-time"
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },

        "401": {
          description:
            "Authentication required"
        }
      }
    }
  },

  "/api/v1/ai/conversations/{id}": {
    get: {
      tags: ["AI Coach"],
      summary: "Get an AI conversation",

      description:
        "Returns a conversation and its messages. Only conversations belonging to the authenticated user can be accessed.",

      security: [
        {
          bearerAuth: []
        }
      ],

      parameters: [
        {
          name: "id",
          in: "path",
          required: true,

          description:
            "Conversation ID",

          schema: {
            type: "string",
            format: "uuid"
          }
        }
      ],

      responses: {
        "200": {
          description:
            "Conversation retrieved successfully",

          content: {
            "application/json": {
              schema: {
                type: "object",

                properties: {
                  success: {
                    type: "boolean",
                    example: true
                  },

                  data: {
                    type: "object",

                    properties: {
                      conversation: {
                        type: "object",

                        properties: {
                          id: {
                            type: "string",
                            format: "uuid"
                          },

                          createdAt: {
                            type: "string",
                            format: "date-time"
                          },

                          updatedAt: {
                            type: "string",
                            format: "date-time"
                          },

                          messages: {
                            type: "array",

                            items: {
                              type: "object",

                              properties: {
                                id: {
                                  type: "string",
                                  format: "uuid"
                                },

                                role: {
                                  type: "string",

                                  enum: [
                                    "USER",
                                    "ASSISTANT",
                                    "SYSTEM"
                                  ]
                                },

                                content: {
                                  type: "string"
                                },

                                createdAt: {
                                  type: "string",
                                  format: "date-time"
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },

        "401": {
          description:
            "Authentication required"
        },

        "404": {
          description:
            "Conversation not found"
        }
      }
    }
  }
};