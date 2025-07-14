
// поиск уникальных чисел в массиве возвращающий массив
// function unique(arr) {
//   let used = {};
//   let result = [];
//   for (let i = 0; i < arr.length; i++) {
//     let chislo = arr[i]; // просто число, а не массив
//     if (!(chislo in used)) { // если такого числа ещё не было
//       used[chislo] = true;   // отмечаем, что оно уже встречалось
//       result.push(chislo);   // добавляем в результат
//     }
//   }
//   return result;
// }

// console.log(unique([1, 2, 4, 5, 6, 7]));      // [1, 2, 4, 5, 6, 7]
// console.log(unique([1, 2, 2, 3, 4, 4, 5]));   // [1, 2, 3, 4, 5]


// поиск email адресов в тексте
// function extractEmails(str){
//   const emails = str.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
//  return emails || []
// }
// extractEmails("Пиши на почту example@mail.com или на другой адрес test.user@example.org.")


// подсчет количества повторений слов в строке

// function aaa (str){
//   let used = {};
//   let cleaned = str.toLowerCase().replace(/[^а-яёa-z0-9\s]/g);
//     let start = cleaned.split(/\s+/);
//   for (let i = 0; i < start.length; i++){
//     if (start[i] in used){
//       used[start[i]]++
//     } else { 
//       used[start[i]] = 1 
//     }
    
  
//   }
//     console.log(used)
    
// }
// aaa("Привет мир привет")


// проверка на анограмму 


// function isAnagram(str1, str2){
//   let slovo1 = str1.toLowerCase('').replace(/[^а-яёa-z0-9\s]/g, '');
//   let slovo2 = str2.toLowerCase('').replace(/[^а-яёa-z0-9\s]/g, '');
//   let sorted1 = slovo1.split('').sort().join('');
//   let sorted2 = slovo2.split('').sort().join('');
//   if ( sorted1 === sorted2){
//     console.log('Это анаграмма')
//   } else{ console.log('Это не анаграмма')}
   
 
  
// }
// isAnagram("дом", 'м')

// поиск самого длинного слова 


// function findLongestWord(str1){
// const words = str1.split(' ');
// let longest = '';
//   for (let word of words){
//     if (word.length > longest.length){
//       longest = word
//     }
//   }
//   return longest;
// }

// findLongestWord('почему ты не работаешь')
  



// первая буква заглавная


// function capitalizeWords(str) {
//   // Разбиваем строку на слова по пробелам
//   let words = str.split(' ');
  
//   // Создаём пустой массив для новых слов
//   let result = [];
  
//   // Проходим по каждому слову
//   for (let word of words) {
//     if (word.length > 0) {
//       // Берём первую букву и делаем её заглавной
//       let firstLetter = word[0].toUpperCase();
//       // Берём остальную часть слова и делаем её строчной
//       let rest = word.slice(1).toLowerCase();
//       // Склеиваем и добавляем в результат
//       result.push(firstLetter + rest);
//     }
//   }
  
//   // Объединяем все слова обратно в строку через пробел
//   return result.join(' ');
// }

// console.log(capitalizeWords("привет мир из javascript"));


// function sumNumbersInString(str) {
//   let words = str.split(' ');
//   let sum = 0;

//   for (let i = 0; i < words.length; i++) {
//     // Преобразуем слово в число
//     let num = parseInt(words[i], 10);//в parseInt желательно всегда указывать систему счисления, для обычных чисел это 10

//     // Проверяем, что num — число, а не NaN
//     if (!isNaN(num)) {
//       sum += num;
//     }
//   }

//   return sum;
// }

// console.log(sumNumbersInString("В 2023 году было 12 месяцев и 365 дней")); // 2400



// удаление дубликатов из массива 
//   function removeDuplicates(arr){
//   let result = []
//   for (let i = 0; i < arr.length; i++){
//    let used = arr[i]
//    if ( result.includes(used)){
//      continue
//    } else {
//      result.push(used)
//    }
//   }
//   return result
// }
// console.log(removeDuplicates([1, 2, 2, 2, 2, 2, 3, 4, 4, 4, 4, 5]))





// распаковка вложенных массивов с помощью .concat()

// function flattenArray(arr) {
//   let result = [ ]
//   for(let i = 0; i < arr.length; i++){
//     if (Array.isArray(arr[i])) {
//       // Рекурсивно "распаковываем" вложенный массив и добавляем элементы в result
//       result = result.concat(flattenArray(arr[i]));
//     } else {
//       // Добавляем элемент, если это не массив
//       result.push(arr[i]);
//     }
//   }
//   return result
// }
// flattenArray([1, [2, [3, 4], 5], 6])

