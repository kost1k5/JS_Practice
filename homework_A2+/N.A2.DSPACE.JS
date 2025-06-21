
let example = prompt('Введите ваше предложение', ' \n\t \n\t Для каждого человека понятие дома свое. Для кого-то это родительский очаг, наполненный воспоминаниями о детстве, запахом бабушкиных пирогов и голосами родных. \n\t \n\t')

function spaceDelete (str){
    let start = 0;
    let end = str.length - 1;
    while (start <= end && str[start] === ' ' || str[start] === '\t' || str[start] === '\n'){
        start++;
    }
    while (end >= start && str[end] === ' ' || str[end] === '\t' || str[end] === '\n'){
        end--;
    }
    return str.substring(start, end + 1)
   
}
  alert( '\u{1F44B}' + spaceDelete(example) + '\u{1F44B}')