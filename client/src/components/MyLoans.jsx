import React, { useState, useEffect } from 'react'
const base = import.meta.env.VITE_BASE_URL || '/'

const MyLoans = () => {
    const [loans, setLoans] = useState([])
    const [message, setMessage] = useState('')

    const fetchLoans = () => {
        fetch(base + 'api/loans/me', { credentials: 'include' })
            .then(response => {
                if (!response.ok) throw new Error()
                return response.json()
            })
            .then(data => setLoans(data))
            .catch(() => setLoans([]))
    }

    useEffect(() => {
        fetchLoans()
    }, [])

    const handleReturn = async (loanId) => {
        setMessage('')
        const response = await fetch(`${base}api/loans/${loanId}/return`, {
            method: 'PUT',
            credentials: 'include'
        })
        if (response.ok) {
            setMessage('Retour enregistré.')
            fetchLoans()
        } else {
            setMessage('Erreur lors du retour.')
        }
    }

    const isOverdue = (dateRetourPrevue, dateRetourEffective) => {
        if (dateRetourEffective) return false
        return new Date() > new Date(dateRetourPrevue)
    }

    const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('fr-FR')

    const daysOverdue = (dateRetourPrevue) => {
        const diff = new Date() - new Date(dateRetourPrevue)
        return Math.floor(diff / (1000 * 60 * 60 * 24))
    }

    const overdueLoans = loans.filter(loan => isOverdue(loan.date_retour_prevue, loan.date_retour_effective))

    return (
        <div className="container">
            <h2>Mes emprunts</h2>
            {overdueLoans.length > 0 && (
                <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '4px', padding: '12px 16px', marginBottom: '16px' }}>
                    ⚠ Attention : vous avez {overdueLoans.length} emprunt{overdueLoans.length > 1 ? 's' : ''} en retard :
                    <ul style={{ margin: '8px 0 0 0' }}>
                        {overdueLoans.map(loan => (
                            <li key={loan.id_emprunt}>
                                <strong>{loan.titre}</strong> — retour prévu le {formatDate(loan.date_retour_prevue)} ({daysOverdue(loan.date_retour_prevue)} jour{daysOverdue(loan.date_retour_prevue) > 1 ? 's' : ''} de retard)
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            {message && <p>{message}</p>}
            {loans.length === 0 ? (
                <p>Vous n'avez aucun emprunt.</p>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>Livre</th>
                            <th>Auteur</th>
                            <th>Emprunté le</th>
                            <th>Retour prévu</th>
                            <th>Retour effectif</th>
                            <th>Statut</th>
                            <th>Détails</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loans.map(loan => (
                            <tr key={loan.id_emprunt} style={isOverdue(loan.date_retour_prevue, loan.date_retour_effective) ? { background: '#fde8e8' } : {}}>
                                <td>{loan.titre}</td>
                                <td>{loan.auteur}</td>
                                <td>{formatDate(loan.date_emprunt)}</td>
                                <td>{formatDate(loan.date_retour_prevue)}</td>
                                <td>{loan.date_retour_effective ? formatDate(loan.date_retour_effective) : '—'}</td>
                                <td>
                                    {loan.date_retour_effective
                                        ? 'Retourné'
                                        : isOverdue(loan.date_retour_prevue)
                                            ? '⚠ En retard'
                                            : 'En cours'}
                                </td>
                                <td><a href={`${base}book/${loan.id}`}>Voir les détails</a></td>
                                <td>
                                    {!loan.date_retour_effective && (
                                        <button onClick={() => handleReturn(loan.id_emprunt)}>
                                            Retourner
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    )
}

export default MyLoans
