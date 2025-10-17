from django.urls import path, include, re_path
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, OrderViewSet, refresh_products, ValiderCommandeView, index

router = DefaultRouter()
router.register(r'products', ProductViewSet)
router.register(r'orders', OrderViewSet)

urlpatterns = [
    # APIs (patterns spécifiques en premier)
    path('api/', include(router.urls)),
    path('api/refresh_products/', refresh_products),
    path('api/valider_commande/<int:commande_id>/', ValiderCommandeView.as_view(), name='valider_commande'),
    path('', index, name='index'),    # Frontend (pattern catch-all à la fin)
    
]