# Cluster Express Server
## About
This is an express server ready compatible with cluster mode and docker, using ejs for frontend login/out app.

## Installation guide
Download the project with git clone or zip

## Development setup
This project offers **2 modes** for development, both should work in most cases. You can either run natively if you already have a development environment ready on local, **or** you can run the project with docker, which should maintain a cleaner environment.
### - Native mode (suggest for Windows & macOS)
- Setup
  1. install [Node.js](https://nodejs.org/en) or [Node Version Manager](https://github.com/nvm-sh/nvm#installing-and-updating) (then install and use nodejs)
  2. run ```npm i``` to install npm required packages
  3. run ```npm i pm2 -g``` to install pm2
- To start server
  1. run ```pm2 start ecosystem.config.js```,  you can enable `watch` by uncommenting line 9 if needed
  2. (optional) run ```pm2 log sample-cluster-server``` to see the logs 
  3. run mysql and redis on local
  4. (optional) install docker compose and then run ```docker compose -f docker-compose.dev.yml up -d``` to start services needed for development, you can skip **step 3** if you decide to follow this step
  5. go to [localhost:3000](http://localhost:3000)
- To stop server
  1. stop express server by entering ```pm2 stop sample-cluster-server```
  2. retart server with ```pm2 restart sample-cluster-server``` if needed
### - Docker mode (suggest for linux)
- Setup
  1. install [Docker](https://docs.docker.com/engine/install/ubuntu/) and [Docker Compose](https://docs.docker.com/compose/install/)
- To start server
  1. run ```docker compose -f docker-compose.dev.yml up -d``` to start services needed for development
  2. run ```npm run dev``` or ```docker run -it --rm -v $PWD/:/server --net host --name node_server node:latest sh -c "npm i pm2 -g && /bin/bash"``` to start interactive docker container
  3. inside the container, run ```cd /server && npm i``` to install packages 
  4. then run ```pm2 start ecosystem.config.cjs```, you can enable `watch` by uncommenting line 9 if needed
  5. go to [localhost:3000](http://localhost:3000)
- To stop server
  1. run ```pm2 stop ecosystem.config.cjs``` to stop server
  2. exit the container (this will also remove the container)
## Production setup
It is recommended to use docker for production, but you can also run natively if you really want to.
### - Docker mode (recommended)
- Build
  1. run ```npm run build``` or ```docker build . -t web_server:latest``` to build docker image
  2. set environment variables for mysql and redis storage path, run ```export MYSQL_STORE=/PATH/TO/REDIS_STORE && export REDIS_STORE=/PATH/TO/REDIS_STORE``` 
- Start server
  1. run ```docker compose up -d``` to start all services  
  2. go to [localhost:3000](https://localhost:3000) or other url based on your configuration
- Stop server
  1. run ```docker compose down``` to stop all services  
### - Native mode
- Setup
  1. run ```pm2 startup``` to generate startup scripts to keep process list intact across machine restarts
- Start server
  1. run ```pm2 start ecosystem.config.cjs --env production```
  2. run ```pm2 save``` to save the app list so it will respawn after reboot
  3. go to [localhost:3000](https://localhost:3000) or other url based on your configuration
- Stop server
  1. run ```pm2 stop ecosystem.config.cjs``` to stop app
  2. (optional) run ```pm2 unstartup``` to disable and remove startup configuration

## Config
- config files are stored in the `config` folder, by default `default.json` will be loaded, and for production(when `NODE_ENV=production`) `production.json` will be loaded if exists
  - NOTE: remember to replace secrets and hostnames in `production.json`, fields in the file are just template, they are **NOT SAFE** for actual production
- create a `.env` file to store environment variables for docker compose, which should include `MYSQL_STORE` and `REDIS_STORE` pointing to paths where you want your databse content to be stored
- pm2 use `ecosystem.config.js` for configs, you can change cluster instances, environment vairables, and others in there
- mysql init scripts are stored in `mysql` folder, `init-dev.sql` is for `docker-compose.dev.yml`
- redis config files are stored in `redis` folder, `redis-dev.conf` is for `docker-compose.dev.yml`

## HTTPS
This project use certbot to obtain ssl certificates, following are instructions about how to use it.\
**NOTE**: You will need a **domain name** to get certificate from letsencrypt.
- to use certbot to generate ssl certificates, run ```docker run --rm  -v /etc/letsencrypt:/etc/letsencrypt  -p 80:80 -ti certbot/certbot certonly --standalone --email EMAIL_ADDRESS --agree-tos --preferred-challenges http -d DOMAIN_NAME```
  - NOTE: remember to change the email address and domain name in the command above
- **or** you can run `certbot.sh` to do the same thing
  - NOTE: remember to change the email address and domain name in `certbot.sh`
- for **linux** users, run `crontab_cert.sh` to enable auto renew

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
- [Express session store](https://medium.com/swlh/session-management-in-nodejs-using-redis-as-session-store-64186112aa9)
- [Express MVC structure](https://blog.logrocket.com/building-structuring-node-js-mvc-application/)
- [JWT Redis](https://chaitanay-aggarwal.medium.com/authentication-with-jwt-redis-and-nodejs-e734e923fd39)