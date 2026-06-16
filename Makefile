VENV = venv
PYTHON = $(VENV)/bin/python
PIP = $(VENV)/bin/pip
BACKEND_DIR = backend
FRONTEND_DIR = frontend

.PHONY: backend frontend install install-frontend makemigrations migrate createsuperuser setup test help

help:
	@echo "可用指令："
	@echo ""
	@echo "  【首次安裝】"
	@echo "  make install          - 安裝後端 Python 套件"
	@echo "  make install-frontend - 安裝前端 npm 套件"
	@echo "  make setup            - 建立資料表（makemigrations + migrate）"
	@echo "  make createsuperuser  - 建立 Django Admin 管理員帳號"
	@echo ""
	@echo "  【開發】"
	@echo "  make backend          - 啟動 Django 後端（port 8000）"
	@echo "  make frontend         - 啟動前端 Vite（port 5173）"
	@echo "  make test             - 執行後端單元測試"
	@echo ""
	@echo "  【資料庫】"
	@echo "  make makemigrations   - 產生 migration 檔案"
	@echo "  make migrate          - 套用 migration 至資料庫"

backend:
	$(PYTHON) $(BACKEND_DIR)/manage.py runserver

frontend:
	cd $(FRONTEND_DIR) && npm run dev

install:
	$(PIP) install -r $(BACKEND_DIR)/requirements.txt

install-frontend:
	cd $(FRONTEND_DIR) && npm install

makemigrations:
	$(PYTHON) $(BACKEND_DIR)/manage.py makemigrations

migrate:
	$(PYTHON) $(BACKEND_DIR)/manage.py migrate

createsuperuser:
	$(PYTHON) $(BACKEND_DIR)/manage.py createsuperuser

test:
	$(PYTHON) $(BACKEND_DIR)/manage.py test notes --verbosity=2

setup: makemigrations migrate
	@echo ""
	@echo "資料庫初始化完成！"
	@echo "請執行 'make createsuperuser' 建立 Django Admin 管理員帳號。"
