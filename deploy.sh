#!/bin/bash

# Server details
SERVER="ec2-user@13.60.113.249"
KEY_PATH="/c/Users/aliou/Downloads/echelon-key.pem"  # Git Bash path format

echo "🚀 Deploying to server..."

# Create a temporary directory for essential files
echo "📦 Preparing deployment package..."
DEPLOY_DIR="deploy_temp"
rm -rf $DEPLOY_DIR 2>/dev/null  # Clean any existing temp dir
mkdir -p "$DEPLOY_DIR"

# Create all necessary directories
mkdir -p "$DEPLOY_DIR"/{css,js,images,server/{routes,controllers,middleware,models,services}}

# Copy frontend assets
echo "📦 Copying frontend files..."
cp -r css/*.css "$DEPLOY_DIR/css/"
cp -r js/*.js "$DEPLOY_DIR/js/"
cp -r images/* "$DEPLOY_DIR/images/"

# Copy server files with full directory structure
echo "📦 Copying server files..."
cp -r \
    server/routes/* \
    "$DEPLOY_DIR/server/routes/"

cp -r \
    server/controllers/* \
    "$DEPLOY_DIR/server/controllers/"

cp -r \
    server/middleware/* \
    "$DEPLOY_DIR/server/middleware/"

cp -r \
    server/models/* \
    "$DEPLOY_DIR/server/models/"

cp -r \
    server/services/* \
    "$DEPLOY_DIR/server/services/"

# Copy server root files
cp server/*.js "$DEPLOY_DIR/server/"

# Copy root level essential files
cp \
    package.json \
    package-lock.json \
    .env \
    index.html \
    home.html \
    faq.html \
    leaderboard.html \
    "$DEPLOY_DIR/"

# Ensure key has correct permissions
chmod 400 "$KEY_PATH"

# Copy files to server
echo "📤 Uploading to server..."
scp -i "$KEY_PATH" -r "$DEPLOY_DIR"/* "$SERVER:~/echelon/"

# Clean up local temp directory
rm -rf "$DEPLOY_DIR"

# Restart server with proper error handling
echo "🔄 Restarting server..."
ssh -i "$KEY_PATH" $SERVER "cd ~/echelon && \
    echo 'Installing dependencies...' && \
    npm install --production && \
    echo 'Installing additional dependencies...' && \
    npm install bcryptjs jsonwebtoken nodemailer multer mongoose cors express socket.io dotenv && \
    echo 'Stopping existing PM2 processes...' && \
    pm2 stop all || true && \
    pm2 delete all || true && \
    echo 'Starting server...' && \
    PORT=5000 NODE_ENV=production pm2 start server/server.js --name 'echelon' --time && \
    pm2 save && \
    echo 'Checking server status...' && \
    sleep 5 && \
    pm2 list && \
    pm2 logs --lines 20 --nostream && \
    echo 'Checking if server is listening on port 5000...' && \
    netstat -tlpn | grep 5000"

echo "✅ Done! Site should be live at https://project-echelon.com"
