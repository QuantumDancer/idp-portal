import { SignInPageBlueprint } from '@backstage/plugin-app-react';
import { SignInPage } from '@backstage/core-components';
import { gitlabAuthApiRef } from '@backstage/core-plugin-api';

// GitLab OAuth sign-in, previously configured via convertLegacyAppOptions'
// `components.SignInPage`. `auto` skips the provider-picker and immediately
// starts the GitLab flow since it is the only provider.
export const signInPage = SignInPageBlueprint.make({
  params: {
    loader: async () => (props: any) =>
      (
        <SignInPage
          {...props}
          auto
          provider={{
            id: 'gitlab-auth-provider',
            title: 'GitLab',
            message: 'Sign in using GitLab',
            apiRef: gitlabAuthApiRef,
          }}
        />
      ),
  },
});
