const { config } = require("./config");
const mqtt = require('mqtt');
const host = config.get("notifications.mqtt.host");
const port = config.get("notifications.mqtt.port")
const topic = config.get("notifications.mqtt.topic")
const client = mqtt.connect({ host, port });

function mqttPublish(message) {
    client.publish(topic, message);
}

module.exports = {
    mqttPublish,
};