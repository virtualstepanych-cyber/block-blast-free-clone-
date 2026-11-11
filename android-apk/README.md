# Block Blast — сборка APK

Готовый проект-обёртка: HTML-игра упакована в нативное Android-приложение через Capacitor.
Сборка идёт в облаке GitHub Actions — на компьютере ничего устанавливать не нужно.

## Вариант 1. GitHub Actions (без установки Android Studio)

1. Создайте пустой репозиторий на github.com и загрузите туда **всё содержимое папки
   `android-apk`** (включая скрытую папку `.github`).
2. Откройте вкладку **Actions** → workflow **Build APK** → **Run workflow**.
3. Через ~5 минут скачайте артефакт `block-blast-apk` — внутри `app-debug.apk`.
4. Перекиньте APK на телефон и установите (разрешите установку из неизвестных источников).

Файл `www/index.html` — сама игра. Если правите игру в `block-blast.html`, обновите копию:

```
multitool-node tools/build-app.cjs
```

## Вариант 2. Локально (Windows)

Нужны: JDK 17+, Android Studio (SDK 35), Node.js 20+.

```
npm install
npx cap add android
npx cap sync android
cd android
gradlew.bat assembleDebug
```

APK появится в `android\app\build\outputs\apk\debug\app-debug.apk`.

## Подпись для публикации

Debug-APK ставится на телефон, но не годится для Google Play. Для релиза создайте keystore
и соберите `assembleRelease` с `signingConfig` — либо соберите подписанный APK в Android Studio
(Build → Generate Signed Bundle / APK).
