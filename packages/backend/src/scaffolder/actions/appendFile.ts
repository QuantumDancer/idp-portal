import { resolveSafeChildPath } from '@backstage/backend-plugin-api';
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { appendFile } from 'node:fs/promises';

/**
 * Custom `fs:append` scaffolder action.
 *
 * Backstage ships `fs:delete`, `fs:rename`, and `fs:readdir` but not `fs:append`.
 * Templates that concatenate YAML documents into a catalog file need this action.
 */
export function createAppendFileAction() {
  return createTemplateAction({
    id: 'fs:append',
    // Only UTF-8 content is supported; appending binary data will corrupt the file.
    description: 'Appends UTF-8 content to a file in the scaffolder workspace.',
    schema: {
      input: z =>
        z.object({
          path: z
            .string()
            .describe('Workspace-relative path to the target file'),
          content: z.string().describe('Content to append'),
        }),
    },
    async handler(ctx) {
      // resolveSafeChildPath throws if the resolved path escapes the workspace,
      // preventing directory traversal attacks via template inputs.
      const target = resolveSafeChildPath(ctx.workspacePath, ctx.input.path);
      await appendFile(target, ctx.input.content, 'utf8');
      ctx.logger.info(`Appended to ${ctx.input.path}`);
    },
  });
}
