import { useNavigate } from "react-router-dom";
import StoreIcon from '@mui/icons-material/Store';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import logo from "../assets/logo.png";   // chemin relatif
export default function Main() {
    const navigate = useNavigate();

    return (
        <div className="bg-gradient-to-r from-[#081c3c] to-[#000000] text-white bg-repeat h-screen">
            <div className="navbar">
                <div className="container mx-auto ">
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

            <div className="flex items-center justify-center h-4/5 w-full">
                <div className="flex flex-col  justify-center w-full h-full gap-5 text-2xl font-bold text-teal-500 px-6">
                    {/* Products card */}
                        <div
                            className="group relative overflow-hidden bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl border border-white/20 cursor-pointer "
                            onClick={() => navigate("/product")}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="relative p-6 text-center">
                                <div className="mb-4 transform group-hover:scale-110 transition-transform duration-300">
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl shadow-lg">
                                        <StoreIcon style={{ width: 32, height: 32, color: 'white' }} />
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-teal-300 transition-colors">
                                    Produits
                                </h3>
                                <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                                    Suivre votre inventaire
                                </p>
                                 <div className="mt-6 flex items-center justify-center text-blue-400 group-hover:text-blue-300 transition-colors">
                                    <span className="text-sm font-medium">Accéder →</span>
                                </div>
                            </div>
                        </div>

                     <div
                            className="group relative overflow-hidden bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl border border-white/20 cursor-pointer "
                            onClick={() => navigate("/commandes")}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="relative p-8 text-center">
                                <div className="mb-6 transform group-hover:scale-110 transition-transform duration-300">
                                     <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl shadow-lg">
                                        <ShoppingCartIcon style={{ width: 40, height: 40, color: 'white' }} />
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-teal-300 transition-colors">
                                    Commandes
                                </h3>
                                <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                                    Suivre et gérer toutes vos commandes des clients
                                </p>
                                <div className="mt-6 flex items-center justify-center text-blue-400 group-hover:text-blue-300 transition-colors">
                                    <span className="text-sm font-medium">Accéder →</span>
                                </div>
                            </div>
                        </div>
                    
                </div>
            </div>
        </div>
    );
}
