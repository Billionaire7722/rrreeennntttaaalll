import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    private normalizeMessage(payload: unknown): string {
        if (typeof payload === 'string') {
            return payload;
        }

        if (Array.isArray(payload)) {
            const messages = payload.filter((value): value is string => typeof value === 'string');
            return messages.join('. ') || 'Internal server error';
        }

        if (payload && typeof payload === 'object') {
            const record = payload as Record<string, unknown>;
            const message = record.message;

            if (Array.isArray(message)) {
                const messages = message.filter((value): value is string => typeof value === 'string');
                if (messages.length > 0) {
                    return messages.join('. ');
                }
            }

            if (typeof message === 'string' && message.trim()) {
                return message;
            }

            if (typeof record.error === 'string' && record.error.trim()) {
                return record.error;
            }
        }

        return 'Internal server error';
    }

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const message =
            exception instanceof HttpException
                ? exception.getResponse()
                : { message: 'Internal server error' };

        response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            message: this.normalizeMessage(message),
            error: message,
        });
    }
}
