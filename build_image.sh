#!/bin/bash

npm run compile
docker build -t victor/video-call .

