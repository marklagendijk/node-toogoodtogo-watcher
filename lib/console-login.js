import { authByEmail, authPoll } from "./api.js";
import { config } from "./config.js";
import { createInterface } from "readline";

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

    await new Promise((resolve, reject) =>
      readline.question(
        `
The login email should have been sent to ${config.get(
          "api.credentials.email"
        )}. Open the email on your PC and click the link.
Don't open the email on a phone that has the TooGoodToGo app installed. That won't work.
Press the Enter key when you clicked the link.
`,
        resolve
      )
    );

    const authPollingResponse = await authPoll(authResponse.polling_id);
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
