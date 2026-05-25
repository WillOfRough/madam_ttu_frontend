# Build stage
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
# ENV: 'prd' (기본, 운영 백엔드 love-soul) | 'dev' (개발 백엔드 dev-knotsandlinks-backend)
# Cloud Run dev 빌드 시 `--build-arg ENV=dev` 명시 필요. prd는 기본값 사용.
FROM nginx:alpine
ARG ENV=prd
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.${ENV}.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
