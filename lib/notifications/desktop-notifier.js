import notifier from "node-notifier";

export function notifyDesktop(message) {
  notifier.notify({ title: "TooGoodToGo", message });
}
