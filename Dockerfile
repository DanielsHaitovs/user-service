FROM node:22.17.0-alpine
LABEL maintainer="Daniels Haitovs (danikhatov@gmail.com)"

# Install build dependencies required for native C++ modules (like bcrypt/argon2)
RUN apk add --no-cache python3 make g++

WORKDIR /code

COPY package*.json ./

# 1. Install all dependencies so things compile and build cleanly
RUN npm ci && \
    npm cache clean --force

COPY . .

# 2. Build the application
RUN npm run build

# 3. FIX: Prune away devDependencies without triggering the breaking husky hooks
# This keeps your pre-compiled production C++ modules perfectly intact
RUN npm prune --omit=dev

EXPOSE 3000

CMD ["npm", "run", "start:prod"]