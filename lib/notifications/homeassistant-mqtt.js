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
    const entityName = `${message.name}`;
    const uniqueId = `toogoodtogo_${message.id}`;

    const stateTopic = `toogoodtogo-watcher/${uniqueId}`;

    if (!entitiesCache[uniqueId]) {
      // Remove the previous configuration if it exists
      // this is only needed for moving from multiple devices to a single device, but there is no way to detect that
      mqttClient.publish(
        `homeassistant/binary_sensor/toogoodtogo-watcher/${uniqueId}/config`,
        ""
      )
      // Publish the configuration for the binary sensor only once
      mqttClient.publish(
        `homeassistant/binary_sensor/toogoodtogo-watcher/${uniqueId}/config`,
        JSON.stringify({
          name: entityName,
          device_class: "running",
          state_topic: stateTopic,
          json_attributes_topic: `${stateTopic}/attributes`,
          unique_id: uniqueId,
          device: {
            identifiers: ["toogoodtogo_watcher"],
            name: "TooGoodToGo Watcher",
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
