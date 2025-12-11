from django.urls import path, include, re_path
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, OrderViewSet, refresh_products, ValiderCommandeView, index, AchatViewSet, ValiderAchatView, get_dashboard_stats, ProductZeroStockViewSet

router = DefaultRouter()
router.register(r'products', ProductViewSet)
router.register(r'orders', OrderViewSet)
router.register(r'achats', AchatViewSet)
router.register(r'products_zero', ProductZeroStockViewSet, basename='products_zero')
urlpatterns = [
    # APIs (patterns spécifiques en premier)
    path('api/', include(router.urls)),
    path('api/refresh_products/', refresh_products),
    path('api/valider_commande/<int:commande_id>/', ValiderCommandeView.as_view(), name='valider_commande'),
    path('api/valider_achat/<int:achat_id>/', ValiderAchatView.as_view(), name='valider_achat'),
    path('api/dashboard_stats/', get_dashboard_stats, name='dashboard_stats'),

    path('', index, name='index'),    # Frontend (pattern catch-all à la fin)
    re_path(r'^(?!api/).*$', index, name='react_catchall'),
]