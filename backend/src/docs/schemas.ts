export const errorSchema = {
  type: "object",
  properties: {
    success: {
      type: "boolean",
      example: false
    },
    error: {
      type: "object",
      properties: {
        code: {
          type: "string",
          example: "VALIDATION_ERROR"
        },
        message: {
          type: "string",
          example: "Invalid request"
        }
      },
      required: ["code", "message"]
    }
  },
  required: ["success", "error"]
};

export const successSchema = {
  type: "object",
  properties: {
    success: {
      type: "boolean",
      example: true
    }
  },
  required: ["success"]
};

export const paginationSchema = {
  type: "object",
  properties: {
    page: {
      type: "integer",
      example: 1
    },
    limit: {
      type: "integer",
      example: 20
    },
    total: {
      type: "integer",
      example: 50
    },
    totalPages: {
      type: "integer",
      example: 3
    }
  },
  required: [
    "page",
    "limit",
    "total",
    "totalPages"
  ]
};

export const goalSchema = {
  type: "object",
  properties: {
    id: {
      type: "string",
      format: "uuid"
    },
    userId: {
      type: "string",
      format: "uuid"
    },
    title: {
      type: "string",
      example: "Lose 5 kg"
    },
    description: {
      type: "string",
      nullable: true
    },
    isActive: {
      type: "boolean",
      example: true
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
};

export const habitSchema = {
  type: "object",
  properties: {
    id: {
      type: "string",
      format: "uuid"
    },
    userId: {
      type: "string",
      format: "uuid"
    },
    name: {
      type: "string",
      example: "Walk 8000 steps"
    },
    description: {
      type: "string",
      nullable: true
    },
    goalId: {
      type: "string",
      format: "uuid",
      nullable: true
    },
    targetValue: {
      type: "number",
      nullable: true,
      example: 8000
    },
    targetUnit: {
      type: "string",
      nullable: true,
      example: "steps"
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
};

export const completionSchema = {
  type: "object",
  properties: {
    id: {
      type: "string",
      format: "uuid"
    },
    habitId: {
      type: "string",
      format: "uuid"
    },
    completedAt: {
      type: "string",
      format: "date-time"
    },
    value: {
      type: "number",
      nullable: true
    },
    notes: {
      type: "string",
      nullable: true
    }
  }
};

export const foodSchema = {
  type: "object",
  properties: {
    id: {
      type: "string",
      format: "uuid"
    },
    name: {
      type: "string",
      example: "Paneer"
    },
    slug: {
      type: "string",
      example: "paneer"
    },
    description: {
      type: "string",
      nullable: true
    },
    foodType: {
      type: "string",
      enum: [
        "BASIC",
        "PREPARED_DISH"
      ]
    },
    dietType: {
      type: "string",
      enum: [
        "VEGETARIAN",
        "NON_VEGETARIAN",
        "EGGETARIAN",
        "VEGAN"
      ]
    }
  }
};

export const nutritionTotalsSchema = {
  type: "object",
  properties: {
    calories: {
      type: "number",
      example: 1240
    },
    protein: {
      type: "number",
      example: 67
    },
    carbohydrate: {
      type: "number",
      example: 120
    },
    fat: {
      type: "number",
      example: 42
    },
    fiber: {
      type: "number",
      example: 15
    }
  }
};

export const prioritySchema = {
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
  },
  required: [
    "type",
    "title",
    "reason"
  ]
};