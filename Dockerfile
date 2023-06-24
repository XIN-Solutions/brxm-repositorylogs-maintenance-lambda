FROM node:16

COPY * /usr/src/app/
WORKDIR /usr/src/app
CMD npm install && node dockerIndex.js
