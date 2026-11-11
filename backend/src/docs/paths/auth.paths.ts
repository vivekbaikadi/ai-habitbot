

export const authPaths = {
  "/api/v1/auth/register": {
    post: {
      tags: ["Auth"],
      summary: "Register a new user",

      requestBody: {
        required: true,

        content: {
          "application/json": {
            schema: {
              type: "object",

              required: [
                "name",
                "email",
                "password"
              ],

              properties: {
                name: {
                  type: "string",
                  minLength: 2,
                  maxLength: 100,
                  example: "Vivek"
                },

                email: {
                  type: "string",
                  format: "email",
                  example: "vivek@example.com"
                },

                password: {
                  type: "string",
                  minLength: 8,
                  maxLength: 128,
                  example: "password123"
                }
              }
            }
          }
        }
      },

      responses: {
        "201": {
          description: "User registered successfully"
        },

        "400": {
          description: "Validation error",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error"
              }
            }
          }
        },

        "409": {
          description: "Email already registered"
        }
      }
    }
  },

  "/api/v1/auth/login": {
    post: {
      tags: ["Auth"],
      summary: "Login",

      requestBody: {
        required: true,

        content: {
          "application/json": {
            schema: {
              type: "object",

              required: [
                "email",
                "password"
              ],

              properties: {
                email: {
                  type: "string",
                  format: "email",
                  example: "vivek@example.com"
                },

                password: {
                  type: "string",
                  example: "password123"
                }
              }
            }
          }
        }
      },

      responses: {
        "200": {
          description: "Login successful"
        },

        "401": {
          description: "Invalid credentials"
        }
      }
    }
  },

  "/api/v1/auth/refresh": {
    post: {
      tags: ["Auth"],
      summary: "Refresh access token",

      responses: {
        "200": {
          description: "Access token refreshed"
        },

        "401": {
          description: "Invalid refresh token"
        }
      }
    }
  },

  "/api/v1/auth/logout": {
    post: {
      tags: ["Auth"],
      summary: "Logout",

      responses: {
        "200": {
          description: "Logged out successfully"
        }
      }
    }
  },

  "/api/v1/auth/me": {
    get: {
      tags: ["Auth"],
      summary: "Get authenticated user",

      security: [
        {
          bearerAuth: []
        }
      ],

      responses: {
        "200": {
          description: "Authenticated user"
        },

        "401": {
          description: "Authentication required",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error"
              }
            }
          }
        }
      }
    }
  }
};