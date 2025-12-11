import { useEffect, useState } from "react";
import DashboardLayout from "./Dashboard"; // Assurez-vous que le chemin est correct

export default function DashboardPage() {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const [stats, setStats] = useState({
        total_orders: 0,
        total_achats: 0,
        zero_stock_count: 0
    });

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/dashboard_stats/`)
            .then(res => res.json())
            .then(data => setStats(data))
            .catch(err => console.error("Erreur de chargement des stats:", err));
    }, [API_BASE_URL]);

    return (
        <DashboardLayout
            totalOrders={stats.total_orders}
            totalPurchases={stats.total_achats}
            zeroStockCount={stats.zero_stock_count}
        />
    );
}