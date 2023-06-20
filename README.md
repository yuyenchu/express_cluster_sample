# Cluster Express Server
## About
This is an express server ready compatible with cluster mode and docker, using ejs for frontend login/out app.

## Installation guide:
download the project with git clone or zip

## Usage
### - Native mode
- Setup
  1. install [Node.js](https://nodejs.org/en) or [Node Version Manager](https://github.com/nvm-sh/nvm#installing-and-updating) (then install and use nodejs)
  2. run ```npm i``` to install npm required packages
  3. run ```npm i pm2 -g``` to install pm2
- To start server
  1. run ```pm2 start ecosystem.config.js```
  2. (optional) run ```pm2 log sample-cluster-server``` to see the logs 
  3. (optional) install docker compose and then run ```docker compose -f docker-compose.dev.yml up -d``` to start other services needed for development
  4. go to [localhost:3000](https://localhost:3000) and edit app.js to see what changes
- To stop server
  1. stop express server by entering ```pm2 stop sample-cluster-server```
  2. retart server with ```pm2 restart sample-cluster-server``` if needed
### - Docker mode
- Setup
  1. install [Docker](https://docs.docker.com/engine/install/ubuntu/) and [Docker Compose](https://docs.docker.com/compose/install/)
  2. run ```npm run build``` to build docker image
- To start server
  1. run ```docker compose up -d``` to start all services  
  2. go to [localhost:3000](https://localhost:3000)
- To stop server
  1. run ```docker compose down``` to stop all services  

## Config
- config files are stored in the `config` folder, by default `default.json` will be loaded, and for production(`NODE_ENV=production`) `production.json` will be loaded
  - NOTE: remember to replace secrets and hostnames in `production.json`, fields in it are just template, they are **NOT SAFE** for actual production
- pm2 use `ecosystem.config.js` for configs, you can change cluster instances, environment vairables, and others in there
- mysql init scripts are stored in `mysql` folder, `init-dev.sql` is for `docker-compose.dev.yml`
- redis config files are stored in `redis` folder, `redis-dev.conf` is for `docker-compose.dev.yml`

## HTTPS
- to use certbot to generate ssl certificates, run ```docker run --rm  -v /etc/letsencrypt:/etc/letsencrypt  -p 80:80 -ti certbot/certbot certonly --standalone --email EMAIL_ADDRESS --agree-tos --preferred-challenges http -d DOMAIN_NAME```

## Tools
- [Postman](https://www.postman.com/downloads/): API debugging
- [VSCode](https://code.visualstudio.com/): Text editor

## Resources:
- [REST explanined](https://www.infoq.com/articles/rest-introduction/)
- [Express docs](https://expressjs.com/en/4x/api.html)
- [EJS docs](https://ejs.co/#docs)
- [PM2 config Docs](https://pm2.keymetrics.io/docs/usage/application-declaration/)
- [Docker Docs](https://docs.docker.com/get-started/02_our_app/)
- [Docker Compose Docs](https://docs.docker.com/compose/gettingstarted/)
- [MySQL Image](https://hub.docker.com/_/mysql)
- [Redis Image](https://hub.docker.com/_/redis)