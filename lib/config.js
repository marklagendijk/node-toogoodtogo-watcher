const Conf = require("conf");
const editor = require("editor");
const defaults = require("../config.defaults.json");

const config = new Conf({
  defaults,
  projectName: "toogoodtogo-watcher",
});

module.exports = {
  config,
  editConfig,
  resetConfig,
  configPath,
};

function editConfig() {
  if(process.env.DYNO){
    config.set("api.credentials.email", process.env.email);
    config.set("api.session", {
      userId: process.env.user_id,
      accessToken: process.env.access_token,
      refreshToken: process.env.refresh_token,
    });
  }else{
    editor(config.path);
    console.log(`Saved config at:  ${config.path}`);
  }
 
}

function resetConfig() {
  config.set(defaults);
}

function configPath() {
  console.log(`The config is stored at: ${config.path}`);
}
