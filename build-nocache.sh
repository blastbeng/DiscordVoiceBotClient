#!/bin/sh
docker build . -f ./Dockerfile.client  -t scemo-pezzente-discord:latest --no-cache
