FROM node:22-alpine AS build

WORKDIR /app/frontend

ARG VITE_ADAPTIVE_UI_ENABLED=false
ARG VITE_ADAPTIVE_UI_MODULES=
ENV VITE_ADAPTIVE_UI_ENABLED=${VITE_ADAPTIVE_UI_ENABLED} \
    VITE_ADAPTIVE_UI_MODULES=${VITE_ADAPTIVE_UI_MODULES}

COPY frontend/package*.json ./
RUN npm ci

COPY frontend ./
RUN npm run build

FROM nginx:1.27-alpine AS runtime

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
