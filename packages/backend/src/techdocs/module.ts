import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { actionsRegistryServiceRef } from '@backstage/backend-plugin-api/alpha';
import { parseEntityRef } from '@backstage/catalog-model';
import { TechDocsClient } from './techdocsClient';
import { htmlToText } from './htmlToText';

/**
 * Registers TechDocs actions in the Actions Registry so the MCP server can
 * expose them as tools. TechDocs itself ships no actions; without this module
 * AI clients cannot read documentation.
 *
 * The actions are surfaced over MCP by adding `'techdocs'` to
 * `backend.actions.pluginSources` in app-config.
 */
export const techdocsModuleMcpActions = createBackendModule({
  pluginId: 'techdocs',
  moduleId: 'mcp-actions',
  register(env) {
    env.registerInit({
      deps: {
        actionsRegistry: actionsRegistryServiceRef,
        discovery: coreServices.discovery,
        auth: coreServices.auth,
      },
      async init({ actionsRegistry, discovery, auth }) {
        const techdocs = new TechDocsClient(discovery, auth);

        actionsRegistry.register({
          name: 'get-metadata',
          title: 'Get TechDocs Metadata',
          description:
            'Returns the site name, description and the list of available documentation page paths for a catalog entity that has TechDocs.',
          schema: {
            input: z =>
              z.object({
                entityRef: z
                  .string()
                  .describe(
                    'Entity reference whose docs to inspect, e.g. "component:default/my-service".',
                  ),
              }),
            output: z =>
              z.object({
                siteName: z.string(),
                siteDescription: z.string(),
                buildTimestamp: z.number().optional(),
                files: z
                  .array(z.string())
                  .describe('Page paths servable via techdocs:get-content.'),
              }),
          },
          attributes: { readOnly: true, idempotent: true },
          action: async ({ input, credentials }) => {
            const entity = parseEntityRef(input.entityRef);
            const metadata = await techdocs.getMetadata(entity, credentials);
            return {
              output: {
                siteName: metadata.site_name,
                siteDescription: metadata.site_description,
                buildTimestamp: metadata.build_timestamp,
                files: metadata.files ?? [],
              },
            };
          },
        });

        actionsRegistry.register({
          name: 'get-content',
          title: 'Get TechDocs Page Content',
          description:
            'Returns the rendered documentation of a TechDocs page as readable plain text. Use techdocs:get-metadata to discover available page paths.',
          schema: {
            input: z =>
              z.object({
                entityRef: z
                  .string()
                  .describe(
                    'Entity reference whose docs to read, e.g. "component:default/my-service".',
                  ),
                path: z
                  .string()
                  .optional()
                  .describe(
                    'Page path relative to the docs root, e.g. "index.html" or "getting-started/index.html". Defaults to "index.html".',
                  ),
              }),
            output: z =>
              z.object({
                entityRef: z.string(),
                path: z.string(),
                content: z.string(),
              }),
          },
          attributes: { readOnly: true, idempotent: true },
          action: async ({ input, credentials }) => {
            const entity = parseEntityRef(input.entityRef);
            const path = input.path ?? 'index.html';
            const html = await techdocs.getStaticFile(
              entity,
              path,
              credentials,
            );
            return {
              output: {
                entityRef: input.entityRef,
                path,
                content: htmlToText(html),
              },
            };
          },
        });
      },
    });
  },
});
