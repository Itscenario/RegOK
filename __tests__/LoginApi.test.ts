import {
  BASE_URL,
  loginApi,
  parseUserFromApiResponse,
} from '../src/config/backend';
import { API_ROUTES } from '../src/config/routes';

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

const userResponse = (username: string, role = '0') => ({
  status_api: true,
  status_msg: 'Login success',
  Data: [{ Name: username, UserName: username, id: 2, role }],
});

test('posts the API contract to the central login route without altering the password', async () => {
  const response = userResponse('kit');
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: true,
    text: async () => JSON.stringify(response),
  });
  expect(await loginApi('kit', ' 123 ')).toEqual(response);
  expect(globalThis.fetch).toHaveBeenCalledWith(
    `${BASE_URL}${API_ROUTES.LOGIN}`,
    expect.objectContaining({
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uname: 'kit', upwd: ' 123 ' }),
    }),
  );
});

test.each(['kit', 'lunch', 'dinner'] as const)(
  'maps %s to only its assigned scanner',
  service => {
    expect(
      parseUserFromApiResponse(
        service,
        userResponse(service, String({ kit: 4, lunch: 2, dinner: 3 }[service])),
      ),
    ).toEqual({
      username: service,
      feature: 'scan',
      service,
      roles: [{ kit: 4, lunch: 2, dinner: 3 }[service]],
    });
  },
);

test('maps a multi-role account from the API', () => {
  expect(
    parseUserFromApiResponse('razaul', userResponse('razaul', '0|1|2|3')),
  ).toEqual({
    username: 'razaul',
    feature: 'scan',
    service: 'dinner',
    roles: [0, 1, 2, 3],
  });
});

test('rejects invalid JSON from the server', async () => {
  globalThis.fetch = jest.fn().mockResolvedValue({
    text: async () => '<html>error</html>',
    status: 502,
  });
  await expect(loginApi('kit', '123')).rejects.toThrow('invalid JSON');
});
