from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import ExchangeProposalViewSet

router = DefaultRouter()
router.register(r'exchanges', ExchangeProposalViewSet, basename='exchange')

urlpatterns = [
    path('', include(router.urls)),
]
