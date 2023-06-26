class JWTError extends Error {
    constructor(message, status, accessToken, refreshToken) {
        super(message);
        this.status = status;
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;

        Error.captureStackTrace(this, JWTError);
    }
}

class AuthError extends Error {
    constructor(message, status, username, password) {
        super(message);
        this.status = status;
        this.username = username;
        this.password = password;

        Error.captureStackTrace(this, AuthError);
    }
}

export { JWTError, AuthError };