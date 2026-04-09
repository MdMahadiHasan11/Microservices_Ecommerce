FROM kong:latest

USER root

# Debian/Ubuntu ভিত্তিক ইমেজের জন্য Node.js + npm ইনস্টল
RUN apt-get update && \
    apt-get install -y nodejs npm && \
    rm -rf /var/lib/apt/lists/*

# Dependencies ইনস্টল (axios)
COPY package.json /tmp/
RUN cd /tmp && npm install --production

# আপনার JS plugin কপি
COPY js-plugins /usr/local/kong/js-plugins

# node_modules কপি
RUN cp -r /tmp/node_modules /usr/local/kong/js-plugins/

USER kong

# JS Plugin Server Configuration
ENV KONG_PLUGINS=bundled,custom-auth
ENV KONG_PLUGINSERVER_NAMES=js
ENV KONG_PLUGINSERVER_JS_SOCKET=/usr/local/kong/js_pluginserver.sock
ENV KONG_PLUGINSERVER_JS_START_CMD="/usr/local/bin/kong-js-pluginserver --plugins-directory /usr/local/kong/js-plugins"
ENV KONG_PLUGINSERVER_JS_QUERY_CMD="/usr/local/bin/kong-js-pluginserver --plugins-directory /usr/local/kong/js-plugins --dump-all-plugins"