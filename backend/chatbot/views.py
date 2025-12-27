from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from api.models import ChatMessage
from api.serializers import ChatMessageSerializer
from .bot_logic import VehicleFinanceChatbot

chatbot = VehicleFinanceChatbot()


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def chat(request):
    """Handle chat messages"""
    message = request.data.get('message', '').strip()
    
    if not message:
        return Response({'error': 'Message is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Get bot response
    response = chatbot.get_response(message, request.user)
    intent = chatbot.get_intent(message)
    
    # Save chat history
    chat_message = ChatMessage.objects.create(
        user=request.user,
        message=message,
        response=response,
        intent=intent
    )
    
    return Response({
        'message': message,
        'response': response,
        'intent': intent,
        'timestamp': chat_message.created_at
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def chat_history(request):
    """Get chat history for user"""
    messages = ChatMessage.objects.filter(user=request.user).order_by('-created_at')[:50]
    serializer = ChatMessageSerializer(messages, many=True)
    return Response(serializer.data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def clear_history(request):
    """Clear chat history"""
    ChatMessage.objects.filter(user=request.user).delete()
    return Response({'message': 'Chat history cleared'})