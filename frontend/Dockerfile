FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

# serve build using simple web server
# (no nginx needed)
RUN npm install -g serve

EXPOSE 3000

CMD ["serve", "-s", "build"]
