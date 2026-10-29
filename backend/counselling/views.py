from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.permissions import AllowAny

from .models import ChatSession, ChatMessage
from .serializers import ChatSessionSerializer, ChatMessageSerializer

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

from .models import ChatSession, ChatMessage
from .ai_service import generate_ai_response

class ChatSessionCreateView(generics.CreateAPIView):
    queryset = ChatSession.objects.all()
    serializer_class = ChatSessionSerializer
    permission_classes = [AllowAny]


class ChatSessionDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, public_id):
        session = get_object_or_404(
            ChatSession,
            public_id=public_id,
        )
        serializer = ChatSessionSerializer(session)
        return Response(serializer.data)


class ChatMessageCreateView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, public_id):
        session = get_object_or_404(
            ChatSession,
            public_id=public_id,
        )

        serializer = ChatMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        message = serializer.save(
            session=session,
            role="user",
        )

        return Response(
            ChatMessageSerializer(message).data,
            status=status.HTTP_201_CREATED,
        )


class ChatMessageListView(generics.ListAPIView):
    serializer_class = ChatMessageSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return ChatMessage.objects.filter(
            session__public_id=self.kwargs["public_id"]
        )
class ChatAskView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        public_id = request.data.get("session_id")
        question = request.data.get("question", "").strip()

        if not public_id:
            return Response(
                {"error": "session_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not question:
            return Response(
                {"error": "question is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            session = ChatSession.objects.get(
                public_id=public_id
            )
        except ChatSession.DoesNotExist:
            return Response(
                {"error": "Chat session not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            answer = generate_ai_response(question)
        except (RuntimeError, ValueError) as exc:
            return Response(
                {"error": str(exc)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        user_message = ChatMessage.objects.create(
            session=session,
            role="user",
            content=question,
        )

        assistant_message = ChatMessage.objects.create(
            session=session,
            role="assistant",
            content=answer,
        )

        return Response(
            {
                "session_id": str(session.public_id),
                "question": user_message.content,
                "answer": assistant_message.content,
                "user_message_id": user_message.id,
                "assistant_message_id": assistant_message.id,
            },
            status=status.HTTP_200_OK,
        )