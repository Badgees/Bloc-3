import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
const base = import.meta.env.VITE_BASE_URL || '/'

const BookDetails = () => {
    const { bookId } = useParams()
    const navigate = useNavigate()
    const [book, setBook] = useState(null)
    const [userRole, setUserRole] = useState('')
    const [user, setUser] = useState(null)
    const [loanMessage, setLoanMessage] = useState('')

    useEffect(() => {
        fetch(`${base}api/books/${bookId}`, {
            credentials: 'include'
        })
            .then(response => response.json())
            .then(data => setBook(data[0]))
            .catch(error => console.error('Erreur:', error));

        fetch(base + 'api/session', {
            credentials: 'include'
        })
            .then(response => {
                if (response.status === 200) return response.json()
                throw new Error('Non authentifié')
            })
            .then(data => {
                setUser(data.user)
                setUserRole(data.user.role)
            })
            .catch(() => {
                setUser(null)
                setUserRole('')
            })
    }, [bookId]);

    const handleBack = () => {
        navigate('/books');
    };

    const handleEdit = () => {
        navigate(`/edit_book/${bookId}`);
    };

    const handleDelete = () => {
        console.log('Supprimer le livre:', bookId);
    };

    const handleBorrow = async () => {
        setLoanMessage('')
        try {
            const response = await fetch(base + 'api/loans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ id_livre: bookId })
            })
            const data = await response.json()
            if (response.ok) {
                setBook(prev => ({ ...prev, statut: 'emprunté' }))
                setLoanMessage(`Emprunt enregistré — retour prévu le ${new Date(data.date_retour_prevue).toLocaleDateString('fr-FR')}`)
            } else {
                setLoanMessage(data)
            }
        } catch {
            setLoanMessage('Erreur lors de l\'emprunt')
        }
    };

    if (!book) {
        return <p>Livre non trouvé</p>;
    }

    return (
        <div className="container">
            <div className="details">
                <h3>{book.titre}</h3>
                <img className="book-image" src={book.photo_url} alt={book.titre} />
                <p>Auteur : {book.auteur}</p>
                <p>Année de publication : {book.date_publication}</p>
                <p>ISBN : {book.isbn}</p>
                <p>Statut : <strong>{book.statut}</strong></p>
            </div>
            <div className="back-button">
                <button onClick={handleBack}>Retour à la liste des livres</button>
                {user && book.statut === 'disponible' && (
                    <button onClick={handleBorrow}>Emprunter</button>
                )}
                {loanMessage && <p>{loanMessage}</p>}
                {userRole === 'admin' && (
                    <>
                        <button onClick={handleEdit}>Modifier le livre</button>
                        <button onClick={handleDelete}>Supprimer le livre</button>
                    </>
                )}
            </div>
        </div>
    );
};

export default BookDetails