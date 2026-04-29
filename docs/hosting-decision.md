# Hosting decision (open) — резюме для следующей сессии

Этот файл — снимок состояния на конец дня **2026-04-28**, чтобы продолжить с другой машины. Когда хост будет выбран и развёрнут — файл удалить.

## Текущее состояние

| Компонент | Состояние |
|---|---|
| **Web (Vercel)** | Развёрнут: https://tma-coffee-shop.vercel.app, build green на `dfb6230`. Env: `NEXT_PUBLIC_BOT_USERNAME=tma_coffee_shop_bot`, `NEXT_PUBLIC_API_URL=https://tma-coffee-shop-api.onrender.com` (placeholder, хост не существует). |
| **API host** | Не развёрнут. |
| **Bot** | Код переехал в API (`apps/api/src/telegram/`), отдельного процесса больше нет; webhook-режим в проде, long-poll локально по `TELEGRAM_LONGPOLL=true`. |
| **DB** | Neon (продолжаем использовать). |
| **`origin/main` HEAD** | `50672f1 chore(deploy): switch from Railway to Koyeb free tier`. |
| **README** | Зовёт деплоить на Koyeb, **что некорректно** — у Koyeb в 2026 нет free tier (минимум $30/мес). После выбора хоста секцию переписать; если ждём решение — заменить на `## Choosing a host (decision pending)` или указатель на этот файл. |

## Что в TMA уже сделано (код)

Все 5 пунктов исходного roadmap из `CLAUDE.md` реализованы и протестированы локально. По уровням:

**API (NestJS 11)**
- `GET /api/categories`, `GET /api/products?categoryId=N` — публичные.
- `GET /api/me`, `POST /api/orders`, `GET /api/orders/:id` — защищены `TmaAuthGuard` (HMAC-SHA256 по bot token, окно 24ч).
- `PATCH /api/orders/:id/status` — `BotAuthGuard` (X-Bot-Secret, constant-time compare). NEW→ACCEPTED/CANCELLED, повторный вызов даёт 409.
- `POST /api/telegram/webhook` — Telegram secret-token. Forward в `bot.handleUpdate()`.
- Глобальный ValidationPipe `whitelist + forbidNonWhitelisted + transform`. CORS на `WEB_ORIGIN`. Префикс `/api`.
- `OrdersService.create` создаёт заказ в `prisma.$transaction` с upsert User по Telegram-id, server-side пересчётом total и snapshot'ом `productName`/`productPrice` в OrderItem.
- `AdminNotifierService` шлёт нотификацию в `ADMIN_CHAT_ID` после создания заказа (best-effort, ошибки логируются, не падает).

**Bot (grammy внутри API)**
- Один Bot инстанс в `TelegramService`. Callback-handler `/^order:(accept|reject):(.+)$/` вызывает `OrdersService.applyAction` напрямую (без HTTP-перепрыга).
- `TELEGRAM_LONGPOLL=true` локально, `setWebhook(TELEGRAM_WEBHOOK_URL)` в проде. Shutdown hooks стопают long-poll корректно.

**Web (Next.js 16)**
- `/` — каталог категории/продукты, грид 2/3/4 колонки, `ProductCard` со степпером "−/N/+", фиксированный `CartBar` "В корзине X · YYYY ₽".
- Корзина: Zustand store, persist в `localStorage` (`tma-coffee-cart`), hasHydrated-флаг чтобы не было SSR/CSR mismatch.
- `/checkout` — react-hook-form + zod schema, conditional `address` для DELIVERY, phone regex, `scheduledAt` диапазон now+15мин..+14д, `comment` ≤500.
- `/order/[id]` — TanStack Query, **adaptive polling**: 3с при NEW, 5с при ACCEPTED, off при terminal. Page Visibility API ставит на паузу при скрытом табе.
- `tmaFetch()` авто-добавляет `Authorization: tma <initData>`. `ApiError` пробрасывает 401/403/404 как осмысленные сообщения на UI.

**Тесты**
- 11/11 jest: 5 кейсов на initData (валидная/чужой token/expired/empty/tampered) + 6 на `calculateTotal` (multi-item, single, 1-копейка, empty cart, unknown id, защита от подделки цены клиентом).

