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

    return (
        <div className="container">
            <h2>Mes emprunts</h2>
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
                            <tr key={loan.id_emprunt}>
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
