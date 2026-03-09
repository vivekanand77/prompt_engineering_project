# 🚀 Quick Deployment Guide

Choose your preferred deployment method:

## 1. Vercel (Recommended - Easiest)

### One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/YOUR_REPO)

### CLI Deploy
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy preview
npm run deploy:preview

# Deploy production
npm run deploy:prod
```

**Add Environment Variables in Vercel Dashboard:**
- Settings → Environment Variables
- Add all keys from `.env.example`

---

## 2. Docker (Self-Hosted)

### Quick Start
```bash
# Build image
npm run docker:build

# Run container
npm run docker:run

# Or use docker-compose
docker-compose up -d
```

### Production Deployment
```bash
# Build for production
docker build -t prompt-hub:latest .

# Run with environment file
docker run -d \
  --name prompt-hub \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file .env.production \
  prompt-hub:latest

# Check logs
docker logs -f prompt-hub

# Check health
curl http://localhost:3000/api/health
```

---

## 3. Traditional Hosting (VPS/Dedicated Server)

### Requirements
- Node.js 20+
- PM2 (process manager)
- Nginx (reverse proxy)

### Setup
```bash
# Install dependencies
npm ci

# Build
npm run build

# Install PM2
npm i -g pm2

# Start with PM2
pm2 start npm --name "prompt-hub" -- start

# Save PM2 config
pm2 save
pm2 startup
```

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

## 4. AWS/GCP/Azure

### AWS Elastic Beanstalk
```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init

# Create environment
eb create production

# Deploy
eb deploy
```

### Google Cloud Run
```bash
# Build and push to Container Registry
gcloud builds submit --tag gcr.io/PROJECT_ID/prompt-hub

# Deploy
gcloud run deploy prompt-hub \
  --image gcr.io/PROJECT_ID/prompt-hub \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

---

## Post-Deployment Checklist

### Verify Deployment
```bash
# Health check
curl https://your-domain.com/api/health

# Status check
curl https://your-domain.com/api/status

# Test API
curl -X POST https://your-domain.com/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello"}'
```

### Set Up Monitoring
1. ✅ Uptime monitoring (UptimeRobot, Pingdom)
2. ✅ Error tracking (Sentry)
3. ✅ Performance monitoring (Vercel Analytics)
4. ✅ Alerts configured (Slack, Email)

### Performance Check
```bash
# Run Lighthouse
lighthouse https://your-domain.com --view

# Check metrics endpoint
curl https://your-domain.com/api/metrics
```

---

## Environment Variables

**Required:**
```env
NODE_ENV=production
```

**Optional (at least one AI provider recommended):**
```env
OPENAI_API_KEY=your_key
GOOGLE_AI_API_KEY=your_key
NVIDIA_API_KEY=your_key
```

**Firebase (if using):**
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

---

## Troubleshooting

### Build Fails
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Port Already in Use
```bash
# Find process
lsof -i :3000

# Kill process
kill -9 <PID>
```

### High Memory Usage
```bash
# Increase Node memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

### Docker Issues
```bash
# Clean Docker
docker system prune -a

# Rebuild without cache
docker build --no-cache -t prompt-hub .
```

---

## Scaling Tips

### Horizontal Scaling
- Deploy to multiple regions (Vercel Edge)
- Use load balancer (Nginx, HAProxy)
- Enable auto-scaling (AWS ECS, GCP Cloud Run)

### Database Scaling
- Use Firebase replicas
- Enable indexing
- Implement connection pooling

### Caching
- Add Redis for distributed caching
- Use CDN for static assets
- Enable browser caching

---

## Support

**Documentation:**
- [Full Deployment Guide](./DEPLOYMENT_OPTIMIZATION_GUIDE.md)
- [API Documentation](./API_DOCS.md)
- [Production Readiness Report](./PRODUCTION_READINESS_REPORT.md)

**Need Help?**
- Create an issue on GitHub
- Check Next.js docs: https://nextjs.org/docs
- Vercel support: https://vercel.com/support

---

**Ready to deploy? Choose a method above and get started!** 🚀
