# Graduation Landing 2026

Прощальный лендинг-история. Чистый HTML / CSS / JS, без сборки и зависимостей. Деплой — GitHub Pages.

## Быстрый старт (локально)

1. Положи ассеты в папки (см. ниже).
2. Открой `index.html` в браузере **или** подними простой сервер:

```bash
# Python
python -m http.server 8080

# Node (если есть npx)
npx --yes serve .
```

3. Открой http://localhost:8080

> Аудио загружается и стартует только после нажатия «Начать выпускной» или кнопки звука — это соответствует autoplay-политикам браузеров.

## Ассеты (положить вручную)

| Файл | Путь |
|------|------|
| Коллеги (WebP с альфа-каналом, 800×1000) | `assets/images/colleague-1.webp` … `colleague-5.webp` |
| Орнаменты hero (WebP, 560×560) | `assets/images/paxta-ornament1.webp` … `paxta-ornament3.webp` |
| Превью для шаринга | `assets/images/og-preview.webp` (источник: `og-preview.png`) |
| Финальное видео (оптимизированное 720p) | `assets/images/tanya-graduation.mp4` |
| Лёгкий постер видео | `assets/images/tanya-graduation-poster.webp` |
| Оригинальное фото для скачивания | `assets/images/tanya-graduation.png` |
| Favicon | `assets/images/favicon.ico` |
| Музыка | `assets/audio/vypusknoj.mp3` |

Имена файлов должны совпадать точно — пути уже прописаны в коде.

## Деплой на GitHub Pages

1. Запушь репозиторий на GitHub (включая папку `assets/` с файлами).
2. **Settings → Pages → Build and deployment**
3. Source: **Deploy from a branch**
4. Branch: `main` (или `master`), folder: **/ (root)**
5. Save. Сайт будет по адресу:

`https://<username>.github.io/<repo-name>/`

Все пути относительные — отдельно ничего править не нужно.

## Структура

```
index.html
css/styles.css
js/script.js
assets/images/
assets/audio/
assets/fonts/
README.md
```

## Технологии

- Vanilla HTML / CSS / JS
- Intersection Observer / requestAnimationFrame / Web Animations API
- Локальные variable-fonts Unbounded + Manrope (кириллица и латиница)

Внешних runtime-зависимостей нет; сборка не нужна.
