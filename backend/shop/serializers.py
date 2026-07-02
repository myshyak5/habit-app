from rest_framework import serializers
from .models import Skin

class SkinSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skin
        fields = ('id', 'name', 'emoji', 'price')