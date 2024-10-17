# Cluster Express Server
## About
This is an stateless express server ready for cluster mode and dockerization, with features including:
- Frontend: using ejs for Server-Side Rendering (SSR) memo app and swup for page trainsition animation.
- Authorization: provides both session and JWT, session for login status and JWT for api.
- Database: use MySQL for related data, such as user info and memos, and Redis for cache data, such as session, store, and JWT refresh tokens.
- Logging: using morgan for access log and winston for error log, both with rotating file stream.
- Reverse proxy: using traefik for internal routing and ssl certificate renewal
- Tracing: using jaeger to monitor workflow combining with traefik
- Metrics: using prometheus and grafana to monitor requests combining with traefik
- Design pattern: using MVC (Model-View-Controller) design.
- Docker: Dockerfile and docker-compose.yml are ready for deployment

## Folder structure
- server: contains node.js server 
  - server/src/: server scripts
  - server/config/: server configs
  - server/public/: served public files
  - server/views/: server views
  - server/ecosystem.config.cjs: pm2 config
  - server/package.json: npm package dependencies
- redis: redis config and init script
- mysql: mysql and init script
- logs: server logs in docker mode
  - server/logs/: server logs in native mode
- prometheus: prometheus metric collect configs
- grafana: grafana, data source, and dashboard configs
- jaeger: jaeger data store
- traefik: traefik ssl certificates, logs, and user-password file

