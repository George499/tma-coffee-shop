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

## Что не получилось

- **Render free** — workspace заблокирован неоплаченным инвойсом $6 за апрель 2025. Чтобы воспользоваться — заплатить инвойс.
- **Railway Hobby** — trial кончился, $5/мес.
- **Koyeb** — eco/nano free tier удалён, минимум $30/мес.
- **Fly.io** — free tier закрыт late 2024, pay-as-you-go от ~$5/мес.

## Реальный scope

Не "1 проект на хосте", а **личный мини-PaaS** на 10-20 одновременных сервисов: 4 портфолио-проекта (этот TMA, простой бот, парсер, Vision API) + клиентские demo/test/staging-деплои которые пользователь не хочет лить сразу на сервер заказчика. Высокий churn — сервисы появляются и исчезают по мере engagement'ов. Решения "$5/мес за каждый сервис" не подходят (получится $20-50+/мес).

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
