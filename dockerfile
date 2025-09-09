# Use the official Playwright image (browsers already installed)
FROM mcr.microsoft.com/playwright:v1.55.0-jammy

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source code
COPY . .

# Render provides $PORT
ENV NODE_ENV=production
EXPOSE 10000

CMD ["node", "server.js"]
