import { createLogger, format, transports } from 'winston';
const { combine, timestamp, json, colorize } = format;

const logger = createLogger({
  level: 'debug', // TODO: shift it to info before going in production
  format: combine(colorize(), timestamp(), json()),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ level, message }) => `${level}: ${message}`)
      )
    }),
    new transports.File({ filename: 'app.log' })
  ]
});

export default logger;
