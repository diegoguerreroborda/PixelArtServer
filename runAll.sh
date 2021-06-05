#!/bin/bash

docker run -dti --name container3000 --env PORT=3000 -p 3000:3000 pixeldocker
docker run -dti --name container3001 --env PORT=3001 -p 3001:3001 pixeldocker
docker run -dti --name container3002 --env PORT=3002 -p 3002:3002 pixeldocker
docker run -dti --name container3003 --env PORT=3003 -p 3003:3003 pixeldocker
docker run -dti --name container3004 --env PORT=3004 -p 3004:3004 pixeldocker