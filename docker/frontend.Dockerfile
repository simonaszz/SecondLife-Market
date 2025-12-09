FROM nginx:alpine

# Pašalinam default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Kopijuojam custom nginx config
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Kopijuojam frontend build'ą
COPY frontend/ /usr/share/nginx/html

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
