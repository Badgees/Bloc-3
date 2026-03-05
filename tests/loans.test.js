const request = require('supertest')
const express = require('express')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')

// Mock db and jwt BEFORE requiring the router
jest.mock('../services/database', () => ({ query: jest.fn() }))
jest.mock('jsonwebtoken')

const db = require('../services/database')
const jwt = require('jsonwebtoken')
const loansRouter = require('../router/loans')

const app = express()
app.use(bodyParser.json())
app.use(cookieParser())
app.use('/api/loans', loansRouter)

const MOCK_USER = { id: 1, email: 'test@test.com', role: 'utilisateur' }
const VALID_TOKEN = 'valid_token'

beforeEach(() => {
    jest.clearAllMocks()
    jwt.verify.mockImplementation((token, secret, callback) => {
        if (token === VALID_TOKEN) callback(null, MOCK_USER)
        else callback(new Error('invalid token'))
    })
})

// ─── GET /api/loans/me ────────────────────────────────────────────────────────

describe('GET /api/loans/me', () => {
    it('returns 401 if no token', async () => {
        const res = await request(app).get('/api/loans/me')
        expect(res.status).toBe(401)
    })

    it('returns 403 if token is invalid', async () => {
        const res = await request(app)
            .get('/api/loans/me')
            .set('Cookie', 'token=bad_token')
        expect(res.status).toBe(403)
    })

    it('returns 200 with the user loans', async () => {
        const mockLoans = [
            { id_emprunt: 1, titre: 'Test Book', auteur: 'Author', id: 1,
              date_emprunt: '2024-01-01', date_retour_prevue: '2024-01-31', date_retour_effective: null }
        ]
        db.query.mockImplementation((sql, params, callback) => callback(null, mockLoans))

        const res = await request(app)
            .get('/api/loans/me')
            .set('Cookie', `token=${VALID_TOKEN}`)

        expect(res.status).toBe(200)
        expect(res.body).toEqual(mockLoans)
        expect(db.query).toHaveBeenCalledWith(expect.stringContaining('WHERE e.id_utilisateur = ?'), [MOCK_USER.id], expect.any(Function))
    })
})

// ─── POST /api/loans ──────────────────────────────────────────────────────────

describe('POST /api/loans', () => {
    it('returns 401 if not authenticated', async () => {
        const res = await request(app).post('/api/loans').send({ id_livre: 1 })
        expect(res.status).toBe(401)
    })

    it('returns 400 if id_livre is missing', async () => {
        const res = await request(app)
            .post('/api/loans')
            .set('Cookie', `token=${VALID_TOKEN}`)
            .send({})
        expect(res.status).toBe(400)
    })

    it('returns 400 if id_livre is a string', async () => {
        const res = await request(app)
            .post('/api/loans')
            .set('Cookie', `token=${VALID_TOKEN}`)
            .send({ id_livre: 'abc' })
        expect(res.status).toBe(400)
    })

    it('returns 400 if id_livre is negative', async () => {
        const res = await request(app)
            .post('/api/loans')
            .set('Cookie', `token=${VALID_TOKEN}`)
            .send({ id_livre: -5 })
        expect(res.status).toBe(400)
    })

    it('returns 400 if id_livre is zero', async () => {
        const res = await request(app)
            .post('/api/loans')
            .set('Cookie', `token=${VALID_TOKEN}`)
            .send({ id_livre: 0 })
        expect(res.status).toBe(400)
    })

    it('returns 404 if book does not exist', async () => {
        db.query.mockImplementation((sql, params, callback) => callback(null, []))

        const res = await request(app)
            .post('/api/loans')
            .set('Cookie', `token=${VALID_TOKEN}`)
            .send({ id_livre: 999 })
        expect(res.status).toBe(404)
    })

    it('returns 409 if book is already borrowed', async () => {
        db.query.mockImplementation((sql, params, callback) =>
            callback(null, [{ statut: 'emprunté' }])
        )

        const res = await request(app)
            .post('/api/loans')
            .set('Cookie', `token=${VALID_TOKEN}`)
            .send({ id_livre: 1 })
        expect(res.status).toBe(409)
    })

    it('returns 200 with return date on success', async () => {
        db.query
            .mockImplementationOnce((sql, params, callback) => callback(null, [{ statut: 'disponible' }]))
            .mockImplementationOnce((sql, params, callback) => callback(null, { insertId: 1 }))
            .mockImplementationOnce((sql, params, callback) => callback(null, {}))

        const res = await request(app)
            .post('/api/loans')
            .set('Cookie', `token=${VALID_TOKEN}`)
            .send({ id_livre: 1 })

        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('date_retour_prevue')
        expect(res.body.message).toBe('Emprunt enregistré')
    })

    it('return date is today + 30 days', async () => {
        db.query
            .mockImplementationOnce((sql, params, callback) => callback(null, [{ statut: 'disponible' }]))
            .mockImplementationOnce((sql, params, callback) => callback(null, { insertId: 1 }))
            .mockImplementationOnce((sql, params, callback) => callback(null, {}))

        const res = await request(app)
            .post('/api/loans')
            .set('Cookie', `token=${VALID_TOKEN}`)
            .send({ id_livre: 1 })

        const expected = new Date()
        expected.setDate(expected.getDate() + 30)
        expect(res.body.date_retour_prevue).toBe(expected.toISOString().split('T')[0])
    })
})

