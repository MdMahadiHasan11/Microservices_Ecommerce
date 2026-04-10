FROM kong:latest

USER root

RUN apt-get update && apt-get install -y curl nodejs npm

RUN mkdir -p /usr/local/kong/js-plugins

COPY ./plugins /usr/local/kong/js-plugins

WORKDIR /usr/local/kong/js-plugins/custom-auth
RUN npm install

USER kong