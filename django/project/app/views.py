from rest_framework import viewsets
from .models import Product, Order, OrderItem,Achat,AchatItem
from .serializers import ProductSerializer, OrderSerializer, OrderItemSerializer ,AchatSerializer,AchatItemSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view
import socket

from rest_framework import viewsets, filters
from .models import Product
from .serializers import ProductSerializer

from django.shortcuts import render
def index(request):
    return render(request, 'index.html')


from rest_framework import viewsets, filters

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    filter_backends = [filters.SearchFilter]  # Pas DjangoFilterBackend
    search_fields = ['reference', 'name']
    
    def get_queryset(self):
        queryset = Product.objects.all()
        name = self.request.query_params.get('name', None)
        reference = self.request.query_params.get('reference', None)

        if name:
            queryset = queryset.filter(name__icontains=name)
        if reference:
            queryset = queryset.filter(reference__icontains=reference)
            
        return queryset
    
class ProductZeroStockViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['reference', 'name']

    def get_queryset(self):
        queryset = Product.objects.filter(stock=0)

        # Recherche personnalisée
        name = self.request.query_params.get('name')
        reference = self.request.query_params.get('reference')

        if name:
            queryset = queryset.filter(name__icontains=name)

        if reference:
            queryset = queryset.filter(reference__icontains=reference)

        return queryset

@api_view(['GET'])
def get_dashboard_stats(request):
    total_orders = Order.objects.count()
    total_achats = Achat.objects.count()
    zero_stock_products = Product.objects.filter(stock=0)

    return Response({
        "total_orders": total_orders,
        "total_achats": total_achats,
        "zero_stock_count": zero_stock_products.count(),
        "zero_stock_products": [
            {
                "id": p.id,
                "name": p.name,
                "reference": p.reference,
                "stock": float(p.stock)
            }
            for p in zero_stock_products
        ]
    })

import configparser
import os
from pathlib import Path

# Charger config.ini
config = configparser.ConfigParser()
config_path = os.path.join(Path(__file__).resolve().parent, 'config.ini')
config.read(config_path)

import traceback
import os
from django.http import FileResponse
from .models import Product
from django.db import transaction

from decimal import Decimal
from django.db import transaction
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view
import socket

