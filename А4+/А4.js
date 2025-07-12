function palindrome(str){
  let word = str.toLowerCase().replace(/[^а-яa-z0-9]/g, '');
   if (word.length <= 1) {
    return true;
  }
  if (word.charAt(0) === word.charAt(word.length - 1)){
    return palindrome(word.slice(1,-1))
  } else {
  return false
  }
}
palindrome('шала')