#!/bin/bash

##############################
#   Start script to handle   #
#       login and watch      #
##############################


APP_DIRECTORY=/home/node/app

function check_for_config(){
    if [ ! -f "$CONFIG_FOLDER/config.json" ];then
        echo "[!] config.json not locatable, please copy to mounted volume."
        exit 1
    else
        echo "[✓] config.json found"
    fi

    # Check if email was changed
    EMAIL=$(jq -r '.api.credentials.email' $CONFIG_FOLDER/config.json)
    if [ "$EMAIL" = "Email of your TooGoodToGo account." ]; then
        echo "[!] E-Mail not set. Please configure config.json"
        exit 1;
    else
        echo "[✓] E-Mail: $EMAIL "
    fi
}


# Check if session in config.json exists. This way login can be skipped.
function check_for_session(){
    if jq --exit-status '.api.session.userId' $CONFIG_FOLDER/config.json >/dev/null; then 
        echo "Start watching..."
        start_watch
    else
        echo "[!] You're not logged in yet. Try login now.." 
        echo ""
        login_user
    fi
}
function login_user(){
    # enter app directory
    cd $APP_DIRECTORY || exit

    # start login in seperate interactive shell
    tee >(node index.js login) | tee -a /tmp/out.log

    # check log of node start for errors
    if grep -q "You are now successfully logged in!" /tmp/out.log; then
        echo "[✓] Session stored. Starting service.."
        start_watch
    elif grep -q "TERMS" /tmp/out.log; then 
        echo "[ERROR] Polling failed. Please try differnt adress." 
        exit 1;
    else
        echo "[ERROR] Please check message" 
    fi
    rm /tmp/out.log
    exit 1
}

start_watch(){
    cd $APP_DIRECTORY || exit
    node index.js watch
}

case $1 in
"init")
    check_for_config
    check_for_session
    ;;
"reset")
    echo "[✓] Resetting config.."
    rm $CONFIG_FOLDER/config.json
    cp config.defaults.json $CONFIG_FOLDER/config.json
    ;;
*)
    exit 1
    ;;
esac