import {
  AuthService,
  BackstageCredentials,
  DiscoveryService,
} from '@backstage/backend-plugin-api';
import { parseEntityRef } from '@backstage/catalog-model';
import { TechDocsClient } from './techdocsClient';

describe('TechDocsClient', () => {
  const credentials = {} as BackstageCredentials;
  const discovery: DiscoveryService = {
    getBaseUrl: jest
      .fn()
      .mockResolvedValue('http://localhost:7007/api/techdocs'),
    getExternalBaseUrl: jest.fn(),
  };
  const auth = {
    getPluginRequestToken: jest.fn().mockResolvedValue({ token: 'svc-token' }),
  } as unknown as AuthService;

  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  function client() {
    return new TechDocsClient(discovery, auth);
  }

  it('requests metadata on behalf of the user with a techdocs service token', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        site_name: 'Docs',
        site_description: 'd',
        files: ['index.html'],
      }),
    });

    const result = await client().getMetadata(
      parseEntityRef('component:default/my-service'),
      credentials,
    );

    expect(auth.getPluginRequestToken).toHaveBeenCalledWith({
      onBehalfOf: credentials,
      targetPluginId: 'techdocs',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:7007/api/techdocs/metadata/techdocs/default/component/my-service',
      { headers: { Authorization: 'Bearer svc-token' } },
    );
    expect(result.site_name).toBe('Docs');
  });

  it('lowercases the storage triplet and trims leading slashes for static files', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => '<html/>' });

    await client().getStaticFile(
      parseEntityRef('Component:Default/My-Service'),
      '/getting-started/index.html',
      credentials,
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:7007/api/techdocs/static/docs/default/component/my-service/getting-started/index.html',
      { headers: { Authorization: 'Bearer svc-token' } },
    );
  });

  it('throws a descriptive error on a non-ok response', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(
      client().getMetadata(
        parseEntityRef('component:default/missing'),
        credentials,
      ),
    ).rejects.toThrow(/404 Not Found/);
  });
});
