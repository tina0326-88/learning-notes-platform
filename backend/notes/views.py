import os
import re

from django.db.models import Q
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

from .models import Note
from .serializers import NoteSerializer


# ── Summarization ─────────────────────────────────────────────────────────────

def _extract_summary(content: str, max_chars: int = 120) -> str:
    """Regex-based fallback: return the first sentence(s), capped at max_chars."""
    content = content.strip()
    sentences = re.split(r'(?<=[。！？.!?])\s*', content)
    sentences = [s.strip() for s in sentences if s.strip()]
    if not sentences:
        text = content[:max_chars]
        return text + '…' if len(content) > max_chars else text
    summary = sentences[0]
    if len(sentences) > 1 and len(summary) < 50:
        summary += sentences[1]
    if len(summary) > max_chars:
        summary = summary[:max_chars] + '…'
    return summary


def _ai_summarize(content: str) -> str | None:
    """Call Claude API to generate a concise summary. Returns None if unavailable."""
    api_key = os.environ.get('ANTHROPIC_API_KEY', '').strip()
    if not api_key:
        return None
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)
        message = client.messages.create(
            model='claude-haiku-4-5-20251001',
            max_tokens=150,
            messages=[
                {
                    'role': 'user',
                    'content': (
                        '請用一到兩句話（最多 80 字）摘要以下學習筆記，'
                        '保留最重要的知識點，不要加任何前言或說明：\n\n'
                        + content
                    ),
                }
            ],
        )
        return message.content[0].text.strip()
    except Exception:
        return None


# ── Pagination ────────────────────────────────────────────────────────────────

class NotePagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 200


# ── ViewSet ───────────────────────────────────────────────────────────────────

class NoteViewSet(viewsets.ModelViewSet):
    serializer_class = NoteSerializer
    pagination_class = NotePagination

    def get_queryset(self):
        qs = Note.objects.all()
        q = self.request.query_params.get('q', '').strip()
        tag = self.request.query_params.get('tag', '').strip()
        if q:
            qs = qs.filter(
                Q(title__icontains=q) | Q(content__icontains=q) | Q(tags__icontains=q)
            )
        if tag:
            qs = qs.filter(tags__icontains=tag)
        return qs

    @action(detail=True, methods=['post'])
    def summarize(self, request, pk=None):
        """POST /api/notes/{id}/summarize/ — AI summary with regex fallback."""
        note = self.get_object()
        if not note.content:
            return Response(
                {'detail': '筆記沒有內容可以摘要。'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        summary = _ai_summarize(note.content) or _extract_summary(note.content)
        ai_used = bool(os.environ.get('ANTHROPIC_API_KEY', '').strip())
        return Response({'id': note.id, 'summary': summary, 'ai_used': ai_used})
