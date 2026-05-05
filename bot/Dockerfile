# Nuru bot: Node 22 + Chromium for headless Google Meet joining
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev

FROM node:22-slim AS build
WORKDIR /app
COPY package.json tsconfig.json ./
RUN npm install
COPY *.ts ./
RUN npx tsc

FROM node:22-slim
WORKDIR /app

# Install Chromium and supporting libs needed for Puppeteer.
# fonts-liberation + dbus-x11 + xvfb-like libs are required for Web Audio API
# to work in headless Chrome.
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
      chromium chromium-sandbox \
      fonts-liberation fonts-noto-color-emoji \
      libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 \
      libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc-s1 \
      libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libx11-6 \
      libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 \
      libxfixes3 libxi6 libxkbcommon0 libxrandr2 libxrender1 libxss1 libxtst6 \
      ca-certificates wget && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

ENV CHROME_EXECUTABLE_PATH=/usr/bin/chromium
ENV NODE_ENV=production
ENV PORT=8080

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./

EXPOSE 8080
CMD ["node", "dist/server.js"]
