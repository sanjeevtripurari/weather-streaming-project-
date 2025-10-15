FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build React app
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]