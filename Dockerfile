FROM node:alpine

RUN npm install pm2 -g

WORKDIR /app
COPY ./server /app
RUN npm install --production

RUN apk --no-cache add curl
HEALTHCHECK --interval=60s --timeout=10s --start-period=30s CMD curl -f http://localhost:9000/health || exit 1

CMD ["pm2-runtime", "ecosystem.config.cjs", "--env", "production"]