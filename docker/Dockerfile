FROM node:12

ENV TZ=Asia/Singapore
RUN ln -fs /usr/share/zoneinfo/$TZ /etc/localtime && dpkg-reconfigure -f noninteractive tzdata

WORKDIR /var/www/html

COPY . /var/www/html

RUN npm install pm2 -g
RUN npm install

CMD ["pm2-runtime", "ecosystem.config.js"]