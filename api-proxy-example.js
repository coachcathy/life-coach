/**
 * Cloudflare Worker example for protecting a Twelve Data API key.
 * Add a Worker secret named TWELVE_DATA_API_KEY and deploy.
 * Then enter the Worker URL in SLY Command Center > Investments.
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return cors(new Response(null, { status: 204 }));
    if (url.searchParams.get('provider') !== 'twelvedata') return cors(json({ error: 'Unsupported provider' }, 400));
    const symbol = (url.searchParams.get('symbol') || '').toUpperCase().replace(/[^A-Z0-9.:-]/g, '');
    if (!symbol) return cors(json({ error: 'Symbol is required' }, 400));
    const upstream = await fetch(`https://api.twelvedata.com/price?symbol=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(env.TWELVE_DATA_API_KEY)}`);
    return cors(new Response(await upstream.text(), { status: upstream.status, headers: { 'content-type': 'application/json' } }));
  }
};
function json(data, status=200){ return new Response(JSON.stringify(data), {status, headers:{'content-type':'application/json'}}); }
function cors(response){ const h=new Headers(response.headers);h.set('access-control-allow-origin','*');h.set('access-control-allow-methods','GET,OPTIONS');return new Response(response.body,{status:response.status,headers:h}); }