// ─── PUT /api/loans/:id/return ────────────────────────────────────────────────

describe('PUT /api/loans/:id/return', () => {
    it('returns 401 if not authenticated', async () => {
        const res = await request(app).put('/api/loans/1/return')
        expect(res.status).toBe(401)
    })

    it('returns 400 if id is not a number', async () => {
        const res = await request(app)
            .put('/api/loans/abc/return')
            .set('Cookie', `token=${VALID_TOKEN}`)
        expect(res.status).toBe(400)
    })

    it('returns 400 if id is negative', async () => {
        const res = await request(app)
            .put('/api/loans/-1/return')
            .set('Cookie', `token=${VALID_TOKEN}`)
        expect(res.status).toBe(400)
    })

    it('returns 404 if loan not found or already returned', async () => {
        db.query.mockImplementation((sql, params, callback) => callback(null, []))

        const res = await request(app)
            .put('/api/loans/99/return')
            .set('Cookie', `token=${VALID_TOKEN}`)
        expect(res.status).toBe(404)
    })

    it('returns 403 if loan belongs to another user', async () => {
        db.query.mockImplementation((sql, params, callback) =>
            callback(null, [{ id_livre: 1, id_utilisateur: 99 }])
        )

        const res = await request(app)
            .put('/api/loans/1/return')
            .set('Cookie', `token=${VALID_TOKEN}`)
        expect(res.status).toBe(403)
    })

    it('returns 200 and sets return date on success', async () => {
        db.query
            .mockImplementationOnce((sql, params, callback) =>
                callback(null, [{ id_livre: 1, id_utilisateur: MOCK_USER.id }])
            )
            .mockImplementationOnce((sql, params, callback) => callback(null, {}))
            .mockImplementationOnce((sql, params, callback) => callback(null, {}))

        const res = await request(app)
            .put('/api/loans/1/return')
            .set('Cookie', `token=${VALID_TOKEN}`)

        expect(res.status).toBe(200)
        expect(res.body.message).toBe('Retour enregistré')
    })

    it('updates book status back to disponible on return', async () => {
        db.query
            .mockImplementationOnce((sql, params, callback) =>
                callback(null, [{ id_livre: 4, id_utilisateur: MOCK_USER.id }])
            )
            .mockImplementationOnce((sql, params, callback) => callback(null, {}))
            .mockImplementationOnce((sql, params, callback) => callback(null, {}))

        await request(app)
            .put('/api/loans/1/return')
            .set('Cookie', `token=${VALID_TOKEN}`)

        const lastCall = db.query.mock.calls[2]
        expect(lastCall[0]).toContain("statut = 'disponible'")
        expect(lastCall[1]).toContain(4)
    })
})
