// Получаем ссылки на DOM-элементы форм по их ID
const formaFirst = document.getElementById('form1');
const formaSecond = document.getElementById('form2');

// Определение структуры первой формы
const formDef1 = [
  // Поле для ввода названия сайта (длинный текст)
  {label:'Название сайта:',kind:'longtext',name:'sitename'},
  // Поле для ввода URL сайта (длинный текст)
  {label:'URL сайта:',kind:'longtext',name:'siteurl'},
  // Поле для ввода количества посетителей в сутки (число)
  {label:'Посетителей в сутки:',kind:'number',name:'visitors'},
  // Поле для ввода E-mail (короткий текст)
  {label:'E-mail для связи:',kind:'shorttext',name:'email'},
  // Выпадающий список для выбора рубрики каталога
  {label:'Рубрика каталога:',kind:'dropdown',name:'division',
    variants:[{text:'здоровье',value:1},{text:'домашний уют',value:2},{text:'бытовая техника',value:3}]},
  // Группа радиокнопок для выбора типа размещения
  {label:'Размещение:',kind:'radio',name:'payment',
    variants:[{text:'бесплатное',value:1},{text:'платное',value:2},{text:'VIP',value:3}]},
  // Чекбокс для разрешения отзывов
  {label:'Разрешить отзывы:',kind:'check',name:'votes'},
  // Многострочное текстовое поле для описания сайта
  {label:'Описание сайта:',kind:'memo',name:'description'},
  // Кнопка отправки формы
  {caption:'Опубликовать',kind:'submit'},
];

// Определение структуры второй формы
const formDef2 = [
  // Поле для ввода фамилии (длинный текст)
  {label:'Фамилия:',kind:'longtext',name:'lastname'},
  // Поле для ввода имени (длинный текст)
  {label:'Имя:',kind:'longtext',name:'firstname'},
  // Поле для ввода отчества (длинный текст)
  {label:'Отчество:',kind:'longtext',name:'secondname'},
  // Поле для ввода возраста (число)
  {label:'Возраст:',kind:'number',name:'age'},
  // Кнопка отправки формы
  {caption:'Зарегистрироваться',kind:'submit'},
];

/**
 * Функция для динамического создания HTML-формы на основе массива с описанием полей.
 * @param {HTMLElement} formElement - DOM-элемент <form>, куда будут добавляться поля.
 * @param {Array<Object>} formData - Массив объектов, описывающих поля формы.
 */
function dynForm(formElement, formData) {
  // Перебираем каждый объект (описание поля) в массиве formData
  formData.forEach(field => {
    // Создаём универсальную обёртку <div> для каждого поля.
    // Это помогает управлять расположением и стилями каждого элемента формы.
    const wrapper = document.createElement('div');

    // --- Обработка полей типа 'longtext' и 'shorttext' (однострочные текстовые поля) ---
    if (field.kind === 'longtext' || field.kind === 'shorttext') {
      // Создаём элемент <label> для подписи поля
      const label = document.createElement('label');
      label.textContent = field.label; // Устанавливаем текст подписи

      // Создаём элемент <input type="text">
      const input = document.createElement('input');
      input.type = 'text'; // Тип текстового поля
      input.name = field.name; // Имя поля, которое будет отправлено на сервер

      // Вставляем input внутрь label
      label.appendChild(input);
      // Вставляем label (с вложенным input) внутрь обёртки
      wrapper.appendChild(label);

    } 
    // --- Обработка поля типа 'number' (числовое поле) ---
    else if (field.kind === 'number') {
      const label = document.createElement('label');
      label.textContent = field.label;

      const input = document.createElement('input');
      input.type = 'number'; // Тип числового поля
      input.name = field.name;

      label.appendChild(input);
      wrapper.appendChild(label);

    } 
    // --- Обработка поля типа 'dropdown' (выпадающий список <select>) ---
    else if (field.kind === 'dropdown') {
      const label = document.createElement('label');
      label.textContent = field.label; // Подпись для выпадающего списка

      const select = document.createElement('select');
      select.name = field.name;

      // Перебираем варианты из массива field.variants и создаём <option> для каждого
      field.variants.forEach(variant => {
        const option = document.createElement('option');
        option.value = variant.value; // Значение, которое будет отправлено
        option.textContent = variant.text; // Текст, который видит пользователь
        select.appendChild(option);
      });

      label.appendChild(select);
      wrapper.appendChild(label);

    } 
    // --- Обработка поля типа 'radio' (группа радиокнопок) ---
    else if (field.kind === 'radio') {
      // Создаём div, который будет содержать заголовок группы и все радиокнопки
      const groupDiv = document.createElement('div');
      // Устанавливаем заголовок группы радиокнопок
      groupDiv.textContent = field.label;

      // Перебираем варианты из массива field.variants для создания радиокнопок
      field.variants.forEach(variant => {
        const radioInput = document.createElement('input');
        radioInput.type = 'radio'; // Тип радиокнопки
        radioInput.name = field.name; // Важно: одинаковое имя для всех радиокнопок в группе
        radioInput.value = variant.value; // Уникальное значение для каждой радиокнопки

        // Создаём label для текста каждой отдельной радиокнопки
        const radioTextLabel = document.createElement('label');
        radioTextLabel.appendChild(radioInput); // Вставляем input внутрь его label
        radioTextLabel.appendChild(document.createTextNode(variant.text)); // Добавляем текст варианта

        // Добавляем этот label (с радиокнопкой и текстом) в div группы
        groupDiv.appendChild(radioTextLabel);
      });

      wrapper.appendChild(groupDiv);

    } 
    // --- Обработка поля типа 'check' (чекбокс) ---
    else if (field.kind === 'check') {
      const label = document.createElement('label');
      // Для чекбокса, чтобы текст был справа, сначала добавляем input, потом текст
      // label.textContent = ''; // Можно очистить, если текст нужно добавлять отдельно

      const input = document.createElement('input');
      input.type = 'checkbox'; // Тип чекбокса
      input.name = field.name;

      label.appendChild(input); // Сначала сам чекбокс
      label.appendChild(document.createTextNode(field.label)); // Затем его подпись
      wrapper.appendChild(label);

    } 
    // --- Обработка поля типа 'memo' (многострочное текстовое поле <textarea>) ---
    else if (field.kind === 'memo') {
      const label = document.createElement('label');
      label.textContent = field.label; // Подпись для textarea

      const br = document.createElement('br'); // Для переноса строки между label и textarea
      const textArea = document.createElement('textarea');
      textArea.name = field.name;

      label.appendChild(br); // Добавляем перенос
      label.appendChild(textArea); // Добавляем textarea
      wrapper.appendChild(label);

    } 
    // --- Обработка поля типа 'submit' (кнопка отправки формы) ---
    else if (field.kind === 'submit') {
      // Кнопке submit не нужен label, она добавляется напрямую
      const input = document.createElement('input');
      input.type = 'submit'; // Тип кнопки отправки формы
      input.value = field.caption || 'Отправить'; // Текст на кнопке (из caption или "Отправить")
      wrapper.appendChild(input);
    }

    // В конце каждой итерации, независимо от типа поля,
    // добавляем собранную обёртку (wrapper) в целевую форму.
    // Это гарантирует, что каждый элемент формы находится в своём отдельном <div>.
    formElement.appendChild(wrapper);
  });
}

// --- Вызовы функции для создания форм ---
// Создаём первую форму, используя data из formDef1
dynForm(formaFirst, formDef1);
// Создаём вторую форму, используя data из formDef2
dynForm(formaSecond, formDef2);