@api_view(['GET'])
def refresh_products(request):
    try:
        HOST = config.get('network', 'host')
        PORT = config.getint('network', 'port')

        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(2)
            s.connect((HOST, PORT))
            s.sendall(b'ARTICLEWEB\n')

            chunks = []
            while True:
                try:
                    data = s.recv(1024)
                    if not data:
                        break
                    chunks.append(data)
                except socket.timeout:
                    break

            response_str = b''.join(chunks).decode('utf-8', errors='replace')

        lines = response_str.strip().split('\r\n')
        products_data = []

        for line in lines:
            fields = line.strip('$').split('$')
            if len(fields) >= 5:
                code, description, qty, prix_achat, prix_vente = fields[:5]
                try:
                    # Convertir en Decimal et forcer à 0 si négatif
                    stock = Decimal(qty.strip() or '0')
                    if stock < 0:
                        stock = Decimal('0')

                    price = Decimal(prix_achat.strip() or '0')
                    price_v = Decimal(prix_vente.strip() or '0')

                    products_data.append(Product(
                        reference=code.strip(),
                        name=description.strip().replace('*', ''),
                        stock=stock,
                        price=price,
                        price_v=price_v
                    ))

                except Exception as parse_err:
                    print(f"Erreur parsing produit : {parse_err}")
                    continue

        with transaction.atomic():
            Product.objects.all().delete()  # 🔥 Suppression complète
            Product.objects.bulk_create(products_data)  # 💾 Insertion rapide en masse

        return Response({
            'message': 'Produits réinitialisés avec succès',
            'nombre_produits': len(products_data)
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from .models import Order, Product, OrderItem
from .serializers import OrderSerializer

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    pagination_class = None

    def destroy(self, request, *args, **kwargs):
        """
        Supprimer une commande et restaurer le stock des produits
        sauf si la commande a déjà été validée.
        """
        order = self.get_object()
        
        with transaction.atomic():
            if order.status != 'Validé':
                # Restaurer le stock uniquement si la commande n'est pas validée
                order_items = OrderItem.objects.filter(order=order)
                for item in order_items:
                    product = item.product
                    product.stock += item.quantity
                    product.save()
            
            # Supprimer la commande (les OrderItems seront supprimés en cascade)
            order.delete()
        
        return Response(status=status.HTTP_204_NO_CONTENT)

    def partial_update(self, request, *args, **kwargs):
        """
        Mise à jour partielle d'une commande (notamment pour le statut)
        """
        order = self.get_object()
        
        # Si on change le statut vers "Validé"
        if request.data.get('status') == 'Validé':
            order.status = 'Validé'
            order.save()
            
            serializer = self.get_serializer(order)
            return Response(serializer.data)
        
        # Pour les autres mises à jour, utiliser la méthode par défaut
        return super().partial_update(request, *args, **kwargs)

    

    @action(detail=True, methods=['post'])
    def validate_order(self, request, pk=None):
        """
        Valider une commande spécifique
        POST /orders/<id>/validate_order/
        """
        order = self.get_object()
        
        if order.status == 'Validé':
            return Response({
                "message": "Cette commande est déjà validée"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        order.status = 'Validé'
        order.save()
        
        serializer = self.get_serializer(order)
        return Response({
            "message": "Commande validée avec succès",
            "order": serializer.data
        }, status=status.HTTP_200_OK)

    from decimal import Decimal
    from django.db import transaction
    from rest_framework.decorators import action
    from rest_framework.response import Response
    from rest_framework import status

    @action(detail=True, methods=['post'])
    def add_product(self, request, pk=None):
        """
        Ajouter un produit à une commande ou mettre à jour sa quantité.
        POST /orders/<id>/add_product/
        body: { "product_id": 1, "quantity": 2.5 }
        """
        order = self.get_object()
        product_id = request.data.get("product_id")

        try:
            quantity = Decimal(str(request.data.get("quantity", "1")))
        except Exception:
            return Response({"error": "Quantité invalide"}, status=status.HTTP_400_BAD_REQUEST)

        # 🔒 Si quantité négative ou nulle → on la remet à 0
        if quantity <= 0:
            return Response({"error": "La quantité doit être positive"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({"error": "Produit introuvable"}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            existing_item = OrderItem.objects.filter(order=order, product=product).first()

            if existing_item:
                quantity_diff = quantity - existing_item.quantity

                # 🧮 Vérification du stock disponible
                if product.stock < quantity_diff:
                    return Response({
                        "error": f"Stock insuffisant. Stock disponible: {product.stock + existing_item.quantity}"
                    }, status=status.HTTP_400_BAD_REQUEST)

                product.stock -= quantity_diff
                if product.stock < 0:
                    product.stock = Decimal('0')
                product.save()

                existing_item.quantity = quantity
                existing_item.save()

                return Response({
                    "message": "Quantité du produit mise à jour dans la commande"
                }, status=status.HTTP_200_OK)

            else:
                if product.stock < quantity:
                    return Response({
                        "error": f"Stock insuffisant. Stock disponible: {product.stock}"
                    }, status=status.HTTP_400_BAD_REQUEST)

                product.stock -= quantity
                if product.stock < 0:
                    product.stock = Decimal('0')
                product.save()

                OrderItem.objects.create(order=order, product=product, quantity=quantity)

                return Response({
                    "message": "Produit ajouté à la commande"
                }, status=status.HTTP_201_CREATED)


    @action(detail=True, methods=['delete'])
    def remove_product(self, request, pk=None):
        """
        Supprimer un produit d'une commande.
        DELETE /orders/<id>/remove_product/
        body: { "product_id": 1 }
        """
        order = self.get_object()
        product_id = request.data.get("product_id")

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({"error": "Produit introuvable"}, status=status.HTTP_404_NOT_FOUND)

        try:
            order_item = OrderItem.objects.get(order=order, product=product)
        except OrderItem.DoesNotExist:
            return Response({"error": "Produit non trouvé dans cette commande"}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            product.stock += order_item.quantity
            product.save()
            order_item.delete()

        return Response({"message": "Produit supprimé de la commande"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['put'])
    def update_product_quantity(self, request, pk=None):
        """
        Mettre à jour la quantité d'un produit dans une commande.
        PUT /orders/<id>/update_product_quantity/
        body: { "product_id": 1, "quantity": 3 }
        """
        order = self.get_object()
        product_id = request.data.get("product_id")
        new_quantity = int(request.data.get("quantity", 1))

        if new_quantity <= 0:
            return Response({"error": "La quantité doit être positive"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({"error": "Produit introuvable"}, status=status.HTTP_404_NOT_FOUND)

        try:
            order_item = OrderItem.objects.get(order=order, product=product)
        except OrderItem.DoesNotExist:
            return Response({"error": "Produit non trouvé dans cette commande"}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            quantity_diff = new_quantity - order_item.quantity

            if quantity_diff > 0 and product.stock < quantity_diff:
                return Response({
                    "error": f"Stock insuffisant. Stock disponible: {product.stock + order_item.quantity}"
                }, status=status.HTTP_400_BAD_REQUEST)

            product.stock -= quantity_diff
            product.save()

            order_item.quantity = new_quantity
            order_item.save()

        return Response({"message": "Quantité mise à jour"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def clear_products(self, request, pk=None):
        """
        Vider tous les produits d'une commande et restaurer le stock.
        POST /orders/<id>/clear_products/
        """
        order = self.get_object()
        
        with transaction.atomic():
            order_items = OrderItem.objects.filter(order=order)
            
            for item in order_items:
                product = item.product
                product.stock += item.quantity
                product.save()
            
            order_items.delete()

        return Response({
            "message": "Tous les produits de la commande ont été supprimés et le stock restauré"
        }, status=status.HTTP_200_OK)
    

import os
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Order, OrderItem  # Assure-toi que les bons modèles sont importés

import os
import re
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Order, OrderItem


class ValiderCommandeView(APIView):
    def post(self, request, commande_id):
        commande = get_object_or_404(Order, id=commande_id)

        if commande.status == 'Validé':
            return Response({'detail': 'Déjà validée.'}, status=status.HTTP_400_BAD_REQUEST)

        commande.status = 'Validé'
        commande.save()

        # Créer le dossier s'il n'existe pas
        folder_path = r"C:\gesta-commandes-files"
        os.makedirs(folder_path, exist_ok=True)

        # Nettoyer le nom du client pour le nom de fichier
        safe_filename = re.sub(r'[\\/*?:"<>|]', "_", f"{commande.customer_name}-{commande.id}")
        file_path = os.path.join(folder_path, f"{safe_filename}.txt")

        try:
            with open(file_path, "w", encoding="utf-8") as file:
                # Écrire le nom de la commande/client
                file.write(f"{commande.customer_name}\n")

                # Écrire chaque produit de la commande
                order_items = OrderItem.objects.filter(order=commande)
                for item in order_items:
                    product = item.product
                    line = f"{product.reference}${product.name}${item.quantity}${product.price}${product.price_v}${item.total_price()}${commande.total_price}#\n"
                    file.write(line)

        except Exception as e:
            return Response({'detail': f"Erreur lors de la génération du fichier : {str(e)}"}, status=500)

        return Response({'detail': 'Commande validée avec succès.'}, status=status.HTTP_200_OK)


class AchatViewSet(viewsets.ModelViewSet):
    queryset = Achat.objects.all()
    serializer_class = AchatSerializer
    pagination_class = None

    def destroy(self, request, *args, **kwargs):
        """
        Supprimer un achat et diminuer le stock des produits
        sauf si l'achat a déjà été validé.
        """
        achat = self.get_object()
        
        with transaction.atomic():
            if achat.status != 'Validé':
                # Diminuer le stock uniquement si l'achat n'est pas validé
                achat_items = AchatItem.objects.filter(achat=achat)
                for item in achat_items:
                    product = item.product
                    product.stock -= item.quantity
                    if product.stock < 0:
                        product.stock = Decimal('0')
                    product.save()
            
            # Supprimer l'achat (les AchatItems seront supprimés en cascade)
            achat.delete()
        
        return Response(status=status.HTTP_204_NO_CONTENT)

    def partial_update(self, request, *args, **kwargs):
        """
        Mise à jour partielle d'un achat (notamment pour le statut)
        """
        achat = self.get_object()
        
        # Si on change le statut vers "Validé"
        if request.data.get('status') == 'Validé':
            achat.status = 'Validé'
            achat.save()
            
            serializer = self.get_serializer(achat)
            return Response(serializer.data)
        
        # Pour les autres mises à jour, utiliser la méthode par défaut
        return super().partial_update(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def validate_achat(self, request, pk=None):
        """
        Valider un achat spécifique
        POST /achats/<id>/validate_achat/
        """
        achat = self.get_object()
        
        if achat.status == 'Validé':
            return Response({
                "message": "Cet achat est déjà validé"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        achat.status = 'Validé'
        achat.save()
        
        serializer = self.get_serializer(achat)
        return Response({
            "message": "Achat validé avec succès",
            "achat": serializer.data
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def add_product(self, request, pk=None):
        """
        Ajouter un produit à un achat ou mettre à jour sa quantité.
        POST /achats/<id>/add_product/
        body: { "product_id": 1, "quantity": 2.5 }
        """
        achat = self.get_object()
        product_id = request.data.get("product_id")

        try:
            quantity = Decimal(str(request.data.get("quantity", "1")))
        except Exception:
            return Response({"error": "Quantité invalide"}, status=status.HTTP_400_BAD_REQUEST)

        if quantity <= 0:
            return Response({"error": "La quantité doit être positive"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({"error": "Produit introuvable"}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            existing_item = AchatItem.objects.filter(achat=achat, product=product).first()

            if existing_item:
                quantity_diff = quantity - existing_item.quantity

                # Augmenter le stock selon la différence
                product.stock += quantity_diff
                if product.stock < 0:
                    product.stock = Decimal('0')
                product.save()

                existing_item.quantity = quantity
                existing_item.save()

                return Response({
                    "message": "Quantité du produit mise à jour dans l'achat"
                }, status=status.HTTP_200_OK)

            else:
                # Augmenter le stock
                product.stock += quantity
                product.save()

                AchatItem.objects.create(achat=achat, product=product, quantity=quantity)

                return Response({
                    "message": "Produit ajouté à l'achat"
                }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'])
    def remove_product(self, request, pk=None):
        """
        Supprimer un produit d'un achat.
        DELETE /achats/<id>/remove_product/
        body: { "product_id": 1 }
        """
        achat = self.get_object()
        product_id = request.data.get("product_id")

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({"error": "Produit introuvable"}, status=status.HTTP_404_NOT_FOUND)

        try:
            achat_item = AchatItem.objects.get(achat=achat, product=product)
        except AchatItem.DoesNotExist:
            return Response({"error": "Produit non trouvé dans cet achat"}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            # Diminuer le stock
            product.stock -= achat_item.quantity
            if product.stock < 0:
                product.stock = Decimal('0')
            product.save()
            achat_item.delete()

        return Response({"message": "Produit supprimé de l'achat"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def clear_products(self, request, pk=None):
        """
        Vider tous les produits d'un achat et restaurer le stock.
        POST /achats/<id>/clear_products/
        """
        achat = self.get_object()
        
        with transaction.atomic():
            achat_items = AchatItem.objects.filter(achat=achat)
            
            for item in achat_items:
                product = item.product
                product.stock -= item.quantity
                if product.stock < 0:
                    product.stock = Decimal('0')
                product.save()
            
            achat_items.delete()

        return Response({
            "message": "Tous les produits de l'achat ont été supprimés et le stock restauré"
        }, status=status.HTTP_200_OK)


class ValiderAchatView(APIView):
    def post(self, request, achat_id):
        achat = get_object_or_404(Achat, id=achat_id)

        if achat.status == 'Validé':
            return Response({'detail': 'Déjà validé.'}, status=status.HTTP_400_BAD_REQUEST)

        achat.status = 'Validé'
        achat.save()

        # Créer le dossier s'il n'existe pas
        folder_path = r"C:\gesta-achats-files"
        os.makedirs(folder_path, exist_ok=True)

        # Nettoyer le nom du fournisseur pour le nom de fichier
        safe_filename = re.sub(r'[\\/*?:"<>|]', "_", achat.supplier_name)
        file_path = os.path.join(folder_path, f"{safe_filename}.txt")

        try:
            with open(file_path, "w", encoding="utf-8") as file:
                # Écrire le nom de l'achat/fournisseur
                file.write(f"{achat.supplier_name}-{achat.id}\n")

                # Écrire chaque produit de l'achat
                achat_items = AchatItem.objects.filter(achat=achat)
                for item in achat_items:
                    product = item.product
                    line = f"{product.reference}${product.name}${item.quantity}${product.price}${product.price_v}${item.total_price()}${achat.total_price}#\n"
                    file.write(line)

        except Exception as e:
            return Response({'detail': f"Erreur lors de la génération du fichier : {str(e)}"}, status=500)

        return Response({'detail': 'Achat validé avec succès.'}, status=status.HTTP_200_OK)

class RegenererFichierAchatView(APIView):
    def post(self, request, achat_id):
        achat = get_object_or_404(Achat, id=achat_id)

        if achat.status != 'Validé':
            return Response(
                {'detail': 'L\'achat doit être validé pour régénérer le fichier.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        folder_path = r"C:\gesta-achats-files"
        os.makedirs(folder_path, exist_ok=True)

        safe_filename = re.sub(r'[\\/*?:"<>|]', "_", f"{achat.supplier_name}-{achat.id}")
        file_path = os.path.join(folder_path, f"{safe_filename}.txt")

        try:
            # Supprimer l'ancien fichier s'il existe
            if os.path.exists(file_path):
                os.remove(file_path)

            # Recréer le fichier
            with open(file_path, "w", encoding="utf-8") as file:
                file.write(f"{achat.supplier_name}\n")

                achat_items = AchatItem.objects.filter(achat=achat)
                for item in achat_items:
                    product = item.product
                    line = f"{product.reference}${product.name}${item.quantity}${product.price}${product.price_v}${item.total_price()}${achat.total_price}#\n"
                    file.write(line)

        except Exception as e:
            return Response(
                {'detail': f"Erreur lors de la régénération du fichier : {str(e)}"},
                status=500
            )

        return Response({'detail': 'Fichier régénéré avec succès.'}, status=status.HTTP_200_OK)
    

class RegenererFichierCommandeView(APIView):
    def post(self, request, commande_id):
        commande = get_object_or_404(Order, id=commande_id)

        if commande.status != 'Validé':
            return Response(
                {'detail': 'La commande doit être validée pour régénérer le fichier.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        folder_path = r"C:\gesta-commandes-files"  # adapter selon ton dossier
        os.makedirs(folder_path, exist_ok=True)

        safe_filename = re.sub(r'[\\/*?:"<>|]', "_", f"{commande.customer_name}-{commande.id}")
        file_path = os.path.join(folder_path, f"{safe_filename}.txt")

        try:
            if os.path.exists(file_path):
                os.remove(file_path)

            with open(file_path, "w", encoding="utf-8") as file:
                file.write(f"{commande.customer_name}\n")

                commande_items = OrderItem.objects.filter(order=commande)
                for item in commande_items:
                    product = item.product
                    line = f"{product.reference}${product.name}${item.quantity}${product.price}${product.price_v}${item.total_price()}${commande.total_price}#\n"
                    file.write(line)

        except Exception as e:
            return Response(
                {'detail': f"Erreur lors de la régénération du fichier : {str(e)}"},
                status=500
            )

        return Response({'detail': 'Fichier régénéré avec succès.'}, status=status.HTTP_200_OK)