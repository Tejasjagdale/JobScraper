# Use official Playwright image with Node
FROM mcr.microsoft.com/playwright:v1.55.0-jammy

# Set working directory
WORKDIR /app

# Copy package.json and install deps
COPY package*.json tsconfig.json ./
RUN npm install

# Copy source code
COPY src ./src

# Build TypeScript → dist
RUN npm run build

# Expose API port
EXPOSE 10000

# Start server
CMD ["npm", "start"]