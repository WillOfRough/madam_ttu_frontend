# Build stage
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# nginx:alpine 이 /etc/nginx/templates/*.template 을 envsubst 처리해
# /etc/nginx/conf.d/*.conf 로 출력한다. BACKEND_HOST 는 Cloud Run env 로 주입.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
