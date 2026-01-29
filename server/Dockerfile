FROM node:20-alpine

WORKDIR /app

# Copy everything first (so src/ exists) and package files
COPY . .

# Install dependencies
RUN npm ci

# Build TypeScript
RUN npm run build

EXPOSE 4000

CMD ["npm", "run", "dev"]
