function isPalindrome(str) {
  function cleanChar(ch) {
    ch = ch.toLowerCase();

    if (ch === "ё") return "е";

    if (ch === "ь" || ch === "ъ") return "";

    if (
      (ch >= "а" && ch <= "я") ||
      (ch >= "a" && ch <= "z") ||
      (ch >= "0" && ch <= "9")
    ) {
      return ch;
    }

    return "";
  }

  let cleaned = "";
  for (let i = 0; i < str.length; i++) {
    const c = cleanChar(str[i]);
    if (c) cleaned += c;
  }

  let left = 0;
  let right = cleaned.length - 1;

  while (left < right) {
    if (cleaned[left] !== cleaned[right]) {
      return false;
    }
    left++;
    right--;
  }

  return true;
}

const message = prompt("Введите строку");

if (isPalindrome(message)) {
  alert("Это палиндром");
} else {
  alert("Это не палиндром");
}
