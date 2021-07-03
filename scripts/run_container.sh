#!/bin/bash
# Replaces the old chat room container with a new one

IMAGE_NAME=victor/video-call
CONTAINER_NAME=victor-video-call
IP=$(docker inspect videocall | grep Gateway | awk -F '"' '{ print $4 }')

docker stop $CONTAINER_NAME
docker container rm $CONTAINER_NAME

docker image rm $IMAGE_NAME
npm run compile
docker build -t $IMAGE_NAME ../

docker run -p $IP:8080:8080 -p $IP:3000:3000 -d --network videocall --name $CONTAINER_NAME $IMAGE_NAME

