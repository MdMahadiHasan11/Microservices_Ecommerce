# Base image
FROM node:20

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy all source files
COPY . .

# Expose port (যা .env এ আছে)
EXPOSE 4001

# Start server
CMD ["npm", "run", "start:dev"]
