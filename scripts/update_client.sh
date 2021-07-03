# supply container id as argument
npm run compile
docker cp ../src/client/build/ $1:/usr/src/app/src/client/