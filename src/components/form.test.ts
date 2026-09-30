import { expect, test } from 'vitest';
import { render } from '../test/render';
import ChoicePills from './ChoicePills.astro';
import TextField from './TextField.astro';

test('TextField pairs a label with an input, and marks optional fields', async () => {
  const html = await render(TextField, {
    props: { label: 'Company', name: 'company', autocomplete: 'organization', optional: true },
  });
  const id = html.match(/<input[^>]*id="([^"]+)"/)?.[1];
  expect(id).toBeTruthy();
  expect(html).toMatch(new RegExp(`<label[^>]*for="${id}"[^>]*>[\\s\\S]*Company`));
  expect(html).toContain('(optional)');
  expect(html).toMatch(/<input[^>]*name="company"[^>]*autocomplete="organization"/);
  expect(html).not.toMatch(/<input[^>]*required/);
});

test('TextField renders a required textarea when multiline', async () => {
  const html = await render(TextField, {
    props: { label: 'Message', name: 'message', rows: 6, minlength: 12, required: true },
  });
  expect(html).toMatch(/<textarea[^>]*name="message"[^>]*rows="6"/);
  expect(html).toMatch(/<textarea[^>]*minlength="12"/);
  expect(html).toMatch(/<textarea[^>]*required/);
  expect(html).not.toContain('(optional)');
});

test('ChoicePills is a fieldset of native radios with the chosen value checked', async () => {
  const html = await render(ChoicePills, {
    props: {
      legend: "What's this about",
      name: 'reason',
      value: 'b',
      options: [
        { value: 'a', label: 'Option A', hint: 'Hint A' },
        { value: 'b', label: 'Option B', hint: 'Hint B' },
      ],
    },
  });
  expect(html).toMatch(/<fieldset[^>]*class="rvd-choice-pills"/);
  expect(html).toMatch(/<legend[^>]*>What&#39;s this about<\/legend>/);
  expect(html.match(/<input[^>]*type="radio"/g)).toHaveLength(2);
  expect(html).toMatch(/<input[^>]*value="b"[^>]*checked|<input[^>]*checked[^>]*value="b"/);
  expect(html).toContain('data-hint="Hint A"');
});
