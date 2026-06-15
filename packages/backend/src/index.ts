// Must be the very first import so OTel patches Node.js internals before
// any other module is loaded. See packages/backend/src/instrumentation.ts.
import './instrumentation';

import { createBackend } from '@backstage/backend-defaults';
import {
  gitlabPlugin,
  catalogPluginGitlabFillerProcessorModule,
} from '@immobiliarelabs/backstage-plugin-gitlab-backend';
import { scaffolderModuleCustomActions } from './scaffolder/module';
import { techdocsModuleMcpActions } from './techdocs/module';

const backend = createBackend();

backend.add(import('@backstage/plugin-app-backend'));
backend.add(import('@backstage/plugin-proxy-backend'));

// scaffolder plugin
backend.add(import('@backstage/plugin-scaffolder-backend'));
backend.add(import('@backstage/plugin-scaffolder-backend-module-gitlab'));
backend.add(
  import('@backstage/plugin-scaffolder-backend-module-notifications'),
);
backend.add(scaffolderModuleCustomActions);

// techdocs plugin
backend.add(import('@backstage/plugin-techdocs-backend'));
// registers techdocs:get-metadata and techdocs:get-content in the Actions
// Registry so the MCP server can expose docs to AI clients (see pluginSources)
backend.add(techdocsModuleMcpActions);

// auth plugin
backend.add(import('@backstage/plugin-auth-backend'));
// See https://backstage.io/docs/backend-system/building-backends/migrating#the-auth-plugin
backend.add(import('@backstage/plugin-auth-backend-module-gitlab-provider'));
// See https://backstage.io/docs/auth/gitlab/provider

// catalog plugin
backend.add(import('@backstage/plugin-catalog-backend'));
backend.add(
  import('@backstage/plugin-catalog-backend-module-scaffolder-entity-model'),
);
backend.add(import('@backstage/plugin-catalog-backend-module-gitlab'));
backend.add(import('@backstage/plugin-catalog-backend-module-gitlab-org'));

// See https://backstage.io/docs/features/software-catalog/configuration#subscribing-to-catalog-errors
backend.add(import('@backstage/plugin-catalog-backend-module-logs'));

// permission plugin
backend.add(import('@backstage/plugin-permission-backend'));
// See https://backstage.io/docs/permissions/getting-started for how to create your own permission policy
backend.add(
  import('@backstage/plugin-permission-backend-module-allow-all-policy'),
);

// search plugin
backend.add(import('@backstage/plugin-search-backend'));

// search engine
// See https://backstage.io/docs/features/search/search-engines
backend.add(import('@backstage/plugin-search-backend-module-pg'));

// search collators
backend.add(import('@backstage/plugin-search-backend-module-catalog'));
backend.add(import('@backstage/plugin-search-backend-module-techdocs'));

// kubernetes plugin
backend.add(import('@backstage/plugin-kubernetes-backend'));

// notifications and signals plugins
backend.add(import('@backstage/plugin-notifications-backend'));
backend.add(import('@backstage/plugin-signals-backend'));

// argocd plugin (Roadie) - queries ArgoCD instances and exposes sync/health data
backend.add(import('@roadiehq/backstage-plugin-argo-cd-backend'));

// gitlab plugin (immobiliarelabs) - exposes /api/gitlab proxy and REST endpoints
// used by the @immobiliarelabs/backstage-plugin-gitlab frontend plugin
backend.add(gitlabPlugin);
// auto-fills gitlab.com/project-slug annotation on catalog entities discovered from GitLab
backend.add(catalogPluginGitlabFillerProcessorModule);

// MCP server - exposes Backstage actions as MCP tools for AI assistants
backend.add(import('@backstage/plugin-mcp-actions-backend'));

backend.start();
