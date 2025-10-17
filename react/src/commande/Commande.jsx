import { useState, useEffect } from 'react';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useNavigate } from "react-router-dom";
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import logo from "../assets/logo.png";
import DoneAllIcon from '@mui/icons-material/DoneAll';
import EditIcon from '@mui/icons-material/Edit';

export default function Commandes() {
    const [commandes, setCommandes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [validating, setValidating] = useState(new Set());
    const [deleting, setDeleting] = useState(new Set());
    const [clearingAll, setClearingAll] = useState(false);
    const [activeTab, setActiveTab] = useState('en_attente'); // 'en_attente' ou 'validees'
    const navigate = useNavigate();

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const [expandedCommandes, setExpandedCommandes] = useState(new Set());

    const toggleArticles = (commandeId) => {
        const newExpanded = new Set(expandedCommandes);
        if (newExpanded.has(commandeId)) {
            newExpanded.delete(commandeId);
        } else {
            newExpanded.add(commandeId);
        }
        setExpandedCommandes(newExpanded);
    };

    const fetchCommandes = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/api/orders/`);

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const data = await response.json();
            setCommandes(data);
            setError(null);
        } catch (err) {
            setError(err.message);
            console.error('Erreur lors du chargement des commandes:', err);
        } finally {
            setLoading(false);
        }
    };

    // Fonction pour valider une commande
    const validateCommande = async (commandeId) => {
        try {
            setValidating(prev => new Set(prev).add(commandeId));

            const response = await fetch(`${API_BASE_URL}/api/valider_commande/${commandeId}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            // Mettre à jour localement
            setCommandes(prev => prev.map(cmd =>
                cmd.id === commandeId ? { ...cmd, status: 'Validé' } : cmd
            ));

        } catch (err) {
            console.error('Erreur lors de la validation:', err);
            alert('Erreur lors de la validation de la commande');
        } finally {
            setValidating(prev => {
                const newSet = new Set(prev);
                newSet.delete(commandeId);
                return newSet;
            });
        }
    };

    // Fonction pour supprimer une commande
    const deleteCommande = async (commandeId) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette commande ?')) {
            return;
        }

        try {
            setDeleting(prev => new Set(prev).add(commandeId));

            const response = await fetch(`${API_BASE_URL}/api/orders/${commandeId}/`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            // Supprimer localement
            setCommandes(prev => prev.filter(cmd => cmd.id !== commandeId));

        } catch (err) {
            console.error('Erreur lors de la suppression:', err);
            alert('Erreur lors de la suppression de la commande');
        } finally {
            setDeleting(prev => {
                const newSet = new Set(prev);
                newSet.delete(commandeId);
                return newSet;
            });
        }
    };

    const clearAllCommandes = async () => {
        const currentCommandes = filteredCommandes;
        const tabName = activeTab === 'en_attente' ? 'en attente' : 'validées';

        if (!confirm(`Êtes-vous sûr de vouloir supprimer TOUTES les commandes ${tabName} ? Cette action est irréversible.`)) {
            return;
        }

        try {
            setClearingAll(true);

            // Supprimer les commandes de l'onglet actuel une par une (séquentiellement)
            for (const commande of currentCommandes) {
                await fetch(`${API_BASE_URL}/api/orders/${commande.id}/`, {
                    method: 'DELETE'
                });
            }

            // Mettre à jour la liste localement
            setCommandes(prev => prev.filter(cmd =>
                activeTab === 'en_attente' ? cmd.status === 'Validé' : cmd.status !== 'Validé'
            ));

        } catch (err) {
            console.error('Erreur lors de la suppression globale:', err);
            alert('Erreur lors de la suppression des commandes');
            fetchCommandes(); // Recharger en cas d'erreur
        } finally {
            setClearingAll(false);
        }
    };

    useEffect(() => {
        fetchCommandes();
    }, []);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Filtrer les commandes selon l'onglet actif
    const filteredCommandes = commandes.filter(commande => {
        if (activeTab === 'en_attente') {
            return commande.status !== 'Validé';
        } else {
            return commande.status === 'Validé';
        }
    });

    // Compter les commandes par catégorie
    const commandesEnAttente = commandes.filter(cmd => cmd.status !== 'Validé').length;
    const commandesValidees = commandes.filter(cmd => cmd.status === 'Validé').length;

    return (
        <div className="bg-gradient-to-r from-[#081c3c] to-[#000000] text-white min-h-screen"> 
            {/* Navbar */}
            <div className="navbar">
                <div className="container mx-auto">
                    <div className="flex  items-center p-5 gap-5">
                        <div className="logo flex items-center">
                            <h1 className="text-3xl font-bold text-teal-500">Gesta order</h1>
                        </div>
                        <img
                            src={logo}
                            alt="Logo Gesta Order"
                            className="h-10 w-10 mr-2 rounded-full"
                        />
                        <div></div>
                    </div>
                </div>
            </div>

            {/* Contenu principal */}
            <div className="px-5 py-8">
                <div className="flex-col items-center mb-8">
                    <h2 className="text-2xl font-bold text-teal-400 flex items-center gap-5 mb-4">
                        <ArrowBackIcon onClick={() => navigate("/")} className="cursor-pointer hover:text-teal-300 transition" />
                        <p>Mes Commandes</p>
                    </h2>
                    <div className='flex gap-3 justify-end'>
                        <button
                            onClick={() => navigate("/add_commande")}
                            className="flex bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded-lg transition-colors duration-200"
                            title="Ajouter une commande"
                        >
                            <AddIcon />
                        </button>
                        <button
                            onClick={fetchCommandes}
                            className="flex bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded-lg transition-colors duration-200"
                            title="Actualiser"
                        >
                            <RefreshIcon />
                        </button>
                        {filteredCommandes.length > 0 && (
                            <button
                                onClick={clearAllCommandes}
                                disabled={clearingAll}
                                className="flex bg-red-600 hover:bg-red-700 disabled:bg-red-400 px-4 py-2 rounded-lg transition-colors duration-200"
                                title={`Supprimer toutes les commandes ${activeTab === 'en_attente' ? 'en attente' : 'validées'}`}
                            >
                                {clearingAll ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                ) : (
                                    <ClearAllIcon />
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* Onglets */}
                <div className="mb-6">
                    <div className="flex border-b border-white/20">
                        <button
                            onClick={() => setActiveTab('en_attente')}
                            className={`px-6 py-3 font-medium transition-colors duration-200 border-b-2 ${activeTab === 'en_attente'
                                    ? 'border-teal-500 text-teal-400 bg-white/10 rounded-tr-lg rounded-tl-lg'
                                    : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            En Attente ({commandesEnAttente})
                        </button>
                        <button
                            onClick={() => setActiveTab('validees')}
                            className={`px-6 py-3 font-medium transition-colors duration-200 border-b-2 ${activeTab === 'validees'
                                    ? 'border-teal-500 text-teal-400 bg-white/10 rounded-tr-lg rounded-tl-lg'
                                    : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            Validées ({commandesValidees})
                        </button>
                    </div>
                </div>

                {/* États de chargement et d'erreur */}
                {loading && (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
                        <span className="ml-3 text-lg">Chargement des commandes...</span>
                    </div>
                )}

                {error && (
                    <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
                        <p className="text-red-300">
                            Erreur lors du chargement: {error}
                        </p>
                        <button
                            onClick={fetchCommandes}
                            className="mt-2 bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm transition-colors duration-200"
                        >
                            Réessayer
                        </button>
                    </div>
                )}

                {/* Liste des commandes */}
                {!loading && !error && (
                    <>
                        {filteredCommandes.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-6xl mb-4">📦</div>
                                <h3 className="text-xl font-semibold mb-2">
                                    Aucune commande {activeTab === 'en_attente' ? 'en attente' : 'validée'} trouvée
                                </h3>
                                <p className="text-gray-400">
                                    {activeTab === 'en_attente'
                                        ? 'Les commandes en attente de validation apparaîtront ici.'
                                        : 'Les commandes validées apparaîtront ici.'
                                    }
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-6">
                                {[...filteredCommandes]
                                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                                    .map((commande) => (
                                        <div
                                            key={commande.id}
                                            className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300"
                                        >
                                            {/* En-tête de la commande */}
                                            <div className="flex justify-between items-center mb-4">
                                                <div>
                                                    <h3 className="font-extrabold text-teal-400 ">
                                                        Commande #{commande.id}
                                                    </h3>
                                                    <p className="text-gray-300 mt-1 break-words">
                                                        Client: {commande.customer_name.length > 15 ? `${commande.customer_name.slice(0, 15)}...` : commande.customer_name}
                                                    </p>
                                                    <div className='flex flex-col gap-1 mt-2  items-start'>
                                                        <p className="text-gray-400 text-sm">
                                                            {formatDate(commande.created_at)}
                                                        </p>
                                                        <p className={
                                                            commande.status === 'Validé' ?
                                                                "bg-green-600 px-2 py-1 rounded-md text-center text-sm" :
                                                                commande.status === 'En attente' ?
                                                                    "bg-yellow-600 px-2 py-1 rounded-md text-center text-sm" :
                                                                    "bg-gray-600 px-2 py-1 rounded-md text-center text-sm"
                                                        }>
                                                            Status: {commande.status}
                                                        </p>
                                                    </div>

                                                </div>
                                                <div className="text-right">
                                                    <p className="text-2xl font-bold text-teal-400">
                                                        {commande.total_price} DA
                                                    </p>
                                                    <p className="text-sm text-gray-400">
                                                        {commande.items ? commande.items.length : 0} article(s)
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Bouton Voir articles */}
                                            {commande.items && commande.items.length > 0 && (
                                                <div className="mb-4 flex justify-between items-center">
                                                    <button
                                                        onClick={() => toggleArticles(commande.id)}
                                                        className="bg-teal-700 hover:bg-teal-600 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
                                                    >
                                                        {expandedCommandes.has(commande.id) ? (
                                                            <>
                                                                <span>Masquer articles</span>
                                                                <svg className="w-4 h-4 transform rotate-180" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                                </svg>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span>Voir articles ({commande.items.length})</span>
                                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                                </svg>
                                                            </>
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => deleteCommande(commande.id)}
                                                        disabled={deleting.has(commande.id)}
                                                        className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
                                                    >
                                                        {deleting.has(commande.id) ? (
                                                            <>
                                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                                <span>Suppression...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <DeleteIcon className="w-4 h-4" />
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            )}

                                            {/* Articles de la commande */}
                                            {commande.items && commande.items.length > 0 && expandedCommandes.has(commande.id) && (
                                                <div className="border-t border-white/20 pt-4 mb-4">
                                                    <h4 className="text-lg font-medium mb-3 text-gray-200">Articles:</h4>
                                                    <div className="space-y-2">
                                                        {commande.items.map((item, index) => (
                                                            <div
                                                                key={index}
                                                                className="flex justify-between items-center bg-white/5 rounded-lg p-3 animate-fadeIn"
                                                            >
                                                                <div className="flex-1">
                                                                    <p className="font-medium text-teal-400">
                                                                        {item.product.reference}
                                                                    </p>
                                                                    <p className="font-medium text-white">
                                                                        {item.product.name}
                                                                    </p>
                                                                    <p className="text-sm text-gray-400">
                                                                        Prix unitaire: {item.product.price_v} DA
                                                                    </p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="font-medium text-white">
                                                                        Quantité: {item.quantity}
                                                                    </p>
                                                                    <p className="text-sm text-teal-400">
                                                                        Total: {item.total_price} DA
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Actions */}
                                            <div className="flex justify-end mt-4 space-x-3">
                                                {commande.status !== 'Validé' && (
                                                    <button
                                                        onClick={() => validateCommande(commande.id)}
                                                        disabled={validating.has(commande.id)}
                                                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
                                                    >
                                                        {validating.has(commande.id) ? (
                                                            <>
                                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                                <span>Validation...</span>
                                                            </>
                                                        ) : (
                                                            <DoneAllIcon className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                )}

                                                {commande.status !== 'Validé' && (
                                                    <button
                                                        className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors duration-200 "
                                                        onClick={() => navigate(`/edit_commande/${commande.id}`)}
                                                    >
                                                        <EditIcon className="w-4 h-4" />
                                                    </button>
                                                )}

                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}