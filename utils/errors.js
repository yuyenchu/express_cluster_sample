class JWTError extends Error {
    constructor(message, status, accessToken, refreshToken) {
        super(message);
        this.status = status;
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;

        Error.captureStackTrace(this, JWTError);
    }

    format() {
        return `JWTError: (${this.status}) ${this.message} ${JSON.stringify({accessToken: this.accessToken, refreshToken:this.refreshToken })}`;
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

    format() {
        return `AuthError: (${this.status}) ${this.message} ${JSON.stringify({username: this.username, password:this.password })}`;
    }
}

export { JWTError, AuthError };