import { useState, useEffect } from 'react';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";   // chemin relatif
import axios from 'axios';

export default function Productold() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // Configuration de l'URL de base de votre API Django
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
 // Ajustez selon votre configuration

    // Fonction pour récupérer les commandes
    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/api/products/`);
            
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            setProducts(data);
            setError(null);
        } catch (err) {
            setError(err.message);
            console.error('Erreur lors du chargement des commandes:', err);
        } finally {
            setLoading(false);
        }
    };
   const refreshProducts = async () => {
    setLoading(true);
    

    try {
        const response = await axios.get(`${API_BASE_URL}/api/refresh_products/`);

        const data = response.data;
        console.log("Produits rafraîchis:", data);

    } catch (error) {
        console.error("Erreur lors du rafraîchissement des produits:", error);
    } finally {
        setLoading(false);
    }
};

    // Charger les commandes au montage du composant
    useEffect(() => {
        fetchProducts();
    }, []);

 

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
                                                src={logo}                /* variable importée */
                                                alt="Logo Gesta Order"
                                                className="h-10 w-10 mr-2 rounded-full"
                                            />
                                            <div></div>
                                        </div>
                </div>
            </div>

            {/* Contenu principal */}
            <div className="container mx-auto px-5 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold text-teal-400 flex items-center gap-5"><ArrowBackIcon onClick={() => navigate("/")} className="cursor-pointer hover:text-teal-300 transition"/><p>Mes Produits</p></h2>
                    <button 
                        onClick={refreshProducts}
                        className="bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded-lg transition-colors duration-200"
                    >
                        <RefreshIcon/>
                    </button>
                </div>

                {/* États de chargement et d'erreur */}
                {loading && (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
                        <span className="ml-3 text-lg">Chargement des produits...</span>
                    </div>
                )}

                {error && (
                    <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
                        <p className="text-red-300">
                            Erreur lors du chargement: {error}
                        </p>
                        <button 
                            onClick={fetchProducts}
                            className="mt-2 bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm transition-colors duration-200"
                        >
                            Réessayer
                        </button>
                    </div>
                )}

                {/* Liste des commandes */}
                {!loading && !error && (
                    <>
                        {products.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-6xl mb-4">📦</div>
                                <h3 className="text-xl font-semibold mb-2">Aucun produit trouvée</h3>
                                <p className="text-gray-400">Vos produits apparaîtront ici une fois créées.</p>
                            </div>
                        ) : (
                            <div className="grid gap-6">
                                {products.map((product) => (
                                    <div 
                                        key={product.id} 
                                        className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300"
                                    >
                                        {/* En-tête de la commande */}
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-xl font-bold text-teal-400">
                                                    Produit #{product.id} - {product.name}
                                                </h3>
                                               
                                                <p className="text-gray-300 mt-1">
                                                    prix: {product.price}
                                                </p>
                                                <p className="text-gray-400 text-sm">
                                                    stock: {product.stock}
                                                </p>
                                            </div>
                                           
                                        </div>

                                      
                                        {/* Actions */}
                                        <div className="flex justify-end mt-4 space-x-3">
                                            <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors duration-200">
                                                Voir détails
                                            </button>
                                            
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