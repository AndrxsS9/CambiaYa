from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ExchangeProposalViewSet

router = DefaultRouter()
router.register(r"proposals", ExchangeProposalViewSet, basename="proposals")

urlpatterns = [
    path("", include(router.urls)),
]
