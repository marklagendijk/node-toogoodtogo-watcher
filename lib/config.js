import Conf from "conf";
import editor from "editor";
import { readFileSync } from "fs";
import { dirname, resolve, basename, extname } from "path";

const defaults = JSON.parse(
  readFileSync(new URL("../config/config.defaults.json", import.meta.url), "utf-8"),
);

let configInstance = null;

class ConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConfigError';
  }
}

export function initializeConfig(customPath) {
  try {
    const options = {
      defaults,
      projectName: "toogoodtogo-watcher",
    };

    if (customPath) {
      // Validate path
      if (typeof customPath !== 'string' || customPath.trim() === '') {
        throw new ConfigError('Config path must be a non-empty string');
      }

      // Resolve and validate the path
      const resolvedPath = resolve(customPath);
      const dir = dirname(resolvedPath);

      // Get the filename without extension
      const baseName = basename(customPath);
      if (baseName === '') {
        throw new ConfigError('Config path must include a filename');
      }

      const ext = extname(baseName);
      options.configName = ext ? baseName.slice(0, -ext.length) : baseName;

      // Validate extension
      const fileExt = ext ? ext.slice(1) : 'json';
      if (!['json', 'yaml', 'yml'].includes(fileExt)) {
        throw new ConfigError('Config file extension must be one of: json, yaml, yml');
      }

      options.cwd = dir;
      options.fileExtension = fileExt;
    }

    configInstance = new Conf(options);
    return configInstance;
  } catch (error) {
    if (error instanceof ConfigError) {
      throw error;
    }
    throw new ConfigError(`Failed to initialize config: ${error.message}`);
  }
}

export const config = initializeConfig();

export function editConfig() {
  try {
    editor(config.path);
    console.log(`Saved config at:  ${config.path}`);
  } catch (error) {
    throw new ConfigError(`Failed to edit config: ${error.message}`);
  }
}

export function resetConfig() {
  try {
    config.set(defaults);
  } catch (error) {
    throw new ConfigError(`Failed to reset config: ${error.message}`);
  }
}

export function configPath() {
  try {
    console.log(`The config is stored at: ${config.path}`);
  } catch (error) {
    throw new ConfigError(`Failed to get config path: ${error.message}`);
  }
}
