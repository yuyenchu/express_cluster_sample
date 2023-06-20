FROM node:latest

RUN npm install pm2 -g

WORKDIR /app
COPY . /app
RUN npm install --production

CMD ["pm2-runtime", "ecosystem.config.cjs", "--env", "production"]