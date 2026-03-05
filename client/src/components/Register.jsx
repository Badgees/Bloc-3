import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const Register = () => {
    const [name, setName] = useState('')
    const [prenom, setPrenom] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const navigate = useNavigate()
const base = import.meta.env.VITE_BASE_URL || '/'

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        try {
            const response = await fetch(base+'api/users/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    prenom,
                    email,
                    password
                }),
                credentials: 'include'
            })

            if (response.status === 200 ) {
                navigate('/login')
            } else {
                const data = await response.text()
                setError(data || 'Une erreur est survenue. Veuillez réessayer.')
            }
        } catch (err) {
            setError('Une erreur est survenue. Veuillez réessayer.')
        }
    }

    return (
        <div>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    name="name"
                    placeholder="Nom"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
                <input
                    type="text"
                    name="prenom"
                    placeholder="Prenom"
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    required
                />
                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    name="password"
                    placeholder="Mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit">S'inscrire</button>
            </form>
            {error && <p>{error}</p>}
            <p>Vous avez déjà un compte ? <a href={`${base}/login`}>Connectez-vous ici</a>.</p>
        </div>
    )
}

export default Register