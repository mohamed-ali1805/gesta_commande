import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import StoreIcon from '@mui/icons-material/Store';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import TransferWithinAStationIcon from '@mui/icons-material/TransferWithinAStation';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import logo from "../assets/logo.png";
import HomeFilledIcon from '@mui/icons-material/HomeFilled';
import Navbar from "./Navbar";
export default function Dashboard({ totalOrders, totalPurchases, zeroStockCount }) {
    const navigate = useNavigate();
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const [searchTerm, setSearchTerm] = useState('');
    const [searchField, setSearchField] = useState('name');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // États pour la pagination
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [nextPage, setNextPage] = useState(null);
    const [previousPage, setPreviousPage] = useState(null);

    // Fonction pour charger les produits avec pagination
    const fetchZeroStockProducts = async (page = 1) => {
        try {
            setLoading(true);

            let url = `${API_BASE_URL}/api/products_zero/?page=${page}`;

            // Ajouter les paramètres de recherche
            if (searchTerm) {
                url += `&${searchField}=${encodeURIComponent(searchTerm)}`;
            }

            const response = await fetch(url);
            const data = await response.json();

            setProducts(data.results || []);
            setTotalCount(data.count || 0);
            setNextPage(data.next);
            setPreviousPage(data.previous);

            // Calculer le nombre total de pages
            const pageSize = 10; // Doit correspondre à page_size dans le backend
            setTotalPages(Math.ceil((data.count || 0) / pageSize));

        } catch (error) {
            console.error("Erreur lors du chargement des produits:", error);
        } finally {
            setLoading(false);
        }
    };

    // Charger les produits au montage et quand la recherche change
    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            setCurrentPage(1); // Réinitialiser à la page 1 lors d'une nouvelle recherche
            fetchZeroStockProducts(1);
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [searchTerm, searchField]);

    // Fonction pour changer de page
    const goToPage = (page) => {
        setCurrentPage(page);
        fetchZeroStockProducts(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Fonction pour surligner le texte recherché
    const highlightText = (text, search) => {
        if (!search.trim()) return text;

        const regex = new RegExp(`(${search})`, 'gi');
        const parts = text.split(regex);

        return parts.map((part, index) =>
            regex.test(part) ? (
                <span key={index} className="bg-yellow-400 text-black px-1 rounded">
                    {part}
                </span>
            ) : part
        );
    };

    return (
        <div className="bg-gradient-to-r from-[#081c3c] to-[#000000] text-white min-h-screen">

            {/* NAVBAR */}
            <Navbar />

            {/* CONTENU PRINCIPAL */}
            <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">

                {/* STATISTIQUES */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-10">

                    <div onClick={() => navigate("/commandes")} className="cursor-pointer">
                        <StatCard
                            title="Total Commandes"
                            value={totalOrders}
                            gradient="from-teal-400 to-teal-600"
                            fullWidth
                        />
                    </div>

                    <div onClick={() => navigate("/achats")} className="cursor-pointer">
                        <StatCard
                            title="Total Achats"
                            value={totalPurchases}
                            gradient="from-blue-400 to-blue-600"
                            fullWidth
                        />
                    </div>


                    <StatCard
                        title="Produits en rupture"
                        value={zeroStockCount}
                        gradient="from-red-400 to-red-600"
                        icon={<WarningAmberIcon style={{ fontSize: 35, color: "white" }} />}
                        fullWidth
                    />


                </div>

                {/* PRODUITS EN RUPTURE */}
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 sm:p-6">

                    {/* En-tête avec compteur */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                        <h2 className="text-lg sm:text-xl font-semibold text-red-400">
                            Produits en rupture de stock
                            <span className="block sm:inline sm:ml-2 text-sm mt-1 sm:mt-0">
                                ({totalCount} au total)
                            </span>
                        </h2>
                        {searchTerm && (
                            <span className="text-xs text-yellow-300 bg-yellow-900/30 px-3 py-1 rounded self-start sm:self-auto">
                                Recherche par {searchField === 'name' ? 'nom' : 'référence'}: "{searchTerm}"
                            </span>
                        )}
                    </div>

                    {/* BARRE DE RECHERCHE */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/20 mb-4 sm:mb-6">

                        {/* Boutons radio */}
                        <div className="mb-3 sm:mb-4">
                            <label className="text-sm font-medium text-gray-300 mb-2 block">
                                Rechercher par :
                            </label>
                            <div className="flex flex-wrap gap-4 sm:gap-6">
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        name="searchField"
                                        value="name"
                                        checked={searchField === 'name'}
                                        onChange={(e) => setSearchField(e.target.value)}
                                        className="mr-2 text-teal-500 focus:ring-teal-500"
                                    />
                                    <span className="text-white text-sm sm:text-base">Nom</span>
                                </label>
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        name="searchField"
                                        value="reference"
                                        checked={searchField === 'reference'}
                                        onChange={(e) => setSearchField(e.target.value)}
                                        className="mr-2 text-teal-500 focus:ring-teal-500"
                                    />
                                    <span className="text-white text-sm sm:text-base">Référence</span>
                                </label>
                            </div>
                        </div>

                        {/* Champ de recherche */}
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder={`Rechercher par ${searchField === 'name' ? 'nom' : 'référence'}...`}
                                    className="w-full px-3 sm:px-4 py-2 sm:py-3 pl-9 sm:pl-10 bg-white/20 border border-white/30 rounded-lg text-white text-sm sm:text-base placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                />
                                <div className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2">
                                    <SearchIcon style={{ fontSize: 20, color: '#9CA3AF' }} />
                                </div>
                            </div>
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="bg-gray-600 hover:bg-gray-700 p-2 sm:px-3 sm:py-3 rounded-lg transition-colors duration-200 flex-shrink-0"
                                    title="Effacer la recherche"
                                >
                                    <ClearIcon style={{ fontSize: 20 }} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* LISTE DES PRODUITS */}
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
                            <span className="ml-3 text-lg">Chargement...</span>
                        </div>
                    ) : totalCount === 0 && !searchTerm ? (
                        <div className="text-center py-8 sm:py-12">
                            <div className="text-5xl sm:text-6xl mb-4">✅</div>
                            <p className="text-gray-300 text-base sm:text-lg">Tous les produits sont en stock.</p>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-8 sm:py-12 px-4">
                            <div className="text-5xl sm:text-6xl mb-4">🔍</div>
                            <h4 className="text-lg sm:text-xl font-semibold mb-2 text-white">
                                Aucun produit trouvé
                            </h4>
                            <p className="text-gray-400 text-sm sm:text-base mb-4">
                                Aucun produit ne correspond à "{searchTerm}" dans le champ {searchField === 'name' ? 'nom' : 'référence'}
                            </p>
                            <button
                                onClick={() => setSearchTerm('')}
                                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors duration-200 text-sm sm:text-base"
                            >
                                Voir tous les produits en rupture
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="grid gap-3 sm:gap-4 mb-6">
                                {products.map((product) => (
                                    <div
                                        key={product.id}
                                        className="bg-white/10 p-3 sm:p-4 rounded-xl border border-white/20 hover:bg-white/20 transition"
                                    >
                                        <h3 className="text-base sm:text-lg font-bold mb-1 break-words">
                                            {searchField === 'name'
                                                ? highlightText(product.name, searchTerm)
                                                : product.name
                                            }
                                        </h3>
                                        <p className="text-gray-300 text-xs sm:text-sm mb-1 break-words">
                                            Référence : {searchField === 'reference'
                                                ? highlightText(product.reference, searchTerm)
                                                : product.reference
                                            }
                                        </p>
                                        <p className="text-red-400 text-xs sm:text-sm font-semibold">
                                            Stock : {product.stock}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* PAGINATION */}
                            {totalPages > 1 && (
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/20">

                                    {/* Info page */}
                                    <div className="text-sm text-gray-300">
                                        Page {currentPage} sur {totalPages}
                                    </div>

                                    {/* Boutons de pagination */}
                                    <div className="flex items-center gap-2">

                                        {/* Bouton Précédent */}
                                        <button
                                            onClick={() => goToPage(currentPage - 1)}
                                            disabled={!previousPage}
                                            className="flex items-center gap-1 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50 px-3 py-2 rounded-lg transition text-sm"
                                        >
                                            <ChevronLeftIcon style={{ fontSize: 20 }} />
                                            <span className="hidden sm:inline">Précédent</span>
                                        </button>

                                        {/* Numéros de page */}
                                        <div className="flex gap-1">
                                            {[...Array(totalPages)].map((_, index) => {
                                                const pageNum = index + 1;
                                                // Afficher seulement certaines pages pour ne pas surcharger
                                                if (
                                                    pageNum === 1 ||
                                                    pageNum === totalPages ||
                                                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                                ) {
                                                    return (
                                                        <button
                                                            key={pageNum}
                                                            onClick={() => goToPage(pageNum)}
                                                            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg transition text-sm ${currentPage === pageNum
                                                                ? 'bg-red-600 text-white font-bold'
                                                                : 'bg-white/10 hover:bg-white/20 text-gray-300'
                                                                }`}
                                                        >
                                                            {pageNum}
                                                        </button>
                                                    );
                                                } else if (
                                                    pageNum === currentPage - 2 ||
                                                    pageNum === currentPage + 2
                                                ) {
                                                    return <span key={pageNum} className="px-2 text-gray-500">...</span>;
                                                }
                                                return null;
                                            })}
                                        </div>

                                        {/* Bouton Suivant */}
                                        <button
                                            onClick={() => goToPage(currentPage + 1)}
                                            disabled={!nextPage}
                                            className="flex items-center gap-1 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50 px-3 py-2 rounded-lg transition text-sm"
                                        >
                                            <span className="hidden sm:inline">Suivant</span>
                                            <ChevronRightIcon style={{ fontSize: 20 }} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, gradient, icon, fullWidth }) {
    return (
        <div className={`bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 sm:p-6 flex items-center gap-3 sm:gap-4 hover:bg-white/20 transition ${fullWidth ? 'sm:col-span-2 lg:col-span-1' : ''}`}>
            <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br ${gradient} flex-shrink-0`}>
                {icon ? icon : <span className="text-2xl sm:text-3xl font-bold text-white">{value}</span>}
            </div>
            <div className="min-w-0">
                <p className="text-gray-300 text-xs sm:text-sm truncate">{title}</p>
                <p className="text-xl sm:text-2xl font-bold text-white">{value}</p>
            </div>
        </div>
    );
}