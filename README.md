# "You're absolutely right!" counter

A fun webpage that tracks how many times Claude Code says "You're absolutely right!" with a beautiful counter display and unified chart showing daily activity comparison.

## Tech Stack

- Next.js 14, React, TypeScript, Tailwind CSS
- Redis database via Vercel
- Recharts for the histogram
- Claude Code hook for automatic detection

## Local Development

### Prerequisites
- Node.js 18+ 
- Docker and Docker Compose

### Setup

```bash
git clone https://github.com/yourusername/i-am-absolutely-right.git
cd i-am-absolutely-right
npm install

# Copy environment variables template
cp .env.example .env.development.local

# Edit .env.development.local with your values:
# - Set your API_SECRET (generate with: openssl rand -base64 32)
# - Update COUNTER_API_URL with your domain

# Start local Redis with Docker
docker-compose up -d

# Start the development server
npm run dev
```

The app will be available at `http://localhost:3000`

### Environment Variables

The following environment variables are required:

| Variable | Description | Example |
|----------|-------------|---------|
| `API_SECRET` | Secret key for API authentication | `randombase64string` |
| `REDIS_URL` | Redis connection URL | `redis://default:devpassword@localhost:6379` |
| `COUNTER_API_URL` | API endpoint for both counters (uses type parameter) | `https://your-domain.com/api/increment` |

**Note**: GitHub URL and site URL are now automatically provided by Vercel's built-in environment variables (`VERCEL_GIT_REPO_OWNER`, `VERCEL_GIT_REPO_SLUG`, `VERCEL_URL`).

Create a `.env.development.local` file with these variables for local development.

### Docker Services

- **Redis**: `localhost:6379` (password: `devpassword`)
- View Redis data: `docker exec -it absolutely-right-redis redis-cli -a devpassword`
- Stop services: `docker-compose down`

## Vercel Deployment

1. Create new Vercel project from GitHub repo
2. Add Redis database in Storage tab
3. Set `API_SECRET` environment variable (`openssl rand -base64 32`)
4. Add custom domain if desired
5. Deploy

## Claude Code Hook

The `claude-hook.js` script automatically detects phrases and increments counters via API calls. It uses different environment files based on context:

### Environment Configuration

- **Production (Claude Hook)**: Uses `.env.production.local` 
- **Development (Testing)**: Uses `.env.development.local`

Create both files with appropriate settings (you can use `vercel env pull` if you have set up environment variables in vercel for your deployment):

**.env.development.local** (for local testing):
```bash
API_SECRET=your_dev_secret_here
COUNTER_API_URL=http://localhost:3000/api/increment
```

**.env.production.local** (for Claude Code hook):
```bash
API_SECRET=your_prod_secret_here
COUNTER_API_URL=https://your-domain.com/api/increment
```

### Setup Hook in Claude Code

Use the Claude Code hooks wizard to add a `Stop` event hook:

**Command**: `NODE_ENV=production /path/to/your/project/claude-hook.js`

### Testing

Test the hook locally against your development server:
```bash
# Test "absolutely right" counter
NODE_ENV=development node claude-hook.js --test

# Test issue detection counter  
NODE_ENV=development node claude-hook.js --test-issue

# Show help
node claude-hook.js --help
```

The script automatically sets `NODE_ENV=development` for test commands and `NODE_ENV=production` for normal hook execution.

## License

GPL-3.0 License - see LICENSE file for details.

---

Made with ❤️ and Claude Code enthusiasm 🤖