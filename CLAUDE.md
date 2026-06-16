# CLAUDE.md

此檔案提供 Claude Code（claude.ai/code）在此專案中的工作指引。

## 專案概述

學習筆記平台 — 一個以 Django REST API 為後端、React + TypeScript 為前端的學習筆記應用程式。使用者可以建立、搜尋、標記和摘要學習筆記。

> **注意：** 本專案目前**無 AI 功能**（未設定 `ANTHROPIC_API_KEY`）。摘要功能僅使用正規表達式（regex）萃取，不呼叫任何 AI 模型。

## 開發指令

所有指令皆在**專案根目錄**（`ai-learning-platform/`）執行。Python 虛擬環境位於 `venv/`。

### 首次設定
```bash
make install           # 安裝 Python 套件至 venv/
make install-frontend  # 在 frontend/ 執行 npm install
make setup             # makemigrations + migrate
make createsuperuser   # 建立 Django Admin 帳號
```

### 啟動應用程式
```bash
make backend    # Django 開發伺服器 → http://127.0.0.1:8000
make frontend   # Vite 開發伺服器   → http://localhost:5173
```

### 測試與 Lint
```bash
make test                                          # 執行所有 17 個後端測試
venv/bin/python backend/manage.py test notes.tests.NoteAPITestCase.test_create_note  # 單一測試
cd frontend && npm run lint                        # ESLint（TypeScript）
cd frontend && npm run build                       # tsc 型別檢查 + Vite 建置
```

### 資料庫
```bash
make makemigrations   # 修改 models.py 後產生 migration 檔案
make migrate          # 套用 migration
```

## 架構

### 後端（`backend/`）

Django 6 + Django REST Framework，單一 app（`notes`）處理所有邏輯。

```
backend/
├── backend/settings.py   # 所有設定；透過 python-dotenv 讀取 .env
├── notes/
│   ├── models.py         # Note 模型（title、content、tags、timestamps）
│   ├── serializers.py    # NoteSerializer（ModelSerializer）
│   ├── views.py          # NoteViewSet + 摘要邏輯（regex 萃取）
│   ├── urls.py           # DefaultRouter → /api/notes/
│   └── tests.py          # APITestCase（17 個測試）
└── .env                  # 本地機密 — 不可 commit
```

**API 端點**（皆在 `/api/notes/` 下）：
- `GET /api/notes/` — 分頁列表；支援 `?q=`（全文搜尋 title/content/tags）與 `?tag=`（標籤篩選）
- `POST /api/notes/` — 建立筆記
- `GET/PATCH/DELETE /api/notes/{id}/` — 取得 / 部分更新 / 刪除
- `POST /api/notes/{id}/summarize/` — 回傳 `{id, summary, ai_used}`；目前僅使用 regex 萃取（`ai_used` 為 `false`）

**分頁**：`NotePagination`（預設 `page_size=50`，最大 200，查詢參數 `page_size`）。

**摘要**（`views.py`）：`_extract_summary()` 使用 regex 萃取內容前幾句作為摘要。若未設定 `ANTHROPIC_API_KEY`，`_ai_summarize()` 不會被呼叫。

### 前端（`frontend/src/`）

單一檔案 React 應用程式（`App.tsx`，約 350 行）。無路由套件，僅一頁。

**重要模式：**
- 搜尋使用 `useDebounce(400ms)` 後向後端發送 `?q=` 請求（搭配 `AbortController` 取消進行中的請求）。標籤篩選發送 `?tag=` 請求。兩者皆由單一 `fetchNotes(q, tag)` 回呼處理，透過 `useEffect` 觸發。
- API 回應為 `PaginatedResponse | Note[]` — fetch 處理器在有分頁封包時解包 `results`。
- 摘要儲存於本地狀態 `Record<number, SummaryResult>`，以 note id 為鍵。`SummaryResult = { text, aiUsed }` — `aiUsed` 控制卡片顯示「🤖 AI 摘要」或「📋 快速摘要」（目前一律顯示「📋 快速摘要」）。
- 標籤顏色依標籤字串決定性衍生（雜湊 → `TAG_PALETTE` 索引），相同標籤永遠取得相同顏色。

### 環境變數

| 變數 | 位置 | 用途 |
|---|---|---|
| `VITE_API_BASE` | `frontend/.env` | Vite 的後端 URL（預設 `http://127.0.0.1:8000`）|
| `SECRET_KEY` | `backend/.env` | Django 金鑰 |
| `DEBUG` | `backend/.env` | `True` / `False` |
| `ALLOWED_HOSTS` | `backend/.env` | 生產環境允許的主機名稱（逗號分隔）|
| `ANTHROPIC_API_KEY` | `backend/.env` | 啟用 AI 摘要功能（目前未設定，不使用）|

複製 `backend/.env.example` → `backend/.env` 以開始使用。

## 資料模型

`Note`（SQLite，資料表 `notes_note`）：
- `title` CharField(200) — 必填
- `content` TextField — 必填
- `tags` CharField(500) — 逗號分隔字串，例如 `"python,react"`；可空白
- `created_at` / `updated_at` — 自動時間戳；預設排序為 `-created_at`

標籤**未正規化** — 以單一逗號分隔字串儲存。對標籤的搜尋或篩選使用 `icontains`。

## 重要限制

- **無身份驗證** — API 完全開放，所有筆記皆為全域共用。
- **CORS**：僅允許 `localhost:5173` 與 `127.0.0.1:5173`（在 `settings.py` 設定）。其他環境請在 `CORS_ALLOWED_ORIGINS` 新增來源。
- 新增 API 端點時，需在 `notes/urls.py` 的 `DefaultRouter` 註冊，或在 `NoteViewSet` 加上 `@action` 裝飾器。
- 修改 `models.py` 後須執行 `make makemigrations && make migrate`。
- **無 AI 功能**：摘要端點目前僅使用 regex，不呼叫 Claude 或任何外部 AI 服務。
