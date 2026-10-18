export interface Logger {
  info(msg: string): void;
  warn(msg: string): void;
  error(msg: string): void;
}

const line = (level: string, msg: string) => `${new Date().toISOString()} ${level} ${msg}`;

export const consoleLogger: Logger = {
  info: (msg) => console.log(line('INFO ', msg)),
  warn: (msg) => console.warn(line('WARN ', msg)),
  error: (msg) => console.error(line('ERROR', msg)),
};

export const silentLogger: Logger = { info: () => {}, warn: () => {}, error: () => {} };
