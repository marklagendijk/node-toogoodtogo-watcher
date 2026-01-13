import { createInterface } from "readline";
import { config } from "./config.js";
import { authByEmail, authByRequestPin } from "./toogoodtogo-api.js";

export async function consoleLogin() {
  const readline = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const authResponse = await authByEmail();
    console.log("Response 1:", authResponse);
    if (!authResponse.polling_id) {
      console.error("Did not get a polling_id");
      return;
    }

    const code = await new Promise((resolve, reject) =>
      readline.question(
        `
    The login email should have been sent to ${config.get(
      "api.credentials.email",
    )}.
    Please enter the numeric code you received in the email: `,
        (answer) => {
          if (!answer?.trim()) {
            reject(new Error("No code provided"));
          } else {
            resolve(answer.trim());
          }
        },
      ),
    );

    console.log("Code received:", code);
    const authPollingResponse = await authByRequestPin(
      authResponse.polling_id,
      code,
    );
    console.log("Response 2:", authPollingResponse);
    if (!authPollingResponse) {
      console.error("Did not get an access token");
      return;
    }

    console.log("You are now successfully logged in!");
  } catch (error) {
    console.error("Something went wrong:", error);
  } finally {
    readline.close();
  }
}
