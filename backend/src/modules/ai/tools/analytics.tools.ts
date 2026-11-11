import {
  getAnalytics
} from "../../analytics/analytics.service.js";

import {
  analyticsQuerySchema
} from "../../analytics/analytics.schema.js";

export async function getAnalyticsTool(
  userId: string,
  input: unknown
) {
  const parsed =
    analyticsQuerySchema.parse(input);

  return getAnalytics(
    userId,
    parsed.period
  );
}