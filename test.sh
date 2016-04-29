#!/usr/bin/env bash

set -e -o pipefail

cd `dirname $0`

node dist/tools/tsc-watch/ node watch
# node dist/tools/tsc-watch/ browser watch
