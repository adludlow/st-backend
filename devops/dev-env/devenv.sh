#!/bin/bash
###############################################################################
#
# script: devenv.sh
# desription: exports functions for bootstrapping and controlling a local
#             development environment.
#
###############################################################################

##  Initial Sanity checks

# Check if the script was called rather than sourced.
if [ x"${BASH_SOURCE[0]}" == x"$0" ]
then
    echo "This script should be sourced, not called. e.g. source dev-env.sh \`pwd\`"
    exit 1
fi

# Check if a parameter was passed
if [ $# -eq 0 ]
then
    echo "No parameters passed. Please pass the path to the dev-env directory"
    return 1
fi

DOCKER_COMPOSE_CONFIG="docker-compose.yml"
DEV_ENV_DIR=$1

# Check if the required files exist in the directory passed.
if [ ! -f $DEV_ENV_DIR/$DOCKER_COMPOSE_CONFIG ]
then
    echo "Directory $DEV_ENV_DIR does not contain the $DOCKER_COMPOSE_CONFIG file."
    return 1
fi

## Function definitions

###############################################################################
#
# Function: startup()
# Description: runs docker-compose to build (if necessary) and startup the
#              containers specified in docker-compose.yml file
#
###############################################################################
function startup() {
    docker-compose -f $DEV_ENV_DIR/$DOCKER_COMPOSE_CONFIG up
}

###############################################################################
#
# Function: teardown()
# Description: shutsdown and deletes all containers created by calling startup
#
###############################################################################
function teardown() {
    docker-compose -f $DEV_ENV_DIR/$DOCKER_COMPOSE_CONFIG down
}

###############################################################################
#
# Function: flyway()
# Description: runs flyway in a container. Migration scripts will e picked up
#              from the ../../db/migrations directory.
#              Any arguments passed to this function will be passed on to
#              flyway.
#
###############################################################################
function flyway() {
    docker run -ti --rm --net devenv_default -v $DEV_ENV_DIR/../../db/migrations:/flyway/sql -v $DEV_ENV_DIR/flyway/flyway.conf:/flyway/conf/flyway.conf devenv_flyway $@ -user=${DB_USER} -password=${DB_PASS} -schemas=${DB_SCHEMA} -placeholders.main_schema=${DB_SCHEMA} -placeholders.connect_user=${DB_SCT_CONNECT_USER} -placeholders.connect_user_pass=${DB_SCT_CONNECT_PASS} -placeholders.admin_user=${DB_USER}
}

export -f startup teardown
export DB_USER=sct_admin
export DB_PASS=p6hYJ3UUUBz^A#tV
export DB_SCT_CONNECT_PASS=7YSr66Ge6ZkyCpcz
export DB_SCT_CONNECT_USER=sct_connect
export DB_NAME=sct
export DB_SCHEMA=sct
export DB_URL="postgres://db:5432/sct"
export JWT_SECRET="Bv0UeIlDFlRnF0adcYMiL0YVjpuTDBZZ"
