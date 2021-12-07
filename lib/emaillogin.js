const api = require("./api");
const readline = require("readline");

module.exports = { emailLogin };

async function emailLogin() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    const resp1 = await api.authByEmail();
    console.log("Response 1:", resp1);
    const polling_id = resp1.polling_id;
    if (!polling_id) {
      console.error("Did not receive polling_id");
      return;
    }

    await new Promise((resolve, reject) =>
      rl.question(
        "\nThe login email should have been sent. Open the email on PC and click the link.\n" +
        "Don't open the email on a phone that has TGTG installed. That won't work.\n" +
        "Press the Enter key when you clicked the link.\n",
        resolve
      )
    );

    const resp2 = await api.authPoll(polling_id);
    console.log("Response 2:", resp2);
    if (!resp2) {
      console.error("Did not get an access token");
      return;
    }

    console.log("OK, all done");
  } catch (error) {
    console.error("Something went wrong:", error);
  }
};
