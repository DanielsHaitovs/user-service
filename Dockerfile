FROM node:22.17.0-alpine
LABEL maintainer="Daniels Haitovs (danikhatov@gmail.com)"

# Set working directory
WORKDIR /code

# Copy package files first for better caching
COPY package*.json ./

# Install all dependencies first (including dev dependencies for build)
RUN npm ci --ignore-scripts && \
    npm cache clean --force

# Copy application code (use .dockerignore to exclude sensitive files)
COPY . .

# Build the application
RUN npm run build

# Remove dev dependencies for production
RUN npm ci --omit=dev --ignore-scripts && \
    npm cache clean --force

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node healthcheck.js || exit 1

# Expose port
EXPOSE 3000

CMD ["npm", "run", "start:prod"]