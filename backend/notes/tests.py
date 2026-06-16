from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Note


class NoteAPITestCase(APITestCase):
    def setUp(self):
        self.note1 = Note.objects.create(
            title='Python 基礎',
            content='變數、型別、迴圈、函式是 Python 的核心概念。',
            tags='python,程式設計',
        )
        self.note2 = Note.objects.create(
            title='React Hooks',
            content='useState 和 useEffect 是最常用的 React Hooks。',
            tags='react,frontend',
        )
        self.list_url = reverse('note-list')

    def detail_url(self, pk):
        return reverse('note-detail', args=[pk])

    def summarize_url(self, pk):
        return reverse('note-summarize', args=[pk])

    # ── List ──────────────────────────────────────────────────────────────────

    def test_list_notes_returns_200(self):
        res = self.client.get(self.list_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_list_notes_paginated(self):
        res = self.client.get(self.list_url)
        data = res.json()
        self.assertIn('results', data)
        self.assertIn('count', data)
        self.assertEqual(data['count'], 2)

    def test_list_notes_contains_created_notes(self):
        res = self.client.get(self.list_url)
        titles = [n['title'] for n in res.json()['results']]
        self.assertIn('Python 基礎', titles)
        self.assertIn('React Hooks', titles)

    # ── Search ────────────────────────────────────────────────────────────────

    def test_search_by_title(self):
        res = self.client.get(self.list_url, {'q': 'python'})
        results = res.json()['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['title'], 'Python 基礎')

    def test_search_by_content(self):
        res = self.client.get(self.list_url, {'q': 'useState'})
        results = res.json()['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['title'], 'React Hooks')

    def test_search_by_tag(self):
        res = self.client.get(self.list_url, {'q': 'frontend'})
        results = res.json()['results']
        self.assertEqual(len(results), 1)

    def test_search_no_match(self):
        res = self.client.get(self.list_url, {'q': 'kubernetes'})
        self.assertEqual(res.json()['count'], 0)

    # ── Tag filter ────────────────────────────────────────────────────────────

    def test_filter_by_tag(self):
        res = self.client.get(self.list_url, {'tag': 'python'})
        results = res.json()['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['title'], 'Python 基礎')

    # ── Create ────────────────────────────────────────────────────────────────

    def test_create_note(self):
        payload = {'title': '新筆記', 'content': '內容在此。', 'tags': 'test'}
        res = self.client.post(self.list_url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.json()['title'], '新筆記')
        self.assertEqual(Note.objects.count(), 3)

    def test_create_note_missing_title(self):
        res = self.client.post(self.list_url, {'content': '沒有標題'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_note_missing_content(self):
        res = self.client.post(self.list_url, {'title': '沒有內容'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    # ── Retrieve ──────────────────────────────────────────────────────────────

    def test_retrieve_note(self):
        res = self.client.get(self.detail_url(self.note1.pk))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.json()['title'], 'Python 基礎')

    def test_retrieve_nonexistent_note(self):
        res = self.client.get(self.detail_url(99999))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    # ── Update ────────────────────────────────────────────────────────────────

    def test_partial_update_note(self):
        res = self.client.patch(
            self.detail_url(self.note1.pk),
            {'title': '更新後的標題'},
            format='json',
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.json()['title'], '更新後的標題')
        self.note1.refresh_from_db()
        self.assertEqual(self.note1.title, '更新後的標題')

    # ── Delete ────────────────────────────────────────────────────────────────

    def test_delete_note(self):
        res = self.client.delete(self.detail_url(self.note1.pk))
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Note.objects.filter(pk=self.note1.pk).exists())

    # ── Summarize ─────────────────────────────────────────────────────────────

    def test_summarize_returns_summary(self):
        res = self.client.post(self.summarize_url(self.note1.pk), format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        self.assertIn('summary', data)
        self.assertIn('id', data)
        self.assertIn('ai_used', data)
        self.assertTrue(len(data['summary']) > 0)

    def test_summarize_empty_content(self):
        note = Note.objects.create(title='空白', content='')
        res = self.client.post(self.summarize_url(note.pk), format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
