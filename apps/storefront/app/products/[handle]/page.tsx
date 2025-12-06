type Props = {
  params: { handle: string };
};

export default function ProductPage({ params }: Props) {
  return (
    <main>
      <h1>Product: {params.handle}</h1>
      <p>Detailed comparison coming soon.</p>
    </main>
  );
}
