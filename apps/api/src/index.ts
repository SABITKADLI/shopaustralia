import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import healthRouter from './routes/health';
import comparisonRouter from './routes/comparison';
import webhooksRouter from './routes/webhooks';

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const HOST = '0.0.0.0';

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/health', healthRouter);
app.use('/comparison', comparisonRouter);
app.use('/webhooks', webhooksRouter);

app.listen(PORT, HOST, () => {
  console.log(`✅ API running on http://${HOST}:${PORT}`);
});
