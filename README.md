# 學習筆記管理系統 Learning Notes Platform

[![Claude Code](https://img.shields.io/badge/Claude%20Code-AI%20Development-6c5ce7?style=for-the-badge&logo=anthropic&logoColor=white)](https://claude.ai) [![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/) [![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/) [![Django](https://img.shields.io/badge/Django-092e20?style=for-the-badge&logo=django&logoColor=white)](https://www.djangoproject.com/) [![Django REST Framework](https://img.shields.io/badge/Django%20REST%20Framework-ff1709?style=for-the-badge&logo=django&logoColor=white)](https://www.django-rest-framework.org/) [![CRUD](https://img.shields.io/badge/CRUD-Operations-FF9800?style=for-the-badge)]()

本專案使用 AI 開發工具（Claude Code） 提升開發效率，但系統本身不包含 AI 功能。

## 專案簡介

一個以 Django REST API 為後端、React + TypeScript 為前端的學習筆記應用程式。使用者可以建立、搜尋、標記和摘要學習筆記。

## 專案特色

### 前後端分離架構
* 前端：React + TypeScript + Vite
* 後端：Django + Django REST Framework
* RESTful API 設計

### 標籤系統
* 使用字串儲存 Tags
* hash 映射固定顏色

## Claude Code 開發輔助工具

* 前後端專案結構規劃
* 系統架構設計規劃
* README 文件優化

## 前端頁面示意

### 首頁

<img width="2561" height="1919" alt="FireShot Capture 060 - frontend -  localhost" src="https://github.com/user-attachments/assets/3834652d-a8ed-4ebf-bc63-09e9a8616edd" />

### 新增筆記

<img width="2561" height="1208" alt="FireShot Capture 068 - frontend -  localhost" src="https://github.com/user-attachments/assets/d5630f6c-1bd9-4314-b310-05938e34e6ee" />

### 編輯筆記

<img width="2561" height="1155" alt="FireShot Capture 067 - frontend -  localhost" src="https://github.com/user-attachments/assets/954d3281-6483-401f-acae-96db161bfafe" />

### Django 後台管理

<img width="2561" height="1160" alt="FireShot Capture 062 - 選擇 note 來修改 - Django 網站管理 -  127 0 0 1" src="https://github.com/user-attachments/assets/506a48c1-b3b5-494a-a9ff-e4fe86c43665" />

### Django REST framework

<img width="2561" height="1155" alt="FireShot Capture 064 - Api Root – Django REST framework -  127 0 0 1" src="https://github.com/user-attachments/assets/7543602f-1e5d-42e6-9f70-f15c69be9d3b" />

## 技術架構

### Frontend
* React
* TypeScript
* Vite

### Backend
* Django 5+
* Django REST Framework
* SQLite

## 系統架構圖

<img width="1973" height="1581" alt="mermaid-diagram (2)" src="https://github.com/user-attachments/assets/939da829-af92-4f92-b4dc-54cbc1bab91e" />

## 資料流程圖

<img width="1948" height="1186" alt="mermaid-diagram (1)" src="https://github.com/user-attachments/assets/2f55bdb1-df82-4098-9957-9fb27ea3f186" />

## API 設計（RESTful）

| 功能     | Method | Endpoint                     | 說明              | Response                       |
| ------ | ------ | ---------------------------- | --------------- | ------------------------------ |
| 取得筆記列表 | GET    | `/api/notes/`                | 取得所有筆記（支援搜尋與分頁） | `count + results[]`            |
| 建立筆記   | POST   | `/api/notes/`                | 新增一筆筆記          | Note 物件                        |
| 取得單一筆記 | GET    | `/api/notes/{id}/`           | 依 ID 取得筆記       | Note 物件                        |
| 更新筆記   | PATCH  | `/api/notes/{id}/`           | 部分更新筆記          | 更新後 Note                       |
| 刪除筆記   | DELETE | `/api/notes/{id}/`           | 刪除筆記            | `204 No Content`               |
| 筆記摘要   | POST   | `/api/notes/{id}/summarize/` | 使用 regex 產生摘要   | `{id, summary, ai_used:false}` |

## 專案架構

```
.
├── frontend
├── backend
├── CLAUDE.md
├── Makefile
└── README.md
```

### Frontend
```
frontend
├── dist
├── node_modules
├── public
├── src
├── .env
├── .env.example
├── .gitignore
├── eslint.config.js
├── index.html
├── package-lock.json
├── package.json
├── README.md
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

### Backend
```
backend
│   ├── backend
│   │   ├── pycache/
│   │   ├── init.py
│   │   ├── asgi.py
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   └── notes
│       ├── pycache/
│       ├── migrations/
│       ├── init.py
│       ├── admin.py
│       ├── apps.py
│       ├── models.py
│       ├── serializers.py
│       ├── tests.py
│       ├── urls.py
│       └── views.py
├── .env
├── .env.example
├── .gitignore
├── db.sqlite3
├── manage.py
└── requirements.txt
```

## 開發流程

1. 需求分析與功能拆解
1. RESTful API 設計（Django DRF）
1. 前端 React 架構設計
1. 前後端 API 串接
1. 功能優化（debounce / pagination / search）
1. Claude Code 輔助重構與文件整理

## 開發指令

所有指令皆在**專案根目錄**（`learning-notes-platform/`）執行。Python 虛擬環境位於 `venv/`。

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

## 版權聲明

此專案僅供個人學習與紀錄使用，無授權任何學習教材用途與商業用途。

## 致謝

感謝所有為這個專案提供建議和協助的人。
