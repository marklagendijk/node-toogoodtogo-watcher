import mqtt from "mqtt";
import { config } from "../config.js";

var mqttConn = null;
var entitiesCache = {}

export function getMqttConnection() {
    if (!mqttConn)
        mqttConn = mqtt.connect(`mqtt://${config.get('notifications.mqtt.host')}}`, {
            username: config.get("notifications.mqtt.username"),
            password: config.get("notifications.mqtt.password")
        });
    return mqttConn;
}

export function notifyMQTT(messages) {
    messages.forEach(message => {
        publishStock(
            `TooGoodToGo ${message.name}`,
            `toogoodtogo_${message.id}`,
            message.quantity > 0,
            message
        )
    });
}

export function publishStock(deviceName, uniqueId, state, extraAttributes = {}) {
    const mqttClient = getMqttConnection();
    const stateTopic = `homeassistant/binary_sensor/${uniqueId}/state`

    if (!entitiesCache[uniqueId]) {
        // Publish the configuration for the binary sensor only once
        mqttClient.publish(`homeassistant/binary_sensor/${uniqueId}/config`, JSON.stringify({
            "name": deviceName,
            "device_class": "running",
            "state_topic": stateTopic,
            "json_attributes_topic": `${stateTopic}/attributes`,
            "unique_id": uniqueId,
            "device": {
                "identifiers": [
                    uniqueId
                ],
                "name": deviceName,
                "model": "TGTG Availability",
                "manufacturer": "node-toogoodtogo-watcher"
            }
        }));
        entitiesCache[uniqueId] = stateTopic;
    }
    mqttClient.publish(stateTopic, state ? "ON" : "OFF");
    mqttClient.publish(`${stateTopic}/attributes`, JSON.stringify(extraAttributes));

}