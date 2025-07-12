function countVowelsForEach(str) { 
  const vowels = 'аеёиоуыэюяАЕЁИОУЫЭЮЯ';
  let count = 0;
  str.split('').forEach(function(char) {
    if (vowels.includes(char)) {
      count++;
    }
  });
 
  return count;
}


function countVowelsFilter(str) { 
  const vowels = 'аеёиоуыэюяАЕЁИОУЫЭЮЯ';
  const filtered = str.split('').filter(function(char) {
    return vowels.includes(char);
  });
  let count = filtered.length;
  return count ;
}

function countVowelsReduce(str) { 
  const vowels = 'аеёиоуыэюяАЕЁИОУЫЭЮЯ';
  let count = str.split('').reduce(function(accumulator, char) {
    if (vowels.includes(char)) {
      return accumulator + 1;
    } else {
      return accumulator;
    }
  }, 0);

  return count;
}


const userInput = prompt('Введите вашу строку', 'Кот собака петух курица комар муха');
const vowelCountForEach = countVowelsForEach(userInput);
const vowelCountFilter = countVowelsFilter(userInput);
const vowelCountReduce = countVowelsReduce(userInput)

console.log(`Количество гласных букв (forEach, filter, reduce):  "${vowelCountForEach}" "${vowelCountFilter}"  "${vowelCountReduce}" `);