import { Router } from 'express';

const router = Router();

router.post('/', (req, res) => {
  res.status(200).json({ message: 'webhook received placeholder' });
});

export default router;
