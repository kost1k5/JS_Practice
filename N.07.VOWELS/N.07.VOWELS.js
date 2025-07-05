
function countVowels(str) {
  const vowels = 'аеёиоуыэюяАЕЁИОУЫЭЮЯ';
  let count = 0;

  for (let i = 0; i < str.length; i++) {
    if (vowels.includes(str[i])) {
      count++;
    }
  }

  return count;
}
const userInput = prompt('Введите вашу строку', 'Кот собака петух курица комар муха');

const vowelCount = countVowels(userInput);
console.log(`Количество гласных букв: ${vowelCount}`);