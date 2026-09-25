import { expect, test } from 'vitest';
import { httpUrl } from './schema';

test('httpUrl accepts http(s) URLs and rejects other protocols', () => {
  expect(httpUrl.safeParse('https://github.com/x').success).toBe(true);
  expect(httpUrl.safeParse('javascript:alert(1)').success).toBe(false);
});
