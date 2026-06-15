import {
  AuthService,
  BackstageCredentials,
  DiscoveryService,
} from '@backstage/backend-plugin-api';
import { CompoundEntityRef } from '@backstage/catalog-model';

/**
 * Thin client over the TechDocs backend HTTP API.
 *
 * Requests are made on behalf of the calling user (`credentials`) so TechDocs
 * applies the same read permissions it would for that user in the web UI.
 * Storage paths are lowercased because the TechDocs publisher stores documents
 * under a lowercased `namespace/kind/name` triplet regardless of entity casing.
 */
export class TechDocsClient {
  constructor(
    private readonly discovery: DiscoveryService,
    private readonly auth: AuthService,
  ) {}

  private async fetch(
    path: string,
    credentials: BackstageCredentials,
  ): Promise<Response> {
    const baseUrl = await this.discovery.getBaseUrl('techdocs');
    const { token } = await this.auth.getPluginRequestToken({
      onBehalfOf: credentials,
      targetPluginId: 'techdocs',
    });
    return fetch(`${baseUrl}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async getMetadata(
    entity: CompoundEntityRef,
    credentials: BackstageCredentials,
  ): Promise<{
    site_name: string;
    site_description: string;
    build_timestamp?: number;
    files?: string[];
  }> {
    const { namespace, kind, name } = entity;
    const response = await this.fetch(
      `/metadata/techdocs/${namespace}/${kind}/${name}`,
      credentials,
    );
    if (!response.ok) {
      throw new Error(
        `Failed to fetch TechDocs metadata for ${kind}:${namespace}/${name} (${response.status} ${response.statusText})`,
      );
    }
    return response.json();
  }

  async getStaticFile(
    entity: CompoundEntityRef,
    filePath: string,
    credentials: BackstageCredentials,
  ): Promise<string> {
    const namespace = entity.namespace.toLowerCase();
    const kind = entity.kind.toLowerCase();
    const name = entity.name.toLowerCase();
    const normalizedPath = filePath.replace(/^\/+/, '');
    const response = await this.fetch(
      `/static/docs/${namespace}/${kind}/${name}/${normalizedPath}`,
      credentials,
    );
    if (!response.ok) {
      throw new Error(
        `Failed to fetch TechDocs page "${normalizedPath}" for ${kind}:${namespace}/${name} (${response.status} ${response.statusText})`,
      );
    }
    return response.text();
  }
}
