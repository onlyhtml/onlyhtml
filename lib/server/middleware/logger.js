import Logger from '../../logger.js';

class LoggerMiddleware {
    constructor() {
    }

    getMiddleware() {
        return this.handleRequest.bind(this);
    }

    async handleRequest(ctx, next) {
        Logger.info(`GET ${ctx.path}`);
        await next();
    }
}

export default function() {
    const instance = new LoggerMiddleware();
    return instance.getMiddleware();
}
