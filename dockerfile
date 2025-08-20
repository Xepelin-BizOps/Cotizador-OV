# Imagen de node 22
FROM node:22-alpine

# Crea el directorio de trabajo
WORKDIR /app

# Copia package.json y lock
COPY package*.json ./

# Instala dependencias
RUN npm install

# Copia todo el código
COPY . .

# Genera el cliente Prisma
RUN npx prisma generate

# Construye la app 
RUN npm run build

# Expone el puerto
EXPOSE 3000

# Comando para iniciar la app
CMD ["npm", "start"]