**Что осознанно НЕ сделано** (anti-scope из CLAUDE.md):
- Реальная оплата (ни Stars, ни эквайринг).
- Переходы `ACCEPTED → READY → COMPLETED` — `applyAction` сейчас только NEW→ACCEPTED/CANCELLED. Расширяется элементарно если потребуется.
- Web админ-панель (управление через бот достаточно).
- Push клиенту о смене статуса (только админу).

## Что не получилось

- **Render free** — workspace заблокирован неоплаченным инвойсом $6 за апрель 2025. Чтобы воспользоваться — заплатить инвойс.
- **Railway Hobby** — trial кончился, $5/мес.
- **Koyeb** — eco/nano free tier удалён, минимум $30/мес.
- **Fly.io** — free tier закрыт late 2024, pay-as-you-go от ~$5/мес.

## Реальный scope

Не "1 проект на хосте", а **личный мини-PaaS** на 10-20 одновременных сервисов: 4 портфолио-проекта (этот TMA, простой бот, парсер, Vision API) + клиентские demo/test/staging-деплои которые пользователь не хочет лить сразу на сервер заказчика. Высокий churn — сервисы появляются и исчезают по мере engagement'ов. Решения "$5/мес за каждый сервис" не подходят (получится $20-50+/мес).

## Дальнейшие портфолио-проекты

После TMA в очереди ещё минимум 3 backend'а — все они должны жить на той же инфраструктуре, что выберется в этой сессии. Это и есть основная причина не брать решение под "одну услугу за $5/мес":

1. **Простой Telegram-бот** — отдельный grammy-бот без TMA-фронта (например, FAQ-бот или утилита). Single-process, long-poll или webhook. Проще TMA: без БД (или с минимальной SQLite), без web-app. Технически — `Dockerfile` копия по структуре с этого репо, минус Next.js.
2. **Парсер** — периодический скрапер (что-то с расписанием: новости, цены, RSS). Background worker, не HTTP-сервис. Скорее всего Node + cheerio/playwright или Python + httpx/bs4 (зависит от сайта). Хранение результатов в Postgres / SQLite. Удобно крутить как cron job или long-running с internal scheduler.
3. **Vision API** — HTTP wrapper над платным image model API (OpenAI gpt-4o-vision / Anthropic Claude / Google Gemini). REST endpoint принимает картинку, прокидывает в выбранную модель, возвращает результат + кэш. Stateless, но с rate-limiting и API-ключами. Демонстрирует работу с multimodal моделями.

**Плюс** клиентские demo/test/staging-деплои (короткоживущие, 2-30 дней), которые не хочется заливать сразу на сервер заказчика. Это main reason почему 10-20 одновременных сервисов реально, не преувеличение.

**Что это значит для архитектуры выбора**:
- Все 4 backend'а будут разные по характеру: HTTP API (TMA, Vision), background worker (parser), grammy bot (simple bot). Self-hosted PaaS типа Coolify умеет все три типа из коробки (Web service, Background worker, Cron). Render и Railway — тоже, но за каждый сервис отдельный платёж.
- БД: один Postgres (либо Neon с несколькими databases, либо контейнер на VPS) разделяется между проектами через схемы или отдельные dbs. Для парсера/Vision/простого бота скорее всего хватит SQLite.
- Каждый проект хранит свой Dockerfile в репо → переезд на сервер клиента когда engagement готов сводится к `docker pull` + env vars.

## Геокинтекст

Пользователь в РФ. Это исключает:
- **Hetzner** — не принимает RU-клиентов с 2022.
- **Oracle Cloud Always Free** — нужна не-RU карта, плюс риск блокировки аккаунта без предупреждения.

Российские провайдеры (платёж RU-картами, RU-датацентры, доступны из-за рубежа): Timeweb Cloud, Selectel, Beget, Yandex Cloud.

## Развилка

| Вариант | Стоимость | Когда подходит |
|---|---|---|
| **A. Coolify self-hosted на российском VPS** | ~₽500/мес VPS + ~₽300/год домен | Долгосрочный план под все 10-20 сервисов. **Рекомендуется.** |
| B. Заплатить $6 invoice → Render free | разовый $6, потом $0/мес (квота 750ч/мес/сервис) | Только если хочется быстро задеплоить ЭТОТ один проект и отложить решение про другие. |
| C. Cloudflare Tunnel + локальный ПК | $0 | Только для live-демо во время звонков. ПК должен быть включён. |

