# FROM kong:latest

# USER root

# RUN apt-get update && apt-get install -y nodejs npm && npm install -g kong-pdk

# RUN mkdir -p /usr/local/kong/js-plugins
# COPY ./plugins /usr/local/kong/js-plugins
# RUN cd /usr/local/kong/js-plugins && npm install

# USER kong


FROM kong:latest

USER root

# install node
RUN apt-get update && apt-get install -y nodejs npm

# install plugin server
RUN npm install -g kong-js-pluginserver

# create plugin dir
RUN mkdir -p /usr/local/kong/js-plugins

# copy plugins (IMPORTANT PATH)
COPY ./config/plugins /usr/local/kong/js-plugins

# install dependency for plugin
WORKDIR /usr/local/kong/js-plugins/custom-auth
RUN npm install

USER kong