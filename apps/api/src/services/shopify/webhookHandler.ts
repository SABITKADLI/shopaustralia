export async function handleShopifyWebhook(payload: any) {
  // placeholder handling
  console.log('handleShopifyWebhook', payload && payload.type);
  return { ok: true };
}
