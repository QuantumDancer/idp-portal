import { createMockActionContext } from '@backstage/plugin-scaffolder-node-test-utils';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createAppendFileAction } from './appendFile';

describe('fs:append', () => {
  const action = createAppendFileAction();

  // createMockActionContext allocates a temp path for workspacePath but does not
  // mkdir it — mirror what the real scaffolder does before invoking any action.
  async function makeCtx(input: { path: string; content: string }) {
    const ctx = createMockActionContext({ input });
    await mkdir(ctx.workspacePath, { recursive: true });
    return ctx;
  }

  it('appends content to an existing file', async () => {
    const ctx = await makeCtx({
      path: 'catalog-info.yaml',
      content: '\n---\nkind: System\n',
    });
    await writeFile(
      join(ctx.workspacePath, 'catalog-info.yaml'),
      'kind: Location\n',
    );

    await action.handler(ctx);

    const result = await readFile(
      join(ctx.workspacePath, 'catalog-info.yaml'),
      'utf8',
    );
    expect(result).toBe('kind: Location\n\n---\nkind: System\n');
  });

  it('creates the file if it does not exist', async () => {
    const ctx = await makeCtx({ path: 'new.yaml', content: 'hello\n' });

    await action.handler(ctx);

    const result = await readFile(join(ctx.workspacePath, 'new.yaml'), 'utf8');
    expect(result).toBe('hello\n');
  });

  it('rejects paths that escape the workspace', async () => {
    const ctx = await makeCtx({ path: '../outside.yaml', content: 'bad\n' });

    await expect(action.handler(ctx)).rejects.toThrow();
  });
});
