import { copy } from '@/lib/copy/copy';

export function notSignedInError(): Error {
  return new Error(copy('common.error.notSignedIn'));
}
