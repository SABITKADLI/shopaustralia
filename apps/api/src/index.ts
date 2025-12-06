import express from 'express';
import dotenv from 'dotenv';

// Load environment variables (module declared in src/global.d.ts to avoid
// requiring @types/dotenv during initial scaffolding).
dotenv.config();

const app = express();
app.use(express.json());

// Use a number for the port if available
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

// Use explicit any types for request/response to avoid implicit any until
// proper @types/* packages are installed.
app.get('/health', (_req: any, res: any) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API server listening on port ${PORT}`);
});
