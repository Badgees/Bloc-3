const express = require('express')
const router = express.Router()
const db = require('./../services/database')
const jwt = require('jsonwebtoken')

const jwtSecret = process.env.JWT_SECRET || ''

function authenticateToken(req, res, next) {
    const token = req.cookies.token
    if (!token) return res.sendStatus(401)
    jwt.verify(token, jwtSecret, (err, user) => {
        if (err) return res.sendStatus(403)
        req.user = user
        next()
    })
}

function isAdmin(req, res, next) {
    if (req.user.role !== 'admin') return res.status(403).send('Accès interdit')
    next()
}

router

.get('/', (_, res) => {
    const sql = 'SELECT * FROM livres'
    db.query(sql, (err, results) => {
        if (err) throw err
        res.json(results)
    })
})

.post('/', authenticateToken, isAdmin, (req, res) => {
    const { title, author, date_publication, isbn, description, status, cover } = req.body
    if (!title || !author || !date_publication || !isbn)
        return res.status(400).send('Champs obligatoires manquants')
    const sql = 'INSERT INTO livres (titre, auteur, date_publication, isbn, description, statut, photo_url) VALUES (?, ?, ?, ?, ?, ?, ?)'
    db.query(sql, [title, author, date_publication, isbn, description, status || 'disponible', cover], (err) => {
        if (err) return res.status(400).send("Erreur d'envoi")
        res.send('Livre ajouté')
    })
})

.get('/:id', (req, res) => {
    const sql = 'SELECT * FROM livres WHERE id = ?'
    db.query(sql, [req.params.id], (err, result) => {
        if (err) throw err
        res.json(result)
    })
})

.put('/:id', authenticateToken, isAdmin, (req, res) => {
    const { title, author, published_date, isbn, description, status, photo_url } = req.body
    if (!title || !author || !published_date || !isbn)
        return res.status(400).send('Champs obligatoires manquants')
    const sql = 'UPDATE livres SET titre = ?, auteur = ?, date_publication = ?, isbn = ?, description = ?, statut = ?, photo_url = ? WHERE id = ?'
    db.query(sql, [title, author, published_date, isbn, description, status, photo_url, req.params.id], (err) => {
        if (err) throw err
        res.send('Livre mis à jour')
    })
})

.delete('/:id', authenticateToken, isAdmin, (req, res) => {
    const sql = 'DELETE FROM livres WHERE id = ?'
    db.query(sql, [req.params.id], (err) => {
        if (err) throw err
        res.send('Livre supprimé')
    })
})

module.exports = router
