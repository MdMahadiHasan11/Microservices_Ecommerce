FROM kong:latest

USER root

# Install Node.js if your plugin needs npm
RUN apt-get update && apt-get install -y nodejs npm \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Create plugin directory
RUN mkdir -p /usr/local/kong/js-plugins

# Copy your custom JS plugins
COPY ./plugins /usr/local/kong/js-plugins

# Install plugin dependencies
WORKDIR /usr/local/kong/js-plugins
RUN npm install || echo "No package.json or already installed"

# Switch back to kong user
USER kong