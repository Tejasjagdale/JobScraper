# Use Playwright image (includes Chromium/Firefox/WebKit already installed)
FROM mcr.microsoft.com/playwright:v1.46.0-jammy

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

# Render provides PORT; ensure we listen on it
ENV NODE_ENV=production
EXPOSE 10000

CMD ["node", "server.js"]
