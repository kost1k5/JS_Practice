function ObjStorageFunc() {
  const storage = {};

  this.addValue = function(key, value) {
    storage[key] = value;
  };

  this.getValue = function(key) {
    return storage.hasOwnProperty(key) ? storage[key] : undefined;
  };

  this.deleteValue = function(key) {
    if (storage.hasOwnProperty(key)) {
      delete storage[key];
      return true;
    } else {
      return false;
    }
  };

  this.getKeys = function() {
    return Object.keys(storage);
  };
}

const drinks = new ObjStorageFunc();

function addDrinksButton() {
  function cleanString(str) {
    return str.trim().replace(/[^а-яА-Яa-zA-Z0-9\s]/g, '');
  }
  const keyRaw = prompt('Введите название напитка', 'Кола');
  const alcoRaw = prompt('Данный напиток алкогольный?', 'Нет');
  const recipeRaw = prompt('Введите рецепт напитка', 'Муха цикатуха волчья ягода и зуб дракона');
  const key = keyRaw ? cleanString(keyRaw) : '';
  const alco = alcoRaw ? cleanString(alcoRaw) : '';
  const recipe = recipeRaw ? cleanString(recipeRaw) : '';
  if (!key) {
    alert('Название напитка не может быть пустым');
    return;
  }
  if (!alco) {
    alert('Алкогольный статус не может быть пустым');
    return;
  }
  if (!recipe) {
    alert('Рецепт не может быть пустым');
    return;
  }
  drinks.addValue(key, { alco, recipe });
   alert(`Напиток "${key}" успешно добавлен.`);
  
}

function getDrinksInfoButton(){
    const key = prompt('Введите название напитка');
    const getDrinks = drinks.getValue(key)
    if (getDrinks){
       alert(`Напиток "${key}"\nАлкогольный: ${getDrinks.alco}\nРецепт: ${getDrinks.recipe}`);
    } else {
        alert(`Информация о "${key}" не найдена`)
    }
}

function listDrinksButton(){
    alert(drinks.getKeys()\n)
}

function deleteDrinksButton(){
const key = prompt('Какой напиток вы бы хотели удалить', "Кола")
if( drinks.deleteValue(key) === true){ 
    alert('Напиток удален из списка')
} else {
    alert('Напиток не найден')
}
}