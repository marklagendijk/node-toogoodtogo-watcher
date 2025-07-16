import mqtt from "mqtt";
import { config } from "../config.js";
import { authByEmail, authPoll } from "../toogoodtogo-api.js";

const cache = {
  loginPollingId: null,
  entities: {},
};
let mqttConnection = null;

const mqttConfig = {
  tgtgDevice: {
    identifiers: ["toogoodtogo_watcher"],
    name: "TooGoodToGo Watcher",
    model: "TGTG Availability",
    manufacturer: "node-toogoodtogo-watcher",
  },
  topics: {
    commands: "toogoodtogo-watcher/commands",
    messageState: "toogoodtogo-watcher/message/state",
  },
};

function getMqttConnection() {
  if (!mqttConnection) {
    mqttConnection = mqtt.connect(config.get("notifications.mqtt.url"), {
      username: config.get("notifications.mqtt.username"),
      password: config.get("notifications.mqtt.password"),
    });

    mqttConnection.on("connect", handleMqttConnect);
    mqttConnection.on("message", handleMqttMessage);
  }
  return mqttConnection;
}

function handleMqttConnect() {
  mqttConnection.subscribe(mqttConfig.topics.commands);
  publishMessageSensor();
  publishLoginButton(false);
}

function handleMqttMessage(topic, message) {
  if (topic === mqttConfig.topics.commands) {
    try {
      const payload = JSON.parse(message.toString());
      handleMqttCommand(payload);
    } catch (e) {
      console.error("Invalid MQTT command payload", e);
    }
  }
}

function publishMessageSensor() {
  mqttConnection.publish(
    "homeassistant/sensor/togoodtogo-watcher/tgtg_message/config",
    JSON.stringify({
      name: "Message",
      state_topic: mqttConfig.topics.messageState,
      unique_id: "toogoodtogo_message",
      json_attributes_topic: `${mqttConfig.topics.messageState}/attributes`,
      device: mqttConfig.tgtgDevice,
      entity_category: "diagnostic",
    }),
    { retain: true },
  );
}

function publishLoginButton(login_started) {
  const mqttConnection = getMqttConnection();

  mqttConnection.publish(
    "homeassistant/button/toogoodtogo-watcher/login-button/config",
    "",
  );
  mqttConnection.publish(
    "homeassistant/button/toogoodtogo-watcher/login-button/config",
    JSON.stringify({
      name: login_started
        ? "Continue Login"
        : `TGTG Login with ${config.get("api.credentials.email")}`,
      command_topic: mqttConfig.topics.commands,
      payload_press: JSON.stringify({
        command: login_started ? "login_continue" : "login",
      }),
      unique_id: "toogoodtogo_login",
      device: mqttConfig.tgtgDevice,
      entity_category: "config",
    }),
    { retain: true },
  );
}

function publishMessage(message, fullMessage = null) {
  const mqttConnection = getMqttConnection();
  mqttConnection.publish(mqttConfig.topics.messageState, message);
  mqttConnection.publish(
    `${mqttConfig.topics.messageState}/attributes`,
    JSON.stringify({
      fullMessage: fullMessage,
    }),
  );
}

export function notifyMqtt(messages) {
  const mqttClient = getMqttConnection();

  messages.forEach((message) => {
    const entityName = `${message.name}`;
    const uniqueId = `toogoodtogo_${message.id}`;

    const stateTopic = `toogoodtogo-watcher/${uniqueId}`;

    if (!cache.entities[uniqueId]) {
      // Remove the previous configuration if it exists
      // this is only needed for moving from multiple devices to a single device, but there is no way to detect that
      mqttClient.publish(
        `homeassistant/binary_sensor/toogoodtogo-watcher/${uniqueId}/config`,
        "",
      );
      // Publish the configuration for the binary sensor only once
      mqttClient.publish(
        `homeassistant/binary_sensor/toogoodtogo-watcher/${uniqueId}/config`,
        JSON.stringify({
          name: entityName,
          device_class: "running",
          state_topic: stateTopic,
          json_attributes_topic: `${stateTopic}/attributes`,
          unique_id: uniqueId,
          device: mqttConfig.tgtgDevice,
        }),
        { retain: true },
      );
      cache.entities[uniqueId] = stateTopic;
    }
    mqttClient.publish(stateTopic, message.quantity > 0 ? "ON" : "OFF");
    mqttClient.publish(`${stateTopic}/attributes`, JSON.stringify(message));
  });
}

function handleMqttCommand(payload) {
  switch (payload.command) {
    case "login":
      loginCommand();
      break;
    case "login_continue":
      loginContinueCommand();
      break;
  }
}

async function loginCommand() {
  try {
    const email = config.get("api.credentials.email");
    publishMessage(
      "Login started",
      `Will start the login process with the specified email address: ${email}.
Open the login email on your PC and click the link.
Don't open the email on a phone that has the TooGoodToGo app installed. That won't work.
When you clicked the link click 'Login Continue' in Home Assistant`,
    );

    const authResponse = await authByEmail();
    cache.loginPollingId = authResponse.polling_id;
    if (!authResponse.polling_id) {
      publishMessage("Did not get a polling_id");
    }
    publishLoginButton(true);
  } catch (error) {
    publishMessage(
      "Login failed",
      "Something went wrong during login\n" +
        JSON.stringify(error.stack, null, 4),
    );
  }
}

async function loginContinueCommand() {
  const authPollingResponse = await authPoll(cache.loginPollingId);
  if (!authPollingResponse) {
    publishMessage("Did not get an access token");
    publishLoginButton(false);
    return;
  }
  publishMessage("You are now successfully logged in!");
  publishLoginButton(false);
}
