function ObjStorageFunc() {
  const drinkStorage = {};
this.hasKey = function(key){
return drinkStorage.hasOwnProperty(key)
}
  this.addValue = function(key, value) {
    drinkStorage[key] = value;
  };

  this.getValue = function(key) {
    return drinkStorage.hasOwnProperty(key) ? drinkStorage[key] : undefined;
  };

  this.deleteValue = function(key) {
    if (drinkStorage.hasOwnProperty(key)) {
      delete drinkStorage[key];
      return true;
    } else {
      return false;
    }
  };

  this.getKeys = function() {
    return Object.keys(drinkStorage);
  };
}

const drinks = new ObjStorageFunc();

function addDrinksButton() {
  const key = prompt('Введите название напитка', 'Кола');
  const alco = prompt('Данный напиток алкогольный?', 'Нет');
  const recipe = prompt('Введите рецепт напитка', 'Муха цикатуха волчья ягода и зуб дракона');
  if (drinks.hasKey(key)){
    console.log(`Напиток "${key}" уже существует`)
  }
  else if (key && key.trim() && alco && alco.trim() && recipe && recipe.trim()) {  
 drinks.addValue(key.trim(), { alco: alco.trim(), recipe: recipe.trim() });
    console.log(`Напиток "${key.trim()}" успешно добавлен.`);
  } else {
    console.log('Некорректные данные');
  }
}

function getDrinksInfoButton(){
    const key = prompt('Введите название напитка');
    if (drinks.hasKey(key)){
        console.log(`Напиток "${key}":`, drinks.getValue(key))
    } else {
        console.log(`Информация о "${key}" не найдена`)
    }
}

function listDrinksButton(){
    console.log(drinks.getKeys)
}

function deleteDrinksButton(){
const key = prompt('Какой напиток вы бы хотели удалить', "Кола")
if(drinks.hasKey(key)){
    drinks.deleteValue(key)
    console.log('Напиток удален из списка')
} else {
    console.log('Напиток не найден')
}
}