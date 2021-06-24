const winston = require('winston');

module.exports = class Logger {
    constructor() {
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.json(),
            defaultMeta: { service: 'user-service' },
            transports: [
                new winston.transports.File({ filename: 'error.log', level: 'error' }),
                new winston.transports.File({ filename: 'info.log', lavel: "info" }),
            ],
        });
    }

    logError(message) {
        this.logger.log({
            level: 'error',
            meesage: message
        })
    }

    logInfo(message) {
        this.logger.log({
            level: 'info',
            meesage: message
        })
    }
};

