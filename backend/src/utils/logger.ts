type LogLevel = "info" | "warn" | "error" | "debug";

const colors = {
  info: "\x1b[36m",
  warn: "\x1b[33m",
  error: "\x1b[31m",
  debug: "\x1b[90m",
  reset: "\x1b[0m",
};

const format = (level: LogLevel, message: string, meta?: any): string => {
  const timestamp = new Date().toISOString();
  const color = colors[level];
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
  return `${color}[${timestamp}] [${level.toUpperCase()}]${colors.reset} ${message}${metaStr}`;
};

export const logger = {
  info: (message: string, meta?: any) => console.log(format("info", message, meta)),
  warn: (message: string, meta?: any) => console.warn(format("warn", message, meta)),
  error: (message: string, meta?: any) => console.error(format("error", message, meta)),
  debug: (message: string, meta?: any) => console.log(format("debug", message, meta)),
};
