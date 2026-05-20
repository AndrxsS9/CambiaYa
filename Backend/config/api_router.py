from django.urls import path, include

urlpatterns = [
    path("auth/", include("apps.users.urls")),
    path("users/", include("apps.users.profile_urls")),
    path("products/", include("apps.products.urls")),
]
