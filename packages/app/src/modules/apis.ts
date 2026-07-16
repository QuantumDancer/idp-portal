import { ApiBlueprint } from '@backstage/frontend-plugin-api';
import { configApiRef } from '@backstage/core-plugin-api';
import {
  ScmIntegrationsApi,
  scmIntegrationsApiRef,
  ScmAuth,
} from '@backstage/integration-react';

// New-frontend-system replacements for the factories previously registered in
// packages/app/src/apis.ts. They are attached to the `app` plugin as a module
// in App.tsx.
export const scmIntegrationsApi = ApiBlueprint.make({
  name: 'scm-integrations',
  params: define =>
    define({
      api: scmIntegrationsApiRef,
      deps: { configApi: configApiRef },
      factory: ({ configApi }) => ScmIntegrationsApi.fromConfig(configApi),
    }),
});

export const scmAuthApi = ApiBlueprint.make({
  name: 'scm-auth',
  params: define => define(ScmAuth.createDefaultApiFactory()),
});
