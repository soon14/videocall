# supply container id as argument
npm run compile
docker cp client/build/ $1:/usr/src/app/client/