import {proxyStore} from '@/lib/hosting-proxy';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export const GET = (request: Request) => proxyStore(request, '/api/store');
export const POST = (request: Request) => proxyStore(request, '/api/store');
