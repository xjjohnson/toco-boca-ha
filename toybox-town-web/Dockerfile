FROM alpine:3.20
RUN apk add --no-cache nginx curl unzip \
 && mkdir -p /srv/www /run/nginx
COPY nginx.conf /etc/nginx/nginx.conf
COPY run.sh /run.sh
RUN chmod +x /run.sh
CMD ["/run.sh"]
