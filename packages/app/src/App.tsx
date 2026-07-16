import { createApp } from '@backstage/frontend-defaults';
import { createFrontendModule } from '@backstage/frontend-plugin-api';

import catalogPlugin from '@backstage/plugin-catalog/alpha';
import catalogImportPlugin from '@backstage/plugin-catalog-import/alpha';
import catalogGraphPlugin from '@backstage/plugin-catalog-graph/alpha';
import scaffolderPlugin from '@backstage/plugin-scaffolder/alpha';
import apiDocsPlugin from '@backstage/plugin-api-docs/alpha';
import techdocsPlugin from '@backstage/plugin-techdocs/alpha';
import techdocsAddonsModule from '@backstage/plugin-techdocs-module-addons-contrib/alpha';
import orgPlugin from '@backstage/plugin-org/alpha';
import searchPlugin from '@backstage/plugin-search/alpha';
import kubernetesPlugin from '@backstage/plugin-kubernetes/alpha';
import userSettingsPlugin from '@backstage/plugin-user-settings/alpha';
import notificationsPlugin from '@backstage/plugin-notifications/alpha';
import signalsPlugin from '@backstage/plugin-signals/alpha';
// Registers the /oauth2/authorize route required for the MCP DCR auth flow.
import authPlugin from '@backstage/plugin-auth';
import gitlabPlugin from '@immobiliarelabs/backstage-plugin-gitlab/alpha';
import argocdPlugin from '@roadiehq/backstage-plugin-argo-cd/alpha';

import { scmIntegrationsApi, scmAuthApi } from './modules/apis';
import { signInPage } from './modules/signInPage';
import { nav } from './modules/nav';
import { rootRedirectPage } from './modules/rootRedirect';

const app = createApp({
  features: [
    catalogPlugin,
    catalogImportPlugin,
    catalogGraphPlugin,
    scaffolderPlugin,
    apiDocsPlugin,
    techdocsPlugin,
    techdocsAddonsModule,
    orgPlugin,
    searchPlugin,
    kubernetesPlugin,
    userSettingsPlugin,
    notificationsPlugin,
    signalsPlugin,
    authPlugin,
    gitlabPlugin,
    argocdPlugin,
    // App-level extensions: custom APIs, GitLab sign-in and sidebar.
    createFrontendModule({
      pluginId: 'app',
      extensions: [
        scmIntegrationsApi,
        scmAuthApi,
        signInPage,
        nav,
        rootRedirectPage,
      ],
    }),
  ],
  bindRoutes({ bind }) {
    bind(catalogPlugin.externalRoutes, {
      createComponent: scaffolderPlugin.routes.root,
      viewTechDoc: techdocsPlugin.routes.docRoot,
      createFromTemplate: scaffolderPlugin.routes.selectedTemplate,
    });
    bind(apiDocsPlugin.externalRoutes, {
      registerApi: catalogImportPlugin.routes.importPage,
    });
    bind(scaffolderPlugin.externalRoutes, {
      registerComponent: catalogImportPlugin.routes.importPage,
      viewTechDoc: techdocsPlugin.routes.docRoot,
    });
    bind(orgPlugin.externalRoutes, {
      catalogIndex: catalogPlugin.routes.catalogIndex,
    });
  },
});

export default app.createRoot();
