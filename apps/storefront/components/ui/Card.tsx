import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

export function Card({ children }: Props) {
  return <div>{children}</div>;
}
