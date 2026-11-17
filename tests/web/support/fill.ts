import { screen } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';

/** Tek ekran formunu doldurur: kimin için + ne oldu. */
export async function fillGenerator(
  user: UserEvent,
  values: { person?: string; text?: string } = {},
): Promise<void> {
  const person = values.person ?? 'Ayşe';
  const text = values.text ?? 'dün akşam iş çıktı, o yüzden gelemedim.';
  await user.type(await screen.findByLabelText(/kimin için/i), person);
  await user.type(screen.getByLabelText(/ne oldu/i), text);
}
