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
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

export default function Achats() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [achats, setAchats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [validating, setValidating] = useState(new Set());
    const [deleting, setDeleting] = useState(new Set());
    const [clearingAll, setClearingAll] = useState(false);
    const [activeTab, setActiveTab] = useState('en_attente');
    const [isCompactView, setIsCompactView] = useState(false);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
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

    const formatDateShort = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const filteredAchats = achats.filter(achat => {
        // Filtre par statut
        const statusMatch = activeTab === 'en_attente'
            ? achat.status !== 'Validé'
            : achat.status === 'Validé';

        if (!statusMatch) return false;

        // Filtre par date
        if (startDate || endDate) {
            const achatDate = dayjs(achat.created_at);

            if (startDate && achatDate.isBefore(startDate, 'day')) {
                return false;
            }

            if (endDate && achatDate.isAfter(endDate, 'day')) {
                return false;
            }
        }

        return true;
    });

    const achatsEnAttente = achats.filter(achat => achat.status !== 'Validé').length;
    const achatsValides = achats.filter(achat => achat.status === 'Validé').length;

    const resetDateFilter = () => {
        setStartDate(null);
        setEndDate(null);
    };

    return (
        <div className="bg-gradient-to-r from-[#081c3c] to-[#000000] text-white min-h-screen">
            {/* NAVBAR */}
            <div className="sticky top-0 z-50 bg-gradient-to-r from-[#081c3c] to-[#000000] border-b border-white/10">
                <div className="container mx-auto px-4 sm:px-6 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 sm:gap-3" onClick={() => navigate("/")} style={{ cursor: 'pointer' }}>
                            <img src={logo} alt="Logo" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full" />
                            <h1 className="text-lg sm:text-2xl font-bold text-teal-400">Gesta Order</h1>
                        </div>

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

                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden bg-white/10 p-2 rounded-lg hover:bg-white/20 transition"
                        >
                            {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
                        </button>
                    </div>

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

            <div className="px-3 sm:px-5 py-4 sm:py-8">
                <div className="flex-col items-center mb-6 sm:mb-8">
                    <h2 className="text-xl lg:text-2xl font-bold text-teal-400 flex items-center gap-3 sm:gap-5 mb-4">
                        <ArrowBackIcon onClick={() => navigate("/")} className="cursor-pointer hover:text-teal-300 transition" />
                        <p>Mes Achats</p>
                    </h2>

                    {/* Actions buttons */}
                    <div className='flex flex-wrap gap-2 sm:gap-3 justify-end mb-4'>
                        <button
                            onClick={() => navigate("/add_achat")}
                            className="flex items-center gap-1 sm:gap-2 bg-teal-600 hover:bg-teal-700 px-3 sm:px-4 py-2 rounded-lg transition-colors duration-200 text-sm"
                            title="Ajouter un achat"
                        >
                            <AddIcon className="text-lg sm:text-xl" />
                            <span className="hidden sm:inline">Ajouter</span>
                        </button>
                        <button
                            onClick={fetchAchats}
                            className="flex items-center gap-1 sm:gap-2 bg-teal-600 hover:bg-teal-700 px-3 sm:px-4 py-2 rounded-lg transition-colors duration-200 text-sm"
                            title="Actualiser"
                        >
                            <RefreshIcon className="text-lg sm:text-xl" />
                            <span className="hidden sm:inline">Actualiser</span>
                        </button>
                        <button
                            onClick={() => setIsCompactView(!isCompactView)}
                            className="flex items-center gap-1 sm:gap-2 bg-purple-600 hover:bg-purple-700 px-3 sm:px-4 py-2 rounded-lg transition-colors duration-200 text-sm"
                            title={isCompactView ? "Vue détaillée" : "Vue compacte"}
                        >
                            {isCompactView ? <ViewModuleIcon className="text-lg sm:text-xl" /> : <ViewListIcon className="text-lg sm:text-xl" />}
                            <span className="hidden sm:inline">{isCompactView ? "Détaillé" : "Compact"}</span>
                        </button>
                        {filteredAchats.length > 0 && (
                            <button
                                onClick={clearAllAchats}
                                disabled={clearingAll}
                                className="flex items-center gap-1 sm:gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 px-3 sm:px-4 py-2 rounded-lg transition-colors duration-200 text-sm"
                                title={`Supprimer tous les achats ${activeTab === 'en_attente' ? 'en attente' : 'validés'}`}
                            >
                                {clearingAll ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                ) : (
                                    <>
                                        <ClearAllIcon className="text-lg sm:text-xl" />
                                        <span className="hidden sm:inline">Tout supprimer</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    {/* Date Filter */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 mb-4">
                        <h3 className="text-sm font-semibold text-teal-400 mb-3">Filtrer par date</h3>
                        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
                            <div className="flex flex-col sm:flex-row gap-3 w-full">
                                <div className="w-full sm:flex-1">
                                    <DatePicker
                                        label="Date début"
                                        value={startDate}
                                        onChange={(newValue) => setStartDate(newValue)}
                                        slotProps={{
                                            textField: {
                                                size: "small",
                                                fullWidth: true,
                                                sx: {
                                                    "& .MuiOutlinedInput-root": {
                                                        color: "white",
                                                        "& fieldset": { borderColor: "rgba(255,255,255,0.3)" },
                                                        "&:hover fieldset": { borderColor: "rgba(255,255,255,0.5)" },
                                                        "&.Mui-focused fieldset": { borderColor: "#14b8a6" },
                                                    },
                                                    "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.7)" },
                                                    "& .MuiInputLabel-root.Mui-focused": { color: "#14b8a6" },
                                                    "& .MuiSvgIcon-root": { color: "white" },
                                                },
                                            },
                                        }}
                                    />
                                </div>

                                <div className="w-full sm:flex-1">
                                    <DatePicker
                                        label="Date fin"
                                        value={endDate}
                                        onChange={(newValue) => setEndDate(newValue)}
                                        slotProps={{
                                            textField: {
                                                size: "small",
                                                fullWidth: true,
                                                sx: {
                                                    "& .MuiOutlinedInput-root": {
                                                        color: "white",
                                                        "& fieldset": { borderColor: "rgba(255,255,255,0.3)" },
                                                        "&:hover fieldset": { borderColor: "rgba(255,255,255,0.5)" },
                                                        "&.Mui-focused fieldset": { borderColor: "#14b8a6" },
                                                    },
                                                    "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.7)" },
                                                    "& .MuiInputLabel-root.Mui-focused": { color: "#14b8a6" },
                                                    "& .MuiSvgIcon-root": { color: "white" },
                                                },
                                            },
                                        }}
                                    />
                                </div>

                                {(startDate || endDate) && (
                                    <button
                                        onClick={resetDateFilter}
                                        className="w-full sm:w-auto bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors duration-200 text-sm"
                                    >
                                        Réinitialiser
                                    </button>
                                )}
                            </div>
                        </LocalizationProvider>

                    </div>
                </div>

                <div className="mb-6">
                    <div className="flex border-b border-white/20 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('en_attente')}
                            className={`px-4 sm:px-6 py-3 font-medium transition-colors duration-200 border-b-2 whitespace-nowrap text-sm sm:text-base ${activeTab === 'en_attente'
                                ? 'border-teal-500 text-teal-400 bg-white/10 rounded-tr-lg rounded-tl-lg'
                                : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            En Attente ({achatsEnAttente})
                        </button>
                        <button
                            onClick={() => setActiveTab('valides')}
                            className={`px-4 sm:px-6 py-3 font-medium transition-colors duration-200 border-b-2 whitespace-nowrap text-sm sm:text-base ${activeTab === 'valides'
                                ? 'border-teal-500 text-teal-400 bg-white/10 rounded-tr-lg rounded-tl-lg'
                                : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            Validés ({achatsValides})
                        </button>
                        
                    </div>
                    <p className='mt-2'>Montant total: <span className="font-bold text-teal-400">{filteredAchats.reduce((total, achat) => total + achat.total_price, 0)} DA</span></p>
                </div>

                {loading && (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
                        <span className="ml-3 text-sm sm:text-lg">Chargement...</span>
                    </div>
                )}

                {error && (
                    <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
                        <p className="text-red-300 text-sm sm:text-base">
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
                                <div className="text-4xl sm:text-6xl mb-4">📦</div>
                                <h3 className="text-lg sm:text-xl font-semibold mb-2">
                                    Aucun achat {activeTab === 'en_attente' ? 'en attente' : 'validé'} trouvé
                                </h3>
                                <p className="text-gray-400 text-sm sm:text-base">
                                    {activeTab === 'en_attente'
                                        ? 'Les achats en attente de validation apparaîtront ici.'
                                        : 'Les achats validés apparaîtront ici.'
                                    }
                                </p>
                                
                            </div>
                            
                        ) : isCompactView ? (
                            // VUE COMPACTE
                            <div className="space-y-2">
                                {[...filteredAchats]
                                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                                    .map((achat) => (
                                        <div
                                            key={achat.id}
                                            className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-white/20 hover:bg-white/15 transition-all duration-300 cursor-pointer"
                                            onClick={() => navigate(`/edit_achat/${achat.id}`)}
                                        >
                                            <div className="flex items-center justify-between gap-2 sm:gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-bold text-teal-400 text-sm sm:text-base">#{achat.id}</span>
                                                        <span className="text-xs text-gray-400">{formatDateShort(achat.created_at)}</span>
                                                    </div>
                                                    <p className="text-white text-xs sm:text-sm truncate">
                                                        {achat.supplier_name}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 sm:gap-3">
                                                    <div className="text-right">
                                                        <p className="font-bold text-teal-400 text-sm sm:text-lg whitespace-nowrap">
                                                            {achat.total_price} DA
                                                        </p>
                                                        <p className="text-xs text-gray-400">
                                                            {achat.items ? achat.items.length : 0} art.
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-row justify-end gap-1 sm:gap-3 mt-4">
                                                        {achat.status !== 'Validé' && (
                                                            <button
                                                                onClick={() => validateAchat(achat.id)}
                                                                disabled={validating.has(achat.id)}
                                                                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 p-2 rounded-lg transition-colors duration-200"
                                                            >
                                                                {validating.has(achat.id) ? (
                                                                    <>
                                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                                        <span>Validation...</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <DoneAllIcon className="text-base sm:text-lg" />

                                                                    </>
                                                                )}
                                                            </button>
                                                        )}

                                                        {achat.status !== 'Validé' && (
                                                            <button
                                                                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 p-2 rounded-lg transition-colors duration-200"
                                                                onClick={() => navigate(`/edit_achat/${achat.id}`)}
                                                            >
                                                                <EditIcon className="text-base sm:text-lg" />

                                                            </button>
                                                        )}

                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                deleteAchat(achat.id);
                                                            }}
                                                            disabled={deleting.has(achat.id)}
                                                            className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 p-2 rounded-lg transition-colors duration-200"
                                                        >
                                                            {deleting.has(achat.id) ? (
                                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                            ) : (
                                                                <DeleteIcon className="text-base sm:text-lg" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        ) : (
                            // VUE DÉTAILLÉE
                            <div className="grid gap-4 sm:gap-6">
                                {[...filteredAchats]
                                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                                    .map((achat) => (
                                        <div
                                            key={achat.id}
                                            className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20 hover:bg-white/15 transition-all duration-300"
                                        >
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4">
                                                <div className="flex-1">
                                                    <h3 className="font-extrabold text-teal-400 text-base sm:text-lg">
                                                        Achat #{achat.id}
                                                    </h3>
                                                    <p className="text-gray-300 mt-1 break-words text-sm sm:text-base">
                                                        Fournisseur: {achat.supplier_name.length > 15 ? `${achat.supplier_name.slice(0, 15)}...` : achat.supplier_name}
                                                    </p>
                                                    <div className='flex flex-col gap-1 mt-2 items-start'>
                                                        <p className="text-gray-400 text-xs sm:text-sm">
                                                            {formatDate(achat.created_at)}
                                                        </p>
                                                        <p className={
                                                            achat.status === 'Validé' ?
                                                                "bg-green-600 px-2 py-1 rounded-md text-center text-xs sm:text-sm" :
                                                                achat.status === 'En attente' ?
                                                                    "bg-yellow-600 px-2 py-1 rounded-md text-center text-xs sm:text-sm" :
                                                                    "bg-gray-600 px-2 py-1 rounded-md text-center text-xs sm:text-sm"
                                                        }>
                                                            Status: {achat.status}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right w-full sm:w-auto">
                                                    <p className="text-xl sm:text-2xl font-bold text-teal-400">
                                                        {achat.total_price} DA
                                                    </p>
                                                    <p className="text-xs sm:text-sm text-gray-400">
                                                        {achat.items ? achat.items.length : 0} article(s)
                                                    </p>
                                                </div>
                                            </div>

                                            {achat.items && achat.items.length > 0 && (
                                                <div className="mb-4 flex flex-row gap-0 justify-between">
                                                    <button
                                                        onClick={() => toggleArticles(achat.id)}
                                                        className="bg-teal-700 hover:bg-teal-600 px-3 sm:px-4 py-2 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 text-sm"
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
                                                        className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 px-3 sm:px-4 py-2 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 text-sm"
                                                    >
                                                        {deleting.has(achat.id) ? (
                                                            <>
                                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                                <span className="hidden sm:inline">Suppression...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <DeleteIcon className="w-4 h-4" />
                                                                <span className="hidden sm:inline">Supprimer</span>
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            )}

                                            {achat.items && achat.items.length > 0 && expandedAchats.has(achat.id) && (
                                                <div className="border-t border-white/20 pt-4 mb-4">
                                                    <h4 className="text-base sm:text-lg font-medium mb-3 text-gray-200">Articles:</h4>
                                                    <div className="space-y-2">
                                                        {achat.items.map((item, index) => (
                                                            <div
                                                                key={index}
                                                                className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-white/5 rounded-lg p-3 animate-fadeIn"
                                                            >
                                                                <div className="flex-1 w-full sm:w-auto">
                                                                    <p className="font-medium text-teal-400 text-sm sm:text-base">
                                                                        {item.product.reference}
                                                                    </p>
                                                                    <p className="font-medium text-white text-sm sm:text-base">
                                                                        {item.product.name}
                                                                    </p>
                                                                    <p className="text-xs sm:text-sm text-gray-400">
                                                                        Prix unitaire: {item.product.price} DA
                                                                    </p>
                                                                </div>
                                                                <div className="text-left sm:text-right w-full sm:w-auto">
                                                                    <p className="font-medium text-white text-sm sm:text-base">
                                                                        Quantité: {item.quantity}
                                                                    </p>
                                                                    <p className="text-xs sm:text-sm text-teal-400">
                                                                        Total: {item.total_price} DA
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex flex-row justify-end gap-2 sm:gap-3 mt-4">
                                                {achat.status !== 'Validé' && (
                                                    <button
                                                        onClick={() => validateAchat(achat.id)}
                                                        disabled={validating.has(achat.id)}
                                                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 text-sm"
                                                    >
                                                        {validating.has(achat.id) ? (
                                                            <>
                                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                                <span>Validation...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <DoneAllIcon className="w-4 h-4" />
                                                                <span>Valider</span>
                                                            </>
                                                        )}
                                                    </button>
                                                )}

                                                {achat.status !== 'Validé' && (
                                                    <button
                                                        className="w-full sm:w-auto bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 text-sm"
                                                        onClick={() => navigate(`/edit_achat/${achat.id}`)}
                                                    >
                                                        <EditIcon className="w-4 h-4" />
                                                        <span>Modifier</span>
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