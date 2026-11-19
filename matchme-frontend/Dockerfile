# ---------- Stage 1: Build ----------
FROM node:20 AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

RUN npm install @rollup/rollup-linux-x64-gnu

COPY . .
RUN npm run build

# ---------- Stage 2: Serve ----------
FROM nginx:stable-alpine

# Copy the built files
COPY --from=build /app/dist /usr/share/nginx/html

# 🚀 NEW: Copy your custom nginx config to the correct location
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
