#!/bin/bash 

SCRIPT=$(readlink -f "$0")
SCRIPTPATH=$(dirname "$SCRIPT")
DOMAIN_NAME=YOUR_DOMAIN_NAME
EMAIL_ADDRESS=YOUR_EMAIL_ADDRESS
docker run --rm  -v $SCRIPTPATH/cert:/etc/letsencrypt  -p 80:80 -ti certbot/certbot certonly --standalone --email $EMAIL_ADDRESS --agree-tos --preferred-challenges http -d $DOMAIN_NAME