from rest_framework import viewsets
from .models import Product, Order, OrderItem
from .serializers import ProductSerializer, OrderSerializer, OrderItemSerializer
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
                    products_data.append(Product(
                        reference=code.strip(),
                        name=description.strip().replace('*', ''),
                        stock=int(qty.strip()),
                        price=float(prix_achat.strip()),
                        price_v=float(prix_vente.strip())
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

    @action(detail=True, methods=['post'])
    def add_product(self, request, pk=None):
        """
        Ajouter un produit à une commande ou mettre à jour sa quantité.
        POST /orders/<id>/add_product/
        body: { "product_id": 1, "quantity": 2 }
        """
        order = self.get_object()
        product_id = request.data.get("product_id")
        quantity = int(request.data.get("quantity", 1))

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
                
                if product.stock < quantity_diff:
                    return Response({
                        "error": f"Stock insuffisant. Stock disponible: {product.stock + existing_item.quantity}"
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                product.stock -= quantity_diff
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
        safe_filename = re.sub(r'[\\/*?:"<>|]', "_", commande.customer_name)
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
