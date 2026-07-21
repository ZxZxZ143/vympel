export class ApiError extends Error {
    status: number;
    details?: unknown;
    requestId?: string;
    retryAfterSeconds?: number;

    constructor(
        status: number,
        message: string,
        details?: unknown,
        requestId?: string,
        retryAfterSeconds?: number
    ) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.details = details;
        this.requestId = requestId;
        this.retryAfterSeconds = retryAfterSeconds;

        Object.setPrototypeOf(this, ApiError.prototype);
    }
}
