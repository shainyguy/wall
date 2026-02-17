/**
 * 📋 Скрипт конвертации CSV → JSON для стены подписчиков
 * 
 * Использование:
 * 1. Создай файл followers.csv с никами (по одному на строку)
 * 2. Запусти: node convert-csv.js
 * 3. Получишь готовый followers.json
 */

const fs = require('fs');

// === НАСТРОЙКИ ===
const INPUT_FILE = 'followers.csv';       // Входной файл
const OUTPUT_FILE = 'followers.json';     // Выходной файл
const NEW_COUNT = 10;                     // Сколько первых считать "новыми"

// Instagram аккаунт
const META = {
    username: 'medvedev.tech',
    displayName: 'Medvedev Tech',
    lastUpdated: new Date().toISOString(),
    instagramUrl: 'https://instagram.com/medvedev.tech'
};

// === КОНВЕРТАЦИЯ ===
try {
    // Читаем CSV
    const csv = fs.readFileSync(INPUT_FILE, 'utf8');
    
    // Парсим ники
    const usernames = csv
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#')) // Убираем пустые и комментарии
        .map(username => username.replace('@', '').replace(',', '')); // Убираем @ и запятые
    
    // Убираем дубликаты
    const uniqueUsernames = [...new Set(usernames)];
    
    console.log(`📥 Найдено ${uniqueUsernames.length} уникальных ников`);
    
    // Создаём объекты подписчиков
    const followers = uniqueUsernames.map((username, index) => ({
        id: index + 1,
        username: username,
        displayName: '',
        avatarUrl: '',
        addedAt: new Date().toISOString().split('T')[0],
        isNew: index < NEW_COUNT
    }));
    
    // Формируем JSON
    const data = {
        meta: META,
        followers: followers
    };
    
    // Сохраняем
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2), 'utf8');
    
    console.log(`✅ Готово! Сохранено в ${OUTPUT_FILE}`);
    console.log(`   📊 Всего: ${followers.length} подписчиков`);
    console.log(`   ✨ Новых (с бейджем): ${NEW_COUNT}`);
    
} catch (error) {
    if (error.code === 'ENOENT') {
        console.error(`❌ Файл ${INPUT_FILE} не найден!`);
        console.log('\n📝 Создай файл followers.csv с никами:');
        console.log('   user1');
        console.log('   user2');
        console.log('   user3');
        console.log('   ...');
    } else {
        console.error('❌ Ошибка:', error.message);
    }
}
