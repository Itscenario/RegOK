import { API_END_POINTS, API_ROUTES } from './routes';
import {
  findServiceUser,
  registerAuthenticatedUser,
  type ServiceUser,
} from '../auth/users';

// 1. Resolve BASE_URL from environment / .env
let rawBaseUrl = 'https://demo.itscenario.in/spotqr/beta/';

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const env = require('@env');
  if (env?.BASE_URL) {
    rawBaseUrl = env.BASE_URL;
  }
} catch {
  // Use default fallback if @env is unavailable
}

// Format BASE_URL (ensuring trailing slash)
const cleanUrl = rawBaseUrl.trim();
export const BASE_URL = cleanUrl.endsWith('/') ? cleanUrl : `${cleanUrl}/`;
export const TIMEOUT_MS = 20000;

export const BACKEND = {
  BASE_URL,
  TIMEOUT_MS,
} as const;

// Helper to construct full URL for an endpoint
export function buildUrl(endpoint: string, params?: Record<string, any>): string {
  let url = endpoint.startsWith('http://') || endpoint.startsWith('https://')
    ? endpoint
    : `${BASE_URL}${endpoint.replace(/^\/+/, '')}`;

  if (params && Object.keys(params).length > 0) {
    const query = Object.entries(params)
      .filter(([_, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
    if (query) {
      url += (url.includes('?') ? '&' : '?') + query;
    }
  }

  return url;
}

// 2. HTTP GET method
export async function get<T = any>(
  endpoint: string,
  params?: Record<string, any>,
  headers?: Record<string, string>,
): Promise<T> {
  const url = buildUrl(endpoint, params);
  console.log('[GET]', url);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...headers,
      },
      signal: controller.signal,
    });

    const rawText = await response.text();
    try {
      return JSON.parse(rawText) as T;
    } catch {
      throw new Error(`Server returned invalid JSON (Status: ${response.status})`);
    }
  } finally {
    clearTimeout(timer);
  }
}

// 3. HTTP POST method
export async function post<T = any>(
  endpoint: string,
  body?: any,
  headers?: Record<string, string>,
): Promise<T> {
  const url = buildUrl(endpoint);
  console.log('[POST]', url);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    const requestHeaders: Record<string, string> = {
      Accept: 'application/json',
      ...headers,
    };

    let requestBody: any = body;
    if (!isFormData && body && typeof body === 'object') {
      requestHeaders['Content-Type'] = 'application/json';
      requestBody = JSON.stringify(body);
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: requestHeaders,
      body: requestBody,
      signal: controller.signal,
    });

    const rawText = await response.text();
    try {
      return JSON.parse(rawText) as T;
    } catch {
      throw new Error(`Server returned invalid JSON (Status: ${response.status})`);
    }
  } finally {
    clearTimeout(timer);
  }
}

// Backend client object with GET and POST methods
export const backend = {
  BASE_URL,
  get,
  post,
  buildUrl,
};

// Types
export type LoginRequest = {
  username: string;
  password: string;
};

export type LoginApiResponse = {
  Data: any;
  status_api: boolean;
  status_msg: string;
};
export async function loginApi(
  usernameOrPayload: any,
  maybePassword?: any,
): Promise<LoginApiResponse> {

  const username =
    typeof usernameOrPayload === 'string'
      ? usernameOrPayload
      : usernameOrPayload?.username;

  const password =
    typeof usernameOrPayload === 'string'
      ? maybePassword
      : usernameOrPayload?.password;

  return post<LoginApiResponse>(
    API_END_POINTS.Get_Login,
    {
      uname: username ?? '',
      upwd: password ?? '',
    }
  );
}

export const loginService = {
  login: async (emailOrUsername: any, password: any): Promise<LoginApiResponse> => {
    return loginApi(emailOrUsername, password);
  },
};

export function parseUserFromApiResponse(
  username: string,
  res: any,
): ServiceUser {
  const raw = Array.isArray(res?.Data) ? res.Data[0] : res?.Data;
  const uname = raw?.UserName || raw?.username || username || 'user';
  const local = findServiceUser(uname);
  if (local) {
    return local;
  }

  const role = String(raw?.role || raw?.service || '').toLowerCase();
  let user: ServiceUser;
  if (role.includes('kit') || role.includes('lunch') || role.includes('dinner')) {
    const service = role.includes('kit') ? 'kit' : role.includes('dinner') ? 'dinner' : 'lunch';
    user = { username: uname, feature: 'scan', service };
  } else if (role.includes('badge')) {
    user = { username: uname, feature: 'badge' };
  } else if (role.includes('spot')) {
    user = { username: uname, feature: 'spot' };
  } else {
    user = { username: uname, feature: 'details' };
  }

  registerAuthenticatedUser(user);
  return user;
}

export { API_END_POINTS, API_ROUTES };
export default backend;
