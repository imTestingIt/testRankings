FROM ghcr.io/puppeteer/puppeteer:24.2.0

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci
COPY . .
CMD ["node", "index.js"]