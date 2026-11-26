"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getVapidPublicKey,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/api/push-notifications";

function urlBase64ToUint8Array(
  base64String: string
): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);

  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);

  const output = new Uint8Array(new ArrayBuffer(rawData.length));

  for (let i = 0; i < rawData.length; ++i) {
    output[i] = rawData.charCodeAt(i);
  }

  return output;
}

export function usePushNotifications() {
  const [isSupported] = useState(
    () =>
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window
  );

  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "default"
  );

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupported) return;

    let cancelled = false;

    async function checkSubscription() {
      try {
        const registration =
          await navigator.serviceWorker.getRegistration("/");

        const subscription = registration
          ? await registration.pushManager.getSubscription()
          : null;

        if (!cancelled) {
          setIsSubscribed(Boolean(subscription));
          setPermission(Notification.permission);
        }
      } catch {
        if (!cancelled) {
          setIsSubscribed(false);
        }
      }
    }

    void checkSubscription();

    return () => {
      cancelled = true;
    };
  }, [isSupported]);

  const enableNotifications = useCallback(async () => {
    if (!isSupported) {
      setError("Push notifications are not supported in this browser.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const currentPermission = await Notification.requestPermission();

      setPermission(currentPermission);

      if (currentPermission !== "granted") {
        throw new Error(
          currentPermission === "denied"
            ? "Notifications are blocked. Please enable them in your browser settings."
            : "Notification permission was not granted."
        );
      }

      const registration =
        await navigator.serviceWorker.register("/sw.js");

      await navigator.serviceWorker.ready;

      let subscription =
        await registration.pushManager.getSubscription();

      if (!subscription) {
        const publicKey = await getVapidPublicKey();

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }

      await subscribeToPush(subscription.toJSON());

      setIsSubscribed(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to enable push notifications."
      );
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  const disableNotifications = useCallback(async () => {
    if (!isSupported) return;

    setIsLoading(true);
    setError(null);

    try {
      const registration =
        await navigator.serviceWorker.getRegistration("/");

      const subscription = registration
        ? await registration.pushManager.getSubscription()
        : null;

      if (subscription) {
        await unsubscribeFromPush(subscription.endpoint);
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to disable push notifications."
      );
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    enableNotifications,
    disableNotifications,
  };
}