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

// GET /api/loans/me — logged-in user's loans
router.get('/me', authenticateToken, (req, res) => {
    const sql = `
        SELECT e.id_emprunt, e.date_emprunt, e.date_retour_prevue, e.date_retour_effective,
               l.id, l.titre, l.auteur, l.photo_url
        FROM emprunts e
        JOIN livres l ON e.id_livre = l.id
        WHERE e.id_utilisateur = ?
        ORDER BY e.date_emprunt DESC
    `
    db.query(sql, [req.user.id], (err, results) => {
        if (err) throw err
        res.json(results)
    })
})

// POST /api/loans — borrow a book
router.post('/', authenticateToken, (req, res) => {
    const { id_livre, date_retour_prevue } = req.body

    if (!id_livre || !Number.isInteger(Number(id_livre)) || Number(id_livre) <= 0)
        return res.status(400).send('id_livre invalide')

    const toDate = (d) => d.toISOString().split('T')[0]
    const todayStr = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD in local time
    const maxDate = new Date()
    maxDate.setDate(maxDate.getDate() + 30)
    const maxDateStr = toDate(maxDate)

    let dateRetourPrevueStr
    if (date_retour_prevue) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date_retour_prevue))
            return res.status(400).send('date_retour_prevue invalide')
        if (date_retour_prevue < todayStr)
            return res.status(400).send('La date de retour doit être dans le futur')
        if (date_retour_prevue > maxDateStr)
            return res.status(400).send('La date de retour ne peut pas dépasser 30 jours')
        dateRetourPrevueStr = date_retour_prevue
    } else {
        dateRetourPrevueStr = maxDateStr
    }

    db.query('SELECT statut FROM livres WHERE id = ?', [id_livre], (err, results) => {
        if (err) throw err
        if (results.length === 0) return res.status(404).send('Livre introuvable')
        if (results[0].statut !== 'disponible') return res.status(409).send('Livre déjà emprunté')

        const insertSql = `
            INSERT INTO emprunts (id_utilisateur, id_livre, date_emprunt, date_retour_prevue)
            VALUES (?, ?, ?, ?)
        `
        db.query(insertSql, [req.user.id, id_livre, todayStr, dateRetourPrevueStr], (err) => {
            if (err) throw err
            db.query("UPDATE livres SET statut = 'emprunté' WHERE id = ?", [id_livre], (err) => {
                if (err) throw err
                res.json({ message: 'Emprunt enregistré', date_retour_prevue: dateRetourPrevueStr })
            })
        })
    })
})

// PUT /api/loans/:id/return — return a book
router.put('/:id/return', authenticateToken, (req, res) => {
    const loanId = Number(req.params.id)
    if (!Number.isInteger(loanId) || loanId <= 0)
        return res.status(400).send('id_emprunt invalide')

    const sql = `
        SELECT e.id_livre, e.id_utilisateur
        FROM emprunts e
        WHERE e.id_emprunt = ? AND e.date_retour_effective IS NULL
    `
    db.query(sql, [loanId], (err, results) => {
        if (err) throw err
        if (results.length === 0) return res.status(404).send('Emprunt introuvable ou déjà retourné')
        if (results[0].id_utilisateur !== req.user.id) return res.sendStatus(403)

        const today = new Date().toISOString().split('T')[0]
        const idLivre = results[0].id_livre 

        db.query('UPDATE emprunts SET date_retour_effective = ? WHERE id_emprunt = ?', [today, loanId], (err) => {
            if (err) throw err
            db.query("UPDATE livres SET statut = 'disponible' WHERE id = ?", [idLivre], (err) => {
                if (err) throw err
                res.json({ message: 'Retour enregistré' })
            })
        })
    })
})

module.exports = router
