import React, { useState } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import Template from './components/Template.jsx'
import AddBook from './components/AddABook'
import BookDetails from './components/BookDetails'
import EditBook from './components/EditBook'
import BookList from './components/BookList.jsx'
import Register from './components/Register.jsx'
import Login from './components/Login.jsx'
import DashBoard from './components/DashBoard.jsx'
import MyLoans from './components/MyLoans.jsx'
import './style.css'
const base = import.meta.env.VITE_BASE_URL || '/'


function App() {
    const [userT, setUserT] = useState(null)
    return (
        <Router basename={base === "/" || "http://localhost:3000/" ? "/" :`/${base}`}>
            <Routes>
                <Route path="/" element={<Template userT={userT}><BookList /></Template>} />
                <Route path="/register" element={<Template userT={userT} page="Inscription"><Register /></Template>} />
                <Route path="/dashboard" element={<Template userT={userT} page="Tableau de bord"><DashBoard /></Template>} />
                <Route path="/login" element={<Template userT={userT} page="Connexion"><Login setUserT={setUserT}/></Template>} />
                <Route path="/books" element={<Template userT={userT}><BookList /></Template>} />
                <Route path="/add_book" element={<Template userT={userT} page="Ajout d'un livre"><AddBook /></Template>} />
                <Route path="/book/:bookId" element={<Template userT={userT} page="Détail du livre"><BookDetails /></Template>} />
                <Route path="/edit_book/:bookId" element={<Template userT={userT} page="Édition du livre"><EditBook /></Template>} />
                <Route path="/my-loans" element={<Template userT={userT} page="Mes emprunts"><MyLoans /></Template>} />
            </Routes>
        </Router>
    );
}

export default App