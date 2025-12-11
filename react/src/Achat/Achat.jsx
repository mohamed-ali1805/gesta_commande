import { useState, useEffect } from 'react';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useNavigate } from "react-router-dom";
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import EditIcon from '@mui/icons-material/Edit';
import logo from "../assets/logo.png";
import StoreIcon from '@mui/icons-material/Store';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import TransferWithinAStationIcon from '@mui/icons-material/TransferWithinAStation';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
export default function Achats() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [achats, setAchats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [validating, setValidating] = useState(new Set());
    const [deleting, setDeleting] = useState(new Set());
    const [clearingAll, setClearingAll] = useState(false);
    const [activeTab, setActiveTab] = useState('en_attente');
    const navigate = useNavigate();

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const [expandedAchats, setExpandedAchats] = useState(new Set());

    const toggleArticles = (achatId) => {
        const newExpanded = new Set(expandedAchats);
        if (newExpanded.has(achatId)) {
            newExpanded.delete(achatId);
        } else {
            newExpanded.add(achatId);
        }
        setExpandedAchats(newExpanded);
    };

    const fetchAchats = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/api/achats/`);

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const data = await response.json();
            setAchats(data);
            setError(null);
        } catch (err) {
            setError(err.message);
            console.error('Erreur lors du chargement des achats:', err);
        } finally {
            setLoading(false);
        }
    };

    const validateAchat = async (achatId) => {
        try {
            setValidating(prev => new Set(prev).add(achatId));

            const response = await fetch(`${API_BASE_URL}/api/valider_achat/${achatId}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            setAchats(prev => prev.map(achat =>
                achat.id === achatId ? { ...achat, status: 'Validé' } : achat
            ));

        } catch (err) {
            console.error('Erreur lors de la validation:', err);
            alert('Erreur lors de la validation de l\'achat');
        } finally {
            setValidating(prev => {
                const newSet = new Set(prev);
                newSet.delete(achatId);
                return newSet;
            });
        }
    };

    const deleteAchat = async (achatId) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet achat ?')) {
            return;
        }

        try {
            setDeleting(prev => new Set(prev).add(achatId));

            const response = await fetch(`${API_BASE_URL}/api/achats/${achatId}/`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            setAchats(prev => prev.filter(achat => achat.id !== achatId));

        } catch (err) {
            console.error('Erreur lors de la suppression:', err);
            alert('Erreur lors de la suppression de l\'achat');
        } finally {
            setDeleting(prev => {
                const newSet = new Set(prev);
                newSet.delete(achatId);
                return newSet;
            });
        }
    };

    const clearAllAchats = async () => {
        const currentAchats = filteredAchats;
        const tabName = activeTab === 'en_attente' ? 'en attente' : 'validés';

        if (!confirm(`Êtes-vous sûr de vouloir supprimer TOUS les achats ${tabName} ? Cette action est irréversible.`)) {
            return;
        }

        try {
            setClearingAll(true);

            for (const achat of currentAchats) {
                await fetch(`${API_BASE_URL}/api/achats/${achat.id}/`, {
                    method: 'DELETE'
                });
            }

            setAchats(prev => prev.filter(achat =>
                activeTab === 'en_attente' ? achat.status === 'Validé' : achat.status !== 'Validé'
            ));

        } catch (err) {
            console.error('Erreur lors de la suppression globale:', err);
            alert('Erreur lors de la suppression des achats');
            fetchAchats();
        } finally {
            setClearingAll(false);
        }
    };

    useEffect(() => {
        fetchAchats();
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

    const filteredAchats = achats.filter(achat => {
        if (activeTab === 'en_attente') {
            return achat.status !== 'Validé';
        } else {
            return achat.status === 'Validé';
        }
    });

    const achatsEnAttente = achats.filter(achat => achat.status !== 'Validé').length;
    const achatsValides = achats.filter(achat => achat.status === 'Validé').length;

    return (
        <div className="bg-gradient-to-r from-[#081c3c] to-[#000000] text-white min-h-screen">
            {/* NAVBAR */}
            <div className="sticky top-0 z-50 bg-gradient-to-r from-[#081c3c] to-[#000000] border-b border-white/10">
                <div className="container mx-auto px-4 sm:px-6 py-4">
                    <div className="flex justify-between items-center">

                        {/* Logo et titre */}
                        <div className="flex items-center gap-2 sm:gap-3" onClick={() => navigate("/")} style={{ cursor: 'pointer' }}
>
                            <img src={logo} alt="Logo" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full" />
                            <h1 className="text-lg sm:text-2xl font-bold text-teal-400">Gesta Order</h1>
                        </div>

                        {/* Menu desktop */}
                        <div className="hidden md:flex gap-3 lg:gap-4">
                            <button
                                onClick={() => navigate("/product")}
                                className="flex items-center gap-2 bg-white/10 px-3 lg:px-4 py-2 rounded-xl hover:bg-white/20 transition border border-white/20 text-sm"
                            >
                                <StoreIcon style={{ fontSize: 20 }} />
                                <span className="hidden lg:inline">Produits</span>
                            </button>
                            <button
                                onClick={() => navigate("/commandes")}
                                className="flex items-center gap-2 bg-white/10 px-3 lg:px-4 py-2 rounded-xl hover:bg-white/20 transition border border-white/20 text-sm"
                            >
                                <ShoppingCartIcon style={{ fontSize: 20 }} />
                                <span className="hidden lg:inline">Commandes</span>
                            </button>
                            <button
                                onClick={() => navigate("/achats")}
                                className="flex items-center gap-2 bg-white/10 px-3 lg:px-4 py-2 rounded-xl hover:bg-white/20 transition border border-white/20 text-sm"
                            >
                                <TransferWithinAStationIcon style={{ fontSize: 20 }} />
                                <span className="hidden lg:inline">Achats</span>
                            </button>
                        </div>

                        {/* Bouton menu mobile */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden bg-white/10 p-2 rounded-lg hover:bg-white/20 transition"
                        >
                            {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
                        </button>
                    </div>

                    {/* Menu mobile déroulant */}
                    {mobileMenuOpen && (
                        <div className="md:hidden mt-4 space-y-2 pb-4">
                            <button
                                onClick={() => {
                                    navigate("/product");
                                    setMobileMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-3 bg-white/10 px-4 py-3 rounded-xl hover:bg-white/20 transition border border-white/20"
                            >
                                <StoreIcon style={{ fontSize: 20 }} /> Produits
                            </button>
                            <button
                                onClick={() => {
                                    navigate("/commandes");
                                    setMobileMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-3 bg-white/10 px-4 py-3 rounded-xl hover:bg-white/20 transition border border-white/20"
                            >
                                <ShoppingCartIcon style={{ fontSize: 20 }} /> Commandes
                            </button>
                            <button
                                onClick={() => {
                                    navigate("/achats");
                                    setMobileMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-3 bg-white/10 px-4 py-3 rounded-xl hover:bg-white/20 transition border border-white/20"
                            >
                                <TransferWithinAStationIcon style={{ fontSize: 20 }} /> Achats
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="px-5 py-8">
                <div className="flex-col items-center mb-8">
                    <h2 className="text-2xl font-bold text-teal-400 flex items-center gap-5 mb-4">
                        <ArrowBackIcon onClick={() => navigate("/")} className="cursor-pointer hover:text-teal-300 transition" />
                        <p>Mes Achats</p>
                    </h2>
                    <div className='flex gap-3 justify-end'>
                        <button
                            onClick={() => navigate("/add_achat")}
                            className="flex bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded-lg transition-colors duration-200"
                            title="Ajouter un achat"
                        >
                            <AddIcon />
                        </button>
                        <button
                            onClick={fetchAchats}
                            className="flex bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded-lg transition-colors duration-200"
                            title="Actualiser"
                        >
                            <RefreshIcon />
                        </button>
                        {filteredAchats.length > 0 && (
                            <button
                                onClick={clearAllAchats}
                                disabled={clearingAll}
                                className="flex bg-red-600 hover:bg-red-700 disabled:bg-red-400 px-4 py-2 rounded-lg transition-colors duration-200"
                                title={`Supprimer tous les achats ${activeTab === 'en_attente' ? 'en attente' : 'validés'}`}
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

                <div className="mb-6">
                    <div className="flex border-b border-white/20">
                        <button
                            onClick={() => setActiveTab('en_attente')}
                            className={`px-6 py-3 font-medium transition-colors duration-200 border-b-2 ${activeTab === 'en_attente'
                                ? 'border-teal-500 text-teal-400 bg-white/10 rounded-tr-lg rounded-tl-lg'
                                : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            En Attente ({achatsEnAttente})
                        </button>
                        <button
                            onClick={() => setActiveTab('valides')}
                            className={`px-6 py-3 font-medium transition-colors duration-200 border-b-2 ${activeTab === 'valides'
                                ? 'border-teal-500 text-teal-400 bg-white/10 rounded-tr-lg rounded-tl-lg'
                                : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            Validés ({achatsValides})
                        </button>
                    </div>
                </div>

                {loading && (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
                        <span className="ml-3 text-lg">Chargement des achats...</span>
                    </div>
                )}

                {error && (
                    <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
                        <p className="text-red-300">
                            Erreur lors du chargement: {error}
                        </p>
                        <button
                            onClick={fetchAchats}
                            className="mt-2 bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm transition-colors duration-200"
                        >
                            Réessayer
                        </button>
                    </div>
                )}

                {!loading && !error && (
                    <>
                        {filteredAchats.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-6xl mb-4">📦</div>
                                <h3 className="text-xl font-semibold mb-2">
                                    Aucun achat {activeTab === 'en_attente' ? 'en attente' : 'validé'} trouvé
                                </h3>
                                <p className="text-gray-400">
                                    {activeTab === 'en_attente'
                                        ? 'Les achats en attente de validation apparaîtront ici.'
                                        : 'Les achats validés apparaîtront ici.'
                                    }
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-6">
                                {[...filteredAchats]
                                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                                    .map((achat) => (
                                        <div
                                            key={achat.id}
                                            className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300"
                                        >
                                            <div className="flex justify-between items-center mb-4">
                                                <div>
                                                    <h3 className="font-extrabold text-teal-400">
                                                        Achat #{achat.id}
                                                    </h3>
                                                    <p className="text-gray-300 mt-1 break-words">
                                                        Fournisseur: {achat.supplier_name.length > 15 ? `${achat.supplier_name.slice(0, 15)}...` : achat.supplier_name}
                                                    </p>
                                                    <div className='flex flex-col gap-1 mt-2 items-start'>
                                                        <p className="text-gray-400 text-sm">
                                                            {formatDate(achat.created_at)}
                                                        </p>
                                                        <p className={
                                                            achat.status === 'Validé' ?
                                                                "bg-green-600 px-2 py-1 rounded-md text-center text-sm" :
                                                                achat.status === 'En attente' ?
                                                                    "bg-yellow-600 px-2 py-1 rounded-md text-center text-sm" :
                                                                    "bg-gray-600 px-2 py-1 rounded-md text-center text-sm"
                                                        }>
                                                            Status: {achat.status}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-2xl font-bold text-teal-400">
                                                        {achat.total_price} DA
                                                    </p>
                                                    <p className="text-sm text-gray-400">
                                                        {achat.items ? achat.items.length : 0} article(s)
                                                    </p>
                                                </div>
                                            </div>

                                            {achat.items && achat.items.length > 0 && (
                                                <div className="mb-4 flex justify-between items-center">
                                                    <button
                                                        onClick={() => toggleArticles(achat.id)}
                                                        className="bg-teal-700 hover:bg-teal-600 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
                                                    >
                                                        {expandedAchats.has(achat.id) ? (
                                                            <>
                                                                <span>Masquer articles</span>
                                                                <svg className="w-4 h-4 transform rotate-180" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                                </svg>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span>Voir articles ({achat.items.length})</span>
                                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                                </svg>
                                                            </>
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => deleteAchat(achat.id)}
                                                        disabled={deleting.has(achat.id)}
                                                        className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
                                                    >
                                                        {deleting.has(achat.id) ? (
                                                            <>
                                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                                <span>Suppression...</span>
                                                            </>
                                                        ) : (
                                                            <DeleteIcon className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                </div>
                                            )}

                                            {achat.items && achat.items.length > 0 && expandedAchats.has(achat.id) && (
                                                <div className="border-t border-white/20 pt-4 mb-4">
                                                    <h4 className="text-lg font-medium mb-3 text-gray-200">Articles:</h4>
                                                    <div className="space-y-2">
                                                        {achat.items.map((item, index) => (
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
                                                                        Prix unitaire: {item.product.price} DA
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

                                            <div className="flex justify-end mt-4 space-x-3">
                                                {achat.status !== 'Validé' && (
                                                    <button
                                                        onClick={() => validateAchat(achat.id)}
                                                        disabled={validating.has(achat.id)}
                                                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
                                                    >
                                                        {validating.has(achat.id) ? (
                                                            <>
                                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                                <span>Validation...</span>
                                                            </>
                                                        ) : (
                                                            <DoneAllIcon className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                )}

                                                {achat.status !== 'Validé' && (
                                                    <button
                                                        className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors duration-200"
                                                        onClick={() => navigate(`/edit_achat/${achat.id}`)}
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