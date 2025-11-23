# Deployment Guide

This guide covers various deployment options for the Restaurant POS System.

## Option 1: Docker Compose (Easiest)

### Requirements
- Docker and Docker Compose installed
- Domain name (optional, for production)

### Steps

1. **Prepare the server**:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose -y
```

2. **Clone and configure**:
```bash
git clone <your-repo-url>
cd mine14

# Copy and edit environment files if needed
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

3. **Start services**:
```bash
# Build and start
docker-compose up -d

# Initialize database
docker-compose exec backend npm run init-db

# Check logs
docker-compose logs -f
```

4. **Generate QR codes**:
Visit `http://your-domain/admin` and click "Generate All QR Codes"

5. **Set up reverse proxy with SSL** (production):

Install Nginx:
```bash
sudo apt install nginx certbot python3-certbot-nginx -y
```

Create nginx config `/etc/nginx/sites-available/restaurant-pos`:
```nginx
server {
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and get SSL:
```bash
sudo ln -s /etc/nginx/sites-available/restaurant-pos /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo certbot --nginx -d your-domain.com
```

## Option 2: VPS with PM2

### Requirements
- VPS (DigitalOcean, Linode, AWS EC2, etc.)
- Node.js 18+
- nginx
- PM2

### Steps

1. **Install dependencies**:
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install nginx
sudo apt install nginx -y
```

2. **Clone and setup**:
```bash
git clone <your-repo-url>
cd mine14

# Install all dependencies
npm run install:all

# Build frontend
cd frontend
npm run build
cd ..

# Initialize database
cd backend
npm run init-db
cd ..
```

3. **Configure nginx**:

Create `/etc/nginx/sites-available/restaurant-pos`:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    root /home/user/mine14/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    # QR Codes
    location /qrcodes {
        alias /home/user/mine14/backend/qrcodes;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/restaurant-pos /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

4. **Start backend with PM2**:
```bash
cd backend
pm2 start src/server.js --name restaurant-pos
pm2 save
pm2 startup
```

5. **Get SSL certificate**:
```bash
sudo certbot --nginx -d your-domain.com
```

## Option 3: Platform as a Service (PaaS)

### Heroku

1. **Create Heroku apps**:
```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login
heroku login

# Create apps
heroku create restaurant-pos-backend
heroku create restaurant-pos-frontend
```

2. **Deploy backend**:
```bash
cd backend
git init
heroku git:remote -a restaurant-pos-backend
git add .
git commit -m "Initial commit"
git push heroku master

# Initialize database
heroku run npm run init-db
```

3. **Deploy frontend**:
```bash
cd ../frontend
# Update VITE_API_URL in .env to your backend URL
git init
heroku git:remote -a restaurant-pos-frontend
heroku buildpacks:set heroku/nodejs
git add .
git commit -m "Initial commit"
git push heroku master
```

### Railway.app

1. Install Railway CLI and login
2. Create new project
3. Deploy:
```bash
railway init
railway up
```

### Render.com

1. Connect GitHub repository
2. Create Web Service for backend
3. Create Static Site for frontend
4. Configure environment variables

## Option 4: Kubernetes

For large-scale deployments, use the included Kubernetes manifests:

```bash
kubectl apply -f k8s/
```

(Note: Create k8s/ directory with deployment, service, and ingress manifests)

## Environment Variables

### Backend (.env)
```bash
PORT=3000
FRONTEND_URL=https://your-domain.com
BASE_URL=https://your-domain.com
```

### Frontend (.env)
```bash
VITE_API_URL=https://your-domain.com
VITE_WS_URL=https://your-domain.com
```

## Post-Deployment Checklist

- [ ] Database initialized
- [ ] QR codes generated
- [ ] SSL certificate installed
- [ ] Firewall configured
- [ ] Backups scheduled
- [ ] Monitoring setup
- [ ] Admin access secured
- [ ] Test order flow
- [ ] Test kitchen display
- [ ] Test server dashboard

## Maintenance

### Backups

**Database backup**:
```bash
# Docker
docker-compose exec backend sqlite3 data/restaurant.db ".backup '/app/data/backup.db'"
docker cp $(docker-compose ps -q backend):/app/data/backup.db ./backup-$(date +%Y%m%d).db

# Manual
cp backend/data/restaurant.db backup-$(date +%Y%m%d).db
```

**Automated backups** (crontab):
```bash
0 2 * * * /path/to/backup-script.sh
```

### Updates

```bash
# Pull latest code
git pull

# Docker
docker-compose down
docker-compose build
docker-compose up -d

# Manual
npm run install:all
cd frontend && npm run build
pm2 restart restaurant-pos
```

### Monitoring

**PM2 monitoring**:
```bash
pm2 monit
pm2 logs restaurant-pos
```

**Docker monitoring**:
```bash
docker-compose logs -f
docker stats
```

## Scaling

### Horizontal Scaling
- Use load balancer (nginx, HAProxy)
- Deploy multiple backend instances
- Share database volume
- Use Redis for Socket.IO adapter

### Vertical Scaling
- Increase server resources
- Optimize database queries
- Add database indexes
- Enable caching

## Troubleshooting

### Check service status
```bash
# Docker
docker-compose ps
docker-compose logs backend
docker-compose logs frontend

# PM2
pm2 status
pm2 logs restaurant-pos

# Nginx
sudo systemctl status nginx
sudo nginx -t
```

### Common Issues

**Port already in use**:
```bash
sudo lsof -i :3000
sudo kill -9 <PID>
```

**Permission denied**:
```bash
sudo chown -R $USER:$USER /home/user/mine14
```

**Database locked**:
```bash
# Stop all services accessing database
# Remove .db-shm and .db-wal files
```

## Security Hardening

1. **Add authentication** to admin routes
2. **Use HTTPS** everywhere
3. **Set up firewall**:
```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```
4. **Regular updates**:
```bash
sudo apt update && sudo apt upgrade -y
```
5. **Limit API rate** with express-rate-limit
6. **Environment secrets** in secure vault
7. **Database encryption** for sensitive data

## Support

For deployment issues, please check:
- Server logs
- Network connectivity
- Firewall settings
- Environment variables
- DNS configuration
