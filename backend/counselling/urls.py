from django.urls import path
from .views import (
    ChatSessionCreateView,
    ChatSessionDetailView,
    ChatMessageCreateView,
    ChatMessageListView,
)
from .views import ChatAskView

urlpatterns = [
    path(
        "chat/sessions/",
        ChatSessionCreateView.as_view(),
        name="chat-session-create",
    ),
    path(
        "chat/sessions/<uuid:public_id>/",
        ChatSessionDetailView.as_view(),
        name="chat-session-detail",
    ),
    path(
        "chat/sessions/<uuid:public_id>/messages/",
        ChatMessageListView.as_view(),
        name="chat-message-list",
    ),
    path(
        "chat/sessions/<uuid:public_id>/messages/create/",
        ChatMessageCreateView.as_view(),
        name="chat-message-create",
    ),
    path("chat/ask/", ChatAskView.as_view(), name="chat-ask"),
]