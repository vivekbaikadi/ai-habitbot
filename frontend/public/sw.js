self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();

  const title = data.title || "HabitBot";

  const options = {
    body: data.body || "You have a new notification.",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: {
      url: data.url || "/dashboard",
    },
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = new URL(
    event.notification.data?.url || "/dashboard",
    self.location.origin
  ).href;

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === targetUrl && "focus" in client) {
          return client.focus();
        }
      }

      return clients.openWindow(targetUrl);
    })
  );
});