# Moon Phase Proxy Function

This Netlify function proxies moon phase data from timeanddate.com for Jakarta.

## Setup

1. Deploy to Netlify (or compatible serverless platform)
2. The function will be available at `/api/moon?loc=jakarta`
3. Returns JSON: `{ fraction: 0.359, name: "Waning Crescent" }`

## Caching

- Function-level cache: 30 minutes
- HTTP Cache-Control: 30 minutes
- Falls back to stale cache if fetch fails

## Alternative Platforms

### Cloudflare Workers

Create `workers/moon.js`:
```js
export default {
  async fetch(request) {
    // Similar logic, use Cloudflare's fetch API
  }
}
```

### Vercel

Create `api/moon.js`:
```js
export default async function handler(req, res) {
  // Similar logic, use Node.js fetch
}
```

