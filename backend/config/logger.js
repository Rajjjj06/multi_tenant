import winston from 'winston';
import fs from 'fs';

const logDir = 'logs';
if(!fs.existsSync(logDir)) fs.mkdirSync(logDir);

export const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({filename: `${logDir}/error.log`, level: 'error'}),
        new winston.transports.File({filename: `${logDir}/combined.log`}),
        new winston.transports.File({filename: `${logDir}/debug.log`, level: 'debug'}),
        new winston.transports.File({filename: `${logDir}/warn.log`, level: 'warn'}),
        new winston.transports.File({filename: `${logDir}/info.log`, level: 'info'}),
    ]
       
     
})

export const morganStream = {
    write: (message) => {
        logger.info(message.trim())
    }
}