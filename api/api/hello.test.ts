import { describe, it, expect } from 'vitest'
import request from 'supertest'
import express from 'express'
import type { Request, Response } from 'express'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import handler from './hello'

const app = express()
app.get('/api/hello', (req: Request, res: Response) => {
  handler(req as VercelRequest, res as unknown as VercelResponse)
})

describe('GET /api/hello', () => {
  it('should return hello world message', async () => {
    const response = await request(app).get('/api/hello').expect('Content-Type', /json/).expect(200)

    expect(response.body).toEqual({
      message: 'Hello, Vercel!',
    })
  })
})
