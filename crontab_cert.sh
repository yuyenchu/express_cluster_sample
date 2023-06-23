#!/bin/bash 

SCRIPT=$(readlink -f "$0")
SCRIPTPATH=$(dirname "$SCRIPT")
CRONCMD="sh $SCRIPTPATH/certbot.sh"
CRONJOB="0 0 * * * $CRONCMD"
( crontab -l | grep -v -F "$CRONCMD" ; echo "$CRONJOB" ) | crontab -