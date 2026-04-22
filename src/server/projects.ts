import { Router } from 'express';
import { pool } from './db.js';
import { authenticateToken } from './auth.js';

export const projectsRouter = Router();

// Get all projects for a user
projectsRouter.get('/', authenticateToken, async (req: any, res) => {
  try {
    const [projects] = await pool.query('SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new project
projectsRouter.post('/', authenticateToken, async (req: any, res) => {
  const { name, duration, status } = req.body;
  
  if (!name || !duration || !status) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const [result]: any = await pool.query('INSERT INTO projects (user_id, name, duration, status) VALUES (?, ?, ?, ?)', [req.user.id, name, duration, status]);
    const [rows]: any = await pool.query('SELECT * FROM projects WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
