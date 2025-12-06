import type { ButtonHTMLAttributes } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement>;

export function Button(props: Props) {
  return <button {...props} />;
}
