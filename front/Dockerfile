FROM node:19-alpine

WORKDIR /app

# package.json と package-lock.json をコピーして依存関係をインストール
COPY package.json package-lock.json ./
RUN npm ci

# ソースコードをすべてコピー
COPY . .

# Next.js アプリのビルド
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]