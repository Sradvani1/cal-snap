import { COPY_REGISTRY, type CopyKey } from './keys';

export type CopyParams = Record<string, string | number>;

export function copy(key: CopyKey, params?: CopyParams): string {
  const template = COPY_REGISTRY[key];
  if (!params) {
    return template;
  }

  return template.replace(/\{\{(\w+)\}\}/g, (_, name: string) => {
    const value = params[name];
    return value !== undefined ? String(value) : `{{${name}}}`;
  });
}

export { COPY_REGISTRY, type CopyKey } from './keys';
