from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ChallengeViewSet, ChallengeParticipationViewSet,
    BadgeViewSet, RewardViewSet, DepartmentScoreViewSet,
    leaderboard,
)

router = DefaultRouter()
router.register(r'challenges', ChallengeViewSet)
router.register(r'challenge-participations', ChallengeParticipationViewSet)
router.register(r'badges', BadgeViewSet)
router.register(r'rewards', RewardViewSet)
router.register(r'department-scores', DepartmentScoreViewSet)

urlpatterns = [
    path('leaderboard/', leaderboard, name='leaderboard'),
    path('', include(router.urls)),
]
