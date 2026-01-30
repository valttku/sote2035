FROM node:20-alpine
WORKDIR /app

# Copy package.json and install deps separately for caching
COPY server/package*.json ./server/
COPY client/package*.json ./client/

RUN npm --prefix server install
RUN npm --prefix client install

EXPOSE 4000 3000

CMD ["npx", "concurrently", "npm --prefix server run dev", "npm --prefix client run dev -- -H 0.0.0.0 -p 3000"]
