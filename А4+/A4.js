function palindrome(str){
  let cleanStr = str.toLowerCase().replace(/[^а-яa-z0-9]/g, '');
  function check(word){
   if (word.length <= 1) {
     return true
  }
  if (word.charAt(0) === word.charAt(word.length - 1)){
    return check(word.slice(1,-1))
  } else {
  return false
  }
}
  return check(cleanStr)
  }

const questions = prompt('Введите вашу строку', 'Шалаш')
if (palindrome(questions)){
alert('Ваша строка палиндром')}
else {
  alert ('Ваша строка не палиндром')
}


