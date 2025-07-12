function isValidName(name) {
  const regex = /^[a-zA-Zа-яА-ЯёЁ\- ]{2,20}$/;
  return name !== null && regex.test(name.trim());
}
function promptForName(fieldName) {
  let value;
  do {
    value = prompt(`Введите ваше ${fieldName}:`);
    if (value === null || value.trim() === "") {
      alert(`Вы не ввели ${fieldName}! Пожалуйста, введите.`);
      continue;
    }
    if (!isValidName(value)) {
      alert(`Используются запрещённые символы или длина не от 2 до 20 символов в поле "${fieldName}". Попробуйте снова.`);
      continue;
    }
    break; 
  } while (true);
  return value.trim();
}


var surName = promptForName('фамилию');
var name = promptForName('имя');
var patronymic = promptForName('отчество');
let age;
while (true) {
    let ageStr = prompt('Введите ваш возраст:');
    age = parseInt(ageStr);

    if (isNaN(age)) {
        console.log('Возраст введен некорректно. Пожалуйста, введите число.');
        continue;
    }

    if (age > 102) {
        console.log('Вы видимо бессмертный, попробуйте еще раз');
        continue;
    } else if (age < 1) {
        console.log('Вы такой маленький, подрастешь — подходи позже');
        continue;
    }

    
    break;
}
        

var gender = confirm("Выберите 'ОК', если мужской, и 'Отмена', если женский");

        if (gender) {
            genderText = 'Мужской';
        } else {
            genderText = 'Женский';
        }

        var isPension = "Нет";
        if  (gender && age >= 60) {
            isPension = "Да";
        } else if  (!gender && age >= 55 ) { isPension = "Да";
}

        alert(
            'Ваше ФИО: ' + surName + ' ' + name + ' ' + patronymic + '\n' +
            'Ваш возраст в годах: ' + age + '\n' +
            'Ваш возраст в днях: ' + (age * 365) + '\n' +
            'Через 5 лет вам будет: ' + (age + 5) + '\n' +
            'Ваш пол: ' + genderText + '\n' +
            'Вы на пенсии: ' + isPension
        );
  