## Installation guide
- Download the project with [git](https://git-scm.com/downloads) clone or zip
```shell
git clone https://github.com/yuyenchu/express_cluster_sample.git
```

- Install Node.js from [website](https://nodejs.org/en/download) or command
```shell
sudo apt update
sudo apt install nodejs
```
- Or install Node Version Manager (NVM) instead
```shell
sudo apt install curl 
curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash 
source ~/.bashrc   
nvm install node #install latest nodejs
```
- Alternatively, install Bun instead of Node.js for better performance
**NOTE**: Bun is still under development and does not guarantee complete compability with Node.js.
```
curl -fsSL https://bun.sh/install | bash 
```

- Install Docker following instructions on their [website](https://docs.docker.com/engine/install/)

## Development setup
This project offers **2 modes** for development, both should work in most cases. You can either run natively if you already have a development environment ready on local, **or** you can run the project with docker, which should maintain a cleaner environment. \
**NOTE**: following commands are executed in `server` folder
### - Native mode
- Setup
  1. install [Node.js](https://nodejs.org/en) or [Node Version Manager](https://github.com/nvm-sh/nvm#installing-and-updating) (then install and use nodejs)
  2. run ```npm i``` to install npm required packages \
    \* *Bun alternative*: ```bun i```
  3. run ```npm i pm2 -g``` to install pm2
- Sart server
  1. run ```pm2 start ecosystem.config.js```,  you can enable `watch` by uncommenting line 9 if needed \
    \* *Bun alternative*: replacing line 4 with ```bun src/app.js```
  2. (optional) run ```pm2 log sample-cluster-server``` to see the logs 
  3. run mysql and redis on local
  4. (optional) install docker compose and then run ```docker compose -f ../docker-compose.dev.yml -p express_dev up -d``` to start services needed for development, you can skip **step 3** if you decide to follow this step
  5. go to [localhost:3000](http://localhost:3000)
- Stop server
  1. stop express server by entering ```pm2 stop sample-cluster-server```
  2. retart server with ```pm2 restart sample-cluster-server``` if needed
### - Docker mode (recommended)
- Setup
  1. install [Docker](https://docs.docker.com/engine/install/ubuntu/) and [Docker Compose](https://docs.docker.com/compose/install/)
- Start server
  1. run ```docker compose -f ../docker-compose.dev.yml -p express_dev up -d``` to start services needed for development
  2. run ```npm run dev``` or ```docker run -it --rm -v $PWD/:/server --net host --name node_server node:latest sh -c "npm i pm2 -g && /bin/bash"``` to start interactive docker container \
    \* *Bun alternative*: ```npm run bun-dev``` or ```docker run -it --rm --init --ulimit memlock=-1:-1 -v $PWD/:/server --net host --name bun_server oven/bun:latest sh -c "/bin/bash"```
  3. inside the container, run ```cd /server && npm i``` to install packages \
    \* *Bun alternative*: ```cd /server && bun i```
  4. then run ```pm2 start ecosystem.config.cjs```, you can enable `watch` by uncommenting line 9 if needed \
    \* *Bun alternative*: ```bun run bun-start```
  5. go to [localhost:3000](http://localhost:3000)
- Stop server
  1. run ```pm2 stop ecosystem.config.cjs``` to stop server
  2. exit the container (this will also remove the container)
## Production setup
It is recommended to use docker for production, but you can also run natively if you really want to.\
**NOTE**: following commands are executed in `server` folder
### - Docker mode (recommended)
- Build
  1. run ```npm run build``` or ```docker build . -f ../Dockerfile -t web_server:latest``` to build docker image
  2. configure environment variables in `.env` file following the **Config** section below or run
    ```
    export MYSQL_PASSWD="rootPassword12#$"
    export MYSQL_STORE=/PATH/TO/REDIS_STORE 
    export REDIS_STORE=/PATH/TO/REDIS_STORE
    export PROM_STORE=/PATH/TO/PROMETHEUS_STORE
    export GRAFANA_STORE=/PATH/TO/GRAFANA_STORE
    export DOMAIN_NAME=YOUR_DOMAIN_NAME 
    export EMAIL_ADDRESS=YOUR_EMAIL@gmail.com
    export LOCAL_DOMAIN_NAME=YOUR_SERVER_LOCAL_DOMAIN_NAME 
    export LOCAL_IP_ADDR=YOUR_SERVER_LOCAL_IP_ADDRESS 
    export LAN_SUBNET=LAN_IP/SUBNET_MASK
    ``` 
  3. enable ufw-docker following the **UFW** section below
- Start server
  1. run ```cd ../ && docker compose up -d``` to start all services  
  2. go to [server.localhost:8080](http://server.localhost:8080) or other url based on your configuration
  3. run ```ufw_allow_traefik.sh``` to add firewall rules for traefik container
- Stop server
  1. run ```docker compose down``` to stop all services  
### - Native mode
**NOTE**: this mode will **only** start the server, but **not** other database, reverse proxy, tracing, and metric services
- Setup
  1. run ```pm2 startup``` to generate startup scripts to keep process list intact across machine restarts
- Start server
  1. run ```pm2 start ecosystem.config.cjs --env production```
  2. run ```pm2 save``` to save the app list so it will respawn after reboot
  3. go to [localhost](https://localhost) or other url based on your configuration
- Stop server
  1. run ```pm2 stop ecosystem.config.cjs``` to stop app
  2. (optional) run ```pm2 unstartup``` to disable and remove startup configuration

## Config
- config files are stored in the `server/config` folder, by default `default.json` will be loaded, and for production(when `NODE_ENV=production`) `production.json` will be loaded if exists
  - more info in `config/README.md`
  - **NOTE**: remember to replace secrets and hostnames in `production.json`, fields in the file are just template, they are **NOT SAFE** for actual production
- create a `.env` file to store environment variables for docker compose, which should include the following:
  -  `MYSQL_PASSWD` for mysql root password, if using `config/default.json` it should be `rootPassword12#$` 
  -  `MYSQL_STORE`, `REDIS_STORE` pointing to absolute paths where you want your databse content to be stored
  -  `PROM_STORE`, `GRAFANA_STORE` pointing to absolute paths where you want your metrics content to be stored
  -  `DOMAIN_NAME` for letsencrypt acme challenge and traefik routing
  -  `EMAIL_ADDRESS` for letsencrypt notification
  -  `LOCAL_DOMAIN_NAME`(optional) for local network access to traefik dashboard and jaeger ui
     -  the server's local domain name, should be set at local DNS server, will use `localhost` if left blank
  -  `LOCAL_IP_ADDR`(optional) for local network access to traefik dashboard and jaeger ui, 
     -  the server's local IP, can be found and set at your router, will use `127.0.0.1` if left blank
  -  `LAN_SUBNET`(optional) for traefik ip whitelist, so local network can connect
     -  the lan subnet that contains devices require connection to traefik dashboard, tracing and metric serveices, can be found and set at your router, will not allow any if left blank
- pm2 use `server/ecosystem.config.js` for configs, you can change cluster instances, environment vairables, and others in there
- mysql init scripts are stored in `mysql` folder, `init-dev.sql` is for `docker-compose.dev.yml`
- redis config files are stored in `redis` folder, `redis-dev.conf` is for `docker-compose.dev.yml`
- traefik basic auth users are stored in `traefik/users/usersfile`, passwords must be hashed using MD5, SHA1, or BCrypt, [more reference](https://doc.traefik.io/traefik-hub/api-gateway/configuration/middleware/http/basic-auth#usersfile)

## HTTPS
**NOTE**: You will need a **domain name** to get certificate from letsencrypt.
### Traefik
By default, this project uses traefik to route https requests and auto renew ssl certificates with acme http challenge. For alternative, manual obtained ssl certificates are also supported using the server script, which will require some settings in server config file.
### Certbot 
To use certbot to obtain ssl certificates, following are instructions about how to use it.\
- to use certbot to generate ssl certificates, run ```docker run --rm  -v /etc/letsencrypt:/etc/letsencrypt  -p 80:80 -ti certbot/certbot certonly --standalone --email EMAIL_ADDRESS --agree-tos --preferred-challenges http -d DOMAIN_NAME```
  - NOTE: remember to change the email address and domain name in the command above
- **or** you can run `certbot.sh` to do the same thing
  - NOTE: remember to change the email address and domain name in `certbot.sh`
- for **linux** users, run `crontab_cert.sh` to enable auto renew

## UFW
If you are using UFW as your firewall, you might notice that it isn't working with docker. And that's because docker will alter the iptables for its internal routing. To fix this, we'll use ufw-docker from [chaifeng](https://github.com/chaifeng/ufw-docker) with following commands
```shell
sudo cp ufw-docker /usr/local/bin/ufw-docker
sudo chmod +x /usr/local/bin/ufw-docker
sudo ufw-docker install
sudo systemctl restart ufw
sudo systemctl restart docker
```
After ufw-docker is installed and restarted ufw and docker daemon, we can start setting up rules for our containers. For example, our traefik service is using internal port 80 and 443 in `docker-compose.yml`
```shell
# allow traefik container's port to host
sudo ufw-docker allow "traefik" 80/tcp
sudo ufw-docker allow "traefik" 443/tcp
# reload new config for ufw and docker
sudo ufw reload
sudo systemctl restart docker
```
To uninstall, simply open `/etc/ufw/after.rules` and remove lines between the comments `# BEGIN UFW AND DOCKER` and `# END UFW AND DOCKER`, then finally remove `/usr/local/bin/ufw-docker`.

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
- [ufw-doker](https://ivonblog.com/posts/fix-ufw-docker/)

## Reference
- [github.com/chaifeng/ufw-docker](https://github.com/chaifeng/ufw-docker)
## TODO
- [x] docker
- [x] https & certbot
- [x] session store
- [x] access logging
- [x] graceful shutdown (lightship)
- [x] no down time certificate update
- [x] rate limit
- [x] slow down
- [x] mysql table init
- [x] ejs frontend
- [x] swup page transition
- [x] JWT
- [x] model data typing & validating 
- [x] error handling
- [x] error page and logging
- [ ] jsdoc api documentation
- [ ] file upload and storing
- [x] helth monitoring (lightship)
- [x] traefik routing and acme challenge
- [x] jaeger tracing (badger local storage)
- [x] ufw docker firewall
- [ ] unit testing scripts
- [ ] in-memory cache for commonly used data
- [ ] kubernetes
- [ ] heroku / aws deployment script
- [ ] typescript and typedoc
- [ ] react / angular/ vue support (maybe)
- [ ] bun compatibility
- [x] traefik metrics with prometheus & grafana
- [x] 2FA authentication
