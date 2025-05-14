import express, { Request, Response, Router } from 'express';
import path from 'path';

const router: Router = express.Router();

// GET / - Serves the main HTML page (already handled by SPA fallback in index.ts, but good to have if direct access is needed)
// Note: The SPA fallback in index.ts will likely catch this first for client-side routing.
// This route is more for explicitly stating the root or if you had server-side rendering for the root.
router.get('/', (req: Request, res: Response) => {
  const frontendDistPath = path.resolve(__dirname, '../../../frontend/dist'); // Path to your frontend build
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

export default router;