# Use Playwright Docker image matching your installed version
FROM mcr.microsoft.com/playwright:v1.55.0-jammy

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy the rest of the code
COPY . .

# Expose the port (Render expects this)
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]