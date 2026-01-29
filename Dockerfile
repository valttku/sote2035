# -------- Server Build --------
FROM node:20-alpine AS server-build
WORKDIR /server
COPY server/ ./
RUN npm ci
RUN npm run build

# -------- Client Build --------
FROM node:20-alpine AS client-build
WORKDIR /client
COPY client/ ./  
RUN npm ci
RUN npm run build

# -------- Final Image --------
FROM node:20-alpine
WORKDIR /app

COPY --from=server-build /server /app/server
COPY --from=client-build /client /app/client

EXPOSE 4000 3000

CMD ["npx", "concurrently", "npm --prefix server run dev", "npm --prefix client run dev -- -H 0.0.0.0 -p 3000"]

