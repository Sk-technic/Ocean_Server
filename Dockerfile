# Step 1: Base image
FROM node:18

# Step 2: Working directory
WORKDIR /app

# Step 3: Copy package.json and install deps
COPY package*.json ./
RUN npm install

# Step 4: Copy source code
COPY . .

# Step 5: Build TypeScript
RUN npm run build

# Step 6: Expose port
EXPOSE 8000

# Step 7: Start app
CMD ["node", "dist/main.js"]
