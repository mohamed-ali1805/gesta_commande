

# Create your models here.
from django.db import models
from django.db.models import Sum, F, FloatField

class Product(models.Model):
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField(default=0)  # Quantité disponible
    price_v=models.DecimalField(max_digits=10, decimal_places=2)
    reference= models.CharField(max_length=50, null=True,blank=True)  # Référence unique
    def __str__(self):
        return f"{self.name} (Stock: {self.stock})"


class Order(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    customer_name = models.CharField(max_length=100)
    status = models.CharField(max_length=20, default='en attente')  # 'pending', 'completed', 'cancelled'
    def __str__(self):
        return f"Commande #{self.id} - {self.customer_name}"

    @property
    def total_price(self):
        # Calcule le total dynamiquement
        total = self.items.aggregate(
            total=Sum(F('quantity') * F('product__price_v'), output_field=FloatField())
        )['total']
        return round(total or 0, 2)


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.quantity} x {self.product.name}"

    def total_price(self):
        return round(self.quantity * self.product.price_v, 2)
