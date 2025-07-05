import mqtt from "mqtt";
import { config } from "../config.js";

var mqttConnection = null;
var entitiesCache = {};

function getMqttConnection() {
  if (!mqttConnection)
    mqttConnection = mqtt.connect(config.get("notifications.mqtt.url"), {
      username: config.get("notifications.mqtt.username"),
      password: config.get("notifications.mqtt.password"),
    });
  return mqttConnection;
}

export function notifyMqtt(messages) {
  const mqttClient = getMqttConnection();

  messages.forEach((message) => {
    const deviceName = `TooGoodToGo ${message.name}`;
    const uniqueId = `toogoodtogo_${message.id}`;

    const stateTopic = `toogoodtogo-watcher/${uniqueId}`;

    if (!entitiesCache[uniqueId]) {
      // Publish the configuration for the binary sensor only once
      mqttClient.publish(
        `homeassistant/binary_sensor/toogoodtogo-watcher/${uniqueId}/config`,
        JSON.stringify({
          name: deviceName,
          device_class: "running",
          state_topic: stateTopic,
          json_attributes_topic: `${stateTopic}/attributes`,
          unique_id: uniqueId,
          device: {
            identifiers: [uniqueId],
            name: deviceName,
            model: "TGTG Availability",
            manufacturer: "node-toogoodtogo-watcher",
          },
        }),
        { retain: true },
      );
      entitiesCache[uniqueId] = stateTopic;
    }
    mqttClient.publish(stateTopic, message.quantity > 0 ? "ON" : "OFF");
    mqttClient.publish(`${stateTopic}/attributes`, JSON.stringify(message));
  });
}
