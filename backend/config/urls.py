from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include('profiles.urls')),
    path('api/v1/', include('goals.urls')),
    path('api/v1/', include('exercises.urls')),
    path('api/v1/', include('workouts.urls')),
    path('api/v1/', include('coach.urls')),
    path('api/v1/', include('activities.urls')),
    path('api/v1/', include('progress.urls')),
]