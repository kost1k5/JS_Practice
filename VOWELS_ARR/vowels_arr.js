function countVowels(str) { 
  const vowels = 'аеёиоуыэюяАЕЁИОУЫЭЮЯ';
  let count = 0;
  str.split('').forEach(function(char) {
    if (vowels.includes(char)) {
      count++;
    }
  });
 
  const filtered = str.split('').filter(function(char) {
    return vowels.includes(char);
  });
  let count1 = filtered.length;

  let count2 = str.split('').reduce(function(accumulator, char) {
    if (vowels.includes(char)) {
      return accumulator + 1;
    } else {
      return accumulator;
    }
  }, 0);

  return [count, count1, count2];
}
const userInput = prompt('Введите вашу строку', 'Кот собака петух курица комар муха');
const vowelCount = countVowels(userInput);
console.log('Количество гласных букв (forEach, filter, reduce): ' + vowelCount.join(', '));