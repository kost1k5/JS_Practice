const formaFirst = document.getElementById('form1');
const formaSecond = document.getElementById('form2')

const formDef1 = [
  {label:'Название сайта:',kind:'longtext',name:'sitename'},
  {label:'URL сайта:',kind:'longtext',name:'siteurl'},
  {label:'Посетителей в сутки:',kind:'number',name:'visitors'},
  {label:'E-mail для связи:',kind:'shorttext',name:'email'},
  {label:'Рубрика каталога:',kind:'dropdown',name:'division',
    variants:[{text:'здоровье',value:1},{text:'домашний уют',value:2},{text:'бытовая техника',value:3}]},
  {label:'Размещение:',kind:'radio',name:'payment',
    variants:[{text:'бесплатное',value:1},{text:'платное',value:2},{text:'VIP',value:3}]},
  {label:'Разрешить отзывы:',kind:'check',name:'votes'},
  {label:'Описание сайта:',kind:'memo',name:'description'},
  {caption:'Опубликовать',kind:'submit'},
];
const formDef2 = [
  {label:'Фамилия:',kind:'longtext',name:'lastname'},
  {label:'Имя:',kind:'longtext',name:'firstname'},
  {label:'Отчество:',kind:'longtext',name:'secondname'},
  {label:'Возраст:',kind:'number',name:'age'},
  {caption:'Зарегистрироваться',kind:'submit'},
];

function dynForm(formElement, formData) {
  formData.forEach(field => {
    const wrapper = document.createElement('div'); // обёртка для элемента формы

    if (field.kind === 'longtext' || field.kind === 'shorttext') {
      const label = document.createElement('label');
      label.textContent = field.label;

      const input = document.createElement('input');
      input.type = 'text';
      input.name = field.name;

      label.appendChild(input);
      wrapper.appendChild(label);

    } else if (field.kind === 'number') {
      const label = document.createElement('label');
      label.textContent = field.label;

      const input = document.createElement('input');
      input.type = 'number';
      input.name = field.name;

      label.appendChild(input);
      wrapper.appendChild(label);

    } else if (field.kind === 'dropdown') {
      const label = document.createElement('label');
      label.textContent = field.label;

      const select = document.createElement('select');
      select.name = field.name;

      field.variants.forEach(variant => {
        const option = document.createElement('option');
        option.value = variant.value;
        option.textContent = variant.text;
        select.appendChild(option);
      });

      label.appendChild(select);
      wrapper.appendChild(label);

    } else if (field.kind === 'radio') {
      const groupLabel = document.createElement('div');
      groupLabel.textContent = field.label;

      field.variants.forEach(variant => {
        const radioInput = document.createElement('input');
        radioInput.type = 'radio';
        radioInput.name = field.name;
        radioInput.value = variant.value;

        const radioTextLabel = document.createElement('label');
        radioTextLabel.appendChild(radioInput);
        radioTextLabel.appendChild(document.createTextNode(variant.text));

        groupLabel.appendChild(radioTextLabel);
      });

      wrapper.appendChild(groupLabel);

    } else if (field.kind === 'check') {
      const label = document.createElement('label');
      label.textContent = field.label

      const input = document.createElement('input');
      input.type = 'checkbox';
      input.name = field.name;

      label.appendChild(input);
      
      wrapper.appendChild(label);

    } else if (field.kind === 'memo') {
      const label = document.createElement('label');
      label.textContent = field.label;

      const br = document.createElement('br');
      const textArea = document.createElement('textarea');
      textArea.name = field.name;

      label.appendChild(br);
      label.appendChild(textArea);
      wrapper.appendChild(label);

    } else if (field.kind === 'submit') {
      const input = document.createElement('input');
      input.type = 'submit';
      input.value = field.caption || 'Отправить';
      wrapper.appendChild(input);

    }

    // Добавляем единоразово обёртку в форму
    formElement.appendChild(wrapper);
  });
}

dynForm(formaFirst, formDef1);
dynForm(formaSecond, formDef2);