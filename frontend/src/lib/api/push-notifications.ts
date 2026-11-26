import apiClient from "./client";

interface VapidPublicKeyResponse {
  publicKey: string;
}

export async function getVapidPublicKey(): Promise<string> {
  const response = await apiClient.get<{
    success: boolean;
    data: VapidPublicKeyResponse;
  }>("/notifications/vapid-public-key");

  return response.data.data.publicKey;
}

export async function subscribeToPush(
  subscription: PushSubscriptionJSON
): Promise<void> {
  await apiClient.post("/notifications/push/subscribe", subscription);
}

export async function unsubscribeFromPush(
  endpoint: string
): Promise<void> {
  await apiClient.delete("/notifications/push/unsubscribe", {
    data: { endpoint },
  });
}