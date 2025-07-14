let userInfo = {}

function cleanString(str) {
  if (str === null || str === undefined || typeof str !== 'string' || str.trim() === "") {
    return '';
  }
  return str.trim()
            .replace(/[^а-яА-Яa-zA-Z0-9\s]/g, '')
            .replace(/\s+/g, ' '); // заменяем множественные пробелы на один
}

function registrationButton() {
  let user = '';
  while (!user) {
    let userName = prompt('Введите имя пользователя');
    if (userName === null) return; // отмена
    user = cleanString(userName);
    if (!user) alert('Имя пользователя не может быть пустым');
  }

  let age = '';
  while (!age) {
    let userAge = prompt('Введите возраст пользователя');
    if (userAge === null) return; // отмена
    age = cleanString(userAge);
    if (!age || isNaN(age) || Number(age) <= 0) {
      alert('Возраст пользователя не может быть пустым или отрицательным');
      age = '';
    }
  }

  let city = '';
  while (!city) {
    let userCity = prompt('Введите город пользователя');
    if (userCity === null) return; // отмена
    city = cleanString(userCity);
    if (!city) alert('Название города не может быть пустым');
  }

  userInfo[user.toLowerCase()] = {
    age: Number(age),
    city: city
  };

  alert(`Пользователь ${user} успешно зарегистрирован!`);
}


function infoButton(){
  const name = prompt('Введети имя человека', 'Иван')
  if (name === null){
    return 
  }
  const cleanName = cleanString(name).toLowerCase()
  if(userInfo.hasOwnProperty(cleanName)){
    const user = userInfo[cleanName]
    alert(`Имя пользователя ${name}\nВозраст пользователя ${user.age}\nГород в котором живет пользователь ${user.city}`)
  } else {
    alert('Данный пользователь не найден')
  }
}

function getUserButton(){
  const keys = Object.keys(userInfo);
  if (keys.length === 0) {
    alert('Пользователи не найдены');
    return;
  }
  let message = 'Список пользователей:\n';
  keys.forEach(key => {
    const user = userInfo[key];
    message += `Имя: ${key}, Возраст: ${user.age}, Город: ${user.city}\n`;
  });
  alert(message);
}
function deleteUserButton(){
   let key = prompt('Введите имя пользователя', 'Иван')
    if (key === null) return;
   let cleanKey = cleanString(key).toLowerCase();
  if (!cleanKey) {
  alert('Имя пользователя не может быть пустым');
  return;
}
 
  if(userInfo.hasOwnProperty(cleanKey)){
    delete userInfo[cleanKey];
    alert('Пользователь успешно удален')
  } else {
    alert('Такого пользователя не существует')
  }
}