// чистая функция для проверки текста на палиндром без массивов

// function isPalindrome(str) {
//   function cleanChar(ch) {
//     ch = ch.toLowerCase();
//     // Заменяем 'ё' на 'е'
//     if (ch === 'ё') return 'е';
//     // Убираем мягкий и твёрдый знак
//     if (ch === 'ь' || ch === 'ъ') return '';
//     // Можно проверить, что символ находится в диапазоне а-я или a-z или 0-9
//     if (
//       (ch >= 'а' && ch <= 'я') ||
//       (ch >= 'a' && ch <= 'z') ||
//       (ch >= '0' && ch <= '9')
//     ) {
//       return ch;
//     }

//     // Все остальные символы игнорируем
//     return '';
//   }

//   // Очистим строку, формируя новую строку без массивов
//   let cleaned = '';
//   for (let i = 0; i < str.length; i++) {
//     const c = cleanChar(str[i]);
//     if (c) cleaned += c;
//   }
//   let left = 0;
//   let right = cleaned.length - 1;

//   while (left < right) {
//     if (cleaned[left] !== cleaned[right]) {
//       return false;
//     }
//     left++;
//     right--;
//   }

//   return true;
// }
// const message = prompt('Введите строку');

// if (isPalindrome(message)) {
//   alert('Это палиндром');
// } else {
//   alert('Это не палиндром');
// }



// Облегченая версия и более понятная 

// function palindrome(str){
// const word = str.toLowerCase().replace(/[^а-яёa-z0-9]/gu);
// const mainWord = word.split('').reverse().join('');
// if(word === mainWord){
// alert('Это палиндром')
// } else{
// alert('Это не палиндром')}
// }
// const message = prompt('Введите строчку', "А роза упала на лапу Азора")

// palindrome(message)


// Проверка слова на анаграмму(чистая функция) без использования массивов

// function areAnagrams(str1, str2) {
//   let slovo1 = str1.toLowerCase().replace(/[^а-яёa-z0-9]/g, '').replace(/ё/g, 'е');
//   let slovo2 = str2.toLowerCase().replace(/[^а-яёa-z0-9]/g, '').replace(/ё/g, 'е');

//   if (slovo1.length !== slovo2.length) return false;

//   let text = {};
//   for (let i = 0; i < slovo1.length; i++) {
//     let used = slovo1[i];
//     text[used] = (text[used] || 0) + 1;
//   }

//   for (let i = 0; i < slovo2.length; i++) {
//     let use = slovo2[i];
//     if (text[use]) {
//       text[use]--;
//     } else {
//       return false;
//     }
//   }

//   for (let key in text) {
//     if (text[key] !== 0) return false;
//   }

//   return true;
// }

// areAnagrams('А роза упала на лапу Азора', 'Ароза упал ан алапу азор А')





// function countVowels(str) { 
//   const vowels = 'аеёиоуыэюяАЕЁИОУЫЭЮЯ';

//   // 1. Через forEach
//   let count = 0;
//   str.split('').forEach(function(char) {
//     if (vowels.includes(char)) {
//       count++;
//     }
//   });

//   // 2. Через filter
//   // filter возвращает массив гласных, длина которого — количество гласных
//   const filtered = str.split('').filter(function(char) {
//     return vowels.includes(char);
//   });
//   let count1 = filtered.length;

//   // 3. Через reduce
//   let count2 = str.split('').reduce(function(accumulator, char) {
//     if (vowels.includes(char)) {
//       return accumulator + 1;
//     } else {
//       return accumulator;
//     }
//   }, 0);

//   return [count, count1, count2];
// }



// принимает число-модуль и возвращает другую функцию. Вторая функция принимает диапазон и выводит в консоль числа из этого диапазона, которые делятся на модуль (или не делятся, в зависимости от параметра).
// если divisible == true возвращает числа без остатка 
// function aaa(modul){
//   return function(start, end, divisible){
//     for(let i = start; i <= end; i++){
//       if(divisible){
//         if( i % modul === 0){
//           console.log(i)
//         }
//       } else{
//         if ( i % modul !== 0){
//           console.log(i)
//         }   
//       }
//     }
//   }
// }



// функция рандомного числа 
// function randomDiap(n,m){ //указываем диапазон
// return Math.floor(
//     Math.random() * (m - n + 1)) + n;
// }

