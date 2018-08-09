#!/bin/bash

set -e

host="$1"
port="$2"
dbname="$3"
username="$4"
shift 4
cmd="$@"

until pg_isready -h $host -p $port -d $dbname -U $username; do
    >&2 echo "Postgres is starting up...."
    sleep 1
done

>&2 echo "Postgres is up. Starting application."
exec $cmd
