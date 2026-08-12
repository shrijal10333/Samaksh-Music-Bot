FROM node:20-slim

# Install dependencies for canvas and sqlite
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    cairo \
    pango1.0-tools \
    libpng-dev \
    jpeg-dev \
    giflib-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
