import { v4 as uuidv4 } from "uuid";
import { config } from "../config.js";

let correlationId = config.get("api.correlationId", null);

export const correlationIdHook = async (options) => {
  if (!correlationId) {
    correlationId = uuidv4();
    config.set("api.correlationId", correlationId);
  }

  options.headers["x-correlation-id"] = correlationId;
};
