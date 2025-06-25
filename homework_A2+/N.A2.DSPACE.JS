
let example = prompt('Введите ваше предложение', ' \n\t \n\t Для каждого человека понятие дома свое. Для кого-то это родительский очаг, наполненный воспоминаниями о детстве, запахом бабушкиных пирогов и голосами родных. \n\t \n\t')

function spaceDelete (str){
    let start = 0;
    let end = str.length - 1;
    let orgStart = start;
    let orgEnd = end;

    while (start <= end && str[start] === ' ' || str[start] === '\t' || str[start] === '\n'){
    start++  
    }
    if(start > end){
        console.log("Строка состоит только из пробелов");
        return '';
    }
   
    while (end >= start && str[end] === ' ' || str[end] === '\t' || str[end] === '\n'){
        end--;
    }
    if(start === orgStart && end === orgEnd){
        console.log('В вашей строке нет пробелов')
        return str
    }

    return str.substring(start, end + 1)
   
}
  alert( '\u{1F44B}' + spaceDelete(example) + '\u{1F44B}')