**Coolify** — open-source self-hosted PaaS. Не путать с Coolify Cloud (платный managed-сервис). Self-hosted версия 100% бесплатна, ставится на любой Linux/Docker VPS одной командой `curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash`. Даёт UX уровня Render/Railway: подключаешь GitHub-репо → клик "Deploy" → получаешь `<project>.твой-домен` с auto-SSL через Let's Encrypt.

## План на следующую сессию (если выбрана A)

Что нужно от пользователя:
1. Зарегистрироваться у российского провайдера (рекомендация: **Timeweb Cloud** — `timeweb.cloud`), взять VPS Ubuntu 22.04/24.04, **2vCPU/4GB RAM** (~₽450-550/мес).
2. Зарегистрировать домен (Reg.ru / nic.ru). Подойдёт `.ru`/`.online`/`.dev` (~₽199-499/год).

Что делает ассистент по шагам:
1. SSH-ключи + базовый harden VPS (firewall, fail2ban, обновления).
2. Установка Coolify: `curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash`. Coolify займёт порты 80/443/8000.
3. DNS: A-запись `@ → <vps-ip>` и wildcard `*.<domain> → <vps-ip>`. Вариант через Cloudflare (free, RU-доступ) или через DNS провайдера домена.
4. Coolify UI → Settings → Server → Add domain → Coolify сам выпустит wildcard SSL через Let's Encrypt.
5. Coolify → Sources → Connect GitHub.
6. Coolify → Add new resource → Public Repository → `tma-coffee-shop` → Build pack: Dockerfile → Path: `apps/api/Dockerfile` → Build context: repo root → Port: 3001.
7. Environment variables в Coolify:
   - `DATABASE_URL` — Neon DSN
   - `TELEGRAM_BOT_TOKEN` — bot token из BotFather
   - `ADMIN_CHAT_ID` — telegram user id
   - `WEB_ORIGIN` — `https://tma-coffee-shop.vercel.app`
   - `TELEGRAM_WEBHOOK_URL` — `https://tma-api.<domain>/api/telegram/webhook` (после того как Coolify покажет назначенный sub-domain)
   - `TELEGRAM_WEBHOOK_SECRET` — `openssl rand -hex 32`
   - `BOT_API_SECRET` — `openssl rand -hex 32`
   - `NODE_ENV=production`
   - `PORT=3001`
8. Deploy. Smoke-test `curl https://tma-api.<domain>/api/categories`.
9. Обновить Vercel env `NEXT_PUBLIC_API_URL` на новый URL → redeploy.
10. BotFather → `/mybots` → этот бот → Bot Settings → Menu Button → URL = Vercel URL.
11. End-to-end из Telegram: каталог → корзина → checkout → admin-нотификация → Принять → polling показывает ACCEPTED.

Ориентировочное время сессии: ~2 часа.

## План если выбрана B (Render)

1. Пользователь оплачивает $6 в Render dashboard.
2. Re-import существующего `render.yaml` Blueprint.
3. Заполнить секреты в UI, deploy.
4. Vercel env update + BotFather + UptimeRobot.

Не решает scaling-проблему для следующих проектов.

## План если выбрана C (Cloudflare Tunnel)

1. `winget install --id Cloudflare.cloudflared` (или скачать exe).
2. `cloudflared tunnel --url http://localhost:3001` — public URL `*.trycloudflare.com`.
3. Vercel env update на этот URL.
4. BotFather Menu Button.

API живёт пока ПК включён.

## Файлы в репо относящиеся к deploy

- `apps/api/Dockerfile` — multi-stage build, готов к любому Docker-хосту (Coolify/Render/etc).
- `render.yaml` — Render Blueprint (висит в репо несмотря на блок). Можно использовать если выбрана B; иначе после выбора другого хоста — удалить.
- `apps/web/vercel.json` — рабочий, не трогаем.
- `.env.example` — документирует все нужные env vars включая `TELEGRAM_WEBHOOK_URL`, `TELEGRAM_WEBHOOK_SECRET`, `BOT_API_SECRET`, `TELEGRAM_LONGPOLL`.
