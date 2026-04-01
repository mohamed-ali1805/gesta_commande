import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import StoreIcon from '@mui/icons-material/Store';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import TransferWithinAStationIcon from '@mui/icons-material/TransferWithinAStation';


import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import logo from "../assets/logo.png";
import HomeFilledIcon from '@mui/icons-material/HomeFilled';
export default function Navbar() {
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        
            <div className="sticky top-0 z-50 bg-gradient-to-r from-[#081c3c] to-[#000000] border-b border-white/10">
                <div className="container mx-auto px-4 sm:px-6 py-4">
                    <div className="flex justify-between items-center">

                        {/* Logo et titre */}
                        <div className="flex items-center gap-2 sm:gap-3">
                            <img src={logo} alt="Logo" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full" />
                            <h1 className="text-lg sm:text-2xl font-bold text-teal-400">Gesta Order</h1>
                        </div>

                        {/* Menu desktop */}
                        <div className="hidden md:flex gap-3 lg:gap-4">
                            <button
                                onClick={() => navigate("/")}
                                className="flex items-center gap-2 bg-white/10 px-3 lg:px-4 py-2 rounded-xl hover:bg-white/20 transition border border-white/20 text-sm"
                            >
                                <HomeFilledIcon style={{ fontSize: 20 }} />
                                <span className="hidden lg:inline">Dashboard</span>
                            </button>
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
                                    navigate("/");
                                    setMobileMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-3 bg-white/10 px-4 py-3 rounded-xl hover:bg-white/20 transition border border-white/20"
                            >
                                <HomeFilledIcon style={{ fontSize: 20 }} /> Dashboard
                            </button>
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
    );
}
