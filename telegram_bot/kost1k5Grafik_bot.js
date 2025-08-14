const TelegramBot = require('node-telegram-bot-api');
const token = '8465731918:AAGzRLUd8hLQ9ziASTQ1Ed_beJV9NmuKtMA';
const bot = new TelegramBot(token, { polling: true });

let userData = {};

// Главное меню с кнопками
const mainMenu = {
  reply_markup: {
    keyboard: [
      ['/start', '/set'],
      ['/schedule', '/salary'],
      ['/add', '/reset'],
      ['/help']
    ],
    resize_keyboard: true,
    one_time_keyboard: false
  }
};

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id,
    'Привет! Я бот для расчёта зарплаты.\n' +
    'По умолчанию график — 3/3.\n' +
    'Используй /set чтобы ввести ставку, часы и график.',
    mainMenu
  );
});

bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.chat.id,
    'Команды бота:\n' +
    '/start — приветствие и меню\n' +
    '/set — ввести данные: ставка, часы, график\n' +
    '/schedule — показать график работы на месяц\n' +
    '/salary — показать итоговую зарплату\n' +
    '/add — добавить часы к конкретному дню (например, переработка)\n' +
    '/reset — сбросить все данные и начать заново\n\n' +
    'Формат ввода для /set:\n' +
    'ставка_в_час часы_в_смену первый_рабочий_день [рабочие_дни выходные]\n\n' +
    'Пример 3/3 с началом 2 мая:\n500 8 2\n\n' +
    'Пример 5/2:\n500 8 2 5 2',
    mainMenu
  );
});

bot.onText(/\/set/, (msg) => {
  bot.sendMessage(msg.chat.id,
    'Введи данные для расчёта зарплаты в формате:\n' +
    'ставка_в_час часы_в_смену первый_рабочий_день [кол-во_рабочих_дней кол-во_выходных]\n\n' +
    'Описание:\n' +
    '- ставка_в_час — сколько ты получаешь за час работы (например, 500)\n' +
    '- часы_в_смену — сколько часов ты работаешь в один рабочий день (например, 8)\n' +
    '- первый_рабочий_день — число месяца, с которого начинается твой рабочий цикл (например, 2)\n' +
    '- кол-во_рабочих_дней — сколько дней подряд работаешь (по умолчанию 3)\n' +
    '- кол-во_выходных — сколько дней подряд отдыхаешь (по умолчанию 3)\n\n' +
    'Пример с графиком 3/3:\n' +
    '500 8 2\n\n' +
    'Пример с графиком 5/2:\n' +
    '500 8 2 5 2',
    mainMenu
  );

  bot.once('message', (m) => {
    if (m.text.startsWith('/')) return; // если пользователь ввёл команду вместо данных — игнорируем

    const parts = m.text.split(' ').map(Number);
    const hourlyRate = parts[0];
    const hoursPerShift = parts[1];
    const firstWorkDay = parts[2];
    const workDaysCount = parts[3] || 3;
    const restDaysCount = parts[4] || 3;
    const daysInMonth = 30;

    if (
      isNaN(hourlyRate) || isNaN(hoursPerShift) || isNaN(firstWorkDay) ||
      isNaN(workDaysCount) || isNaN(restDaysCount) ||
      hourlyRate <= 0 || hoursPerShift <= 0 || firstWorkDay < 1 || firstWorkDay > daysInMonth ||
      workDaysCount < 1 || restDaysCount < 1
    ) {
      bot.sendMessage(msg.chat.id, 'Неверный формат данных. Попробуй ещё раз через /set', mainMenu);
      return;
    }

    let schedule = [];
    let dayType = 'work';
    let counter = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      let isWorkDay;
      if (day >= firstWorkDay) {
        isWorkDay = (dayType === 'work');
        counter++;
        if (dayType === 'work' && counter === workDaysCount) {
          dayType = 'rest';
          counter = 0;
        } else if (dayType === 'rest' && counter === restDaysCount) {
          dayType = 'work';
          counter = 0;
        }
      } else {
        isWorkDay = false;
      }
      schedule.push({
        day,
        hours: isWorkDay ? hoursPerShift : 0,
        isWorkDay
      });
    }

    userData[msg.chat.id] = {
      hourlyRate,
      hoursPerShift,
      workDaysCount,
      restDaysCount,
      schedule
    };

    bot.sendMessage(msg.chat.id, `График сохранён: ${workDaysCount}/${restDaysCount}. Используй /schedule и /salary.`, mainMenu);
  });
});

bot.onText(/\/salary/, (msg) => {
  const data = userData[msg.chat.id];
  if (!data) {
    bot.sendMessage(msg.chat.id, 'Сначала введи данные через /set', mainMenu);
    return;
  }
  const totalHours = data.schedule.reduce((sum, day) => sum + day.hours, 0);
  const salary = totalHours * data.hourlyRate;
  bot.sendMessage(msg.chat.id, `Итого: ${totalHours} часов, зарплата: ${salary}₽`, mainMenu);
});

bot.onText(/\/schedule/, (msg) => {
  const data = userData[msg.chat.id];
  if (!data) {
    bot.sendMessage(msg.chat.id, 'Сначала введи данные через /set', mainMenu);
    return;
  }
  const text = data.schedule.map(d =>
    `${d.day} число — ${d.hours > 0 ? d.hours + ' ч. работы' : 'выходной'}`
  ).join('\n');
  bot.sendMessage(msg.chat.id, text, mainMenu);
});

// Добавляем часы к конкретному дню с увеличением часов на выходных (например, +1 ч)
bot.onText(/\/add/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Напиши день и часы для добавления (например: 15 4)');
  bot.once('message', (m) => {
    if (!userData[msg.chat.id]) {
      bot.sendMessage(msg.chat.id, 'Сначала введи данные через /set', mainMenu);
      return;
    }
    const [day, hoursToAdd] = m.text.split(' ').map(Number);
    if (isNaN(day) || isNaN(hoursToAdd) || day < 1 || day > 30 || hoursToAdd <= 0) {
      bot.sendMessage(msg.chat.id, 'Неверный формат. Попробуй ещё раз через /add', mainMenu);
      return;
    }

    const data = userData[msg.chat.id];
    const dayEntry = data.schedule.find(d => d.day === day);
    if (!dayEntry) {
      bot.sendMessage(msg.chat.id, 'День не найден в графике.', mainMenu);
      return;
    }

    // Если это выходной день — добавляем +1 час к добавляемым (т.е. считаем 1 час как 1.25)
    let extraHours = hoursToAdd;
    if (!dayEntry.isWorkDay && hoursToAdd > 0) {
      extraHours = hoursToAdd + 1; // например добавляем +1 час
    }

    dayEntry.hours += extraHours;

    bot.sendMessage(msg.chat.id, `К ${day} числу добавлено ${extraHours} ч. (учтены переработки)`, mainMenu);
  });
});

// Команда для сброса данных
bot.onText(/\/reset/, (msg) => {
  delete userData[msg.chat.id];
  bot.sendMessage(msg.chat.id, 'Данные сброшены. Используй /set для ввода новых данных.', mainMenu);
});

console.log('Бот запущен...');
