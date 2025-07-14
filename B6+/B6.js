function buildWrapper(tag){
    return function(text,attr = {}){
    let escapedText = text
    .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
    for(let key in attr){
        if (attr.hasOwnProperty(key)){
            attr[key] = attr[key] 
            .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
        }
    }
     
        let attrStr = '';
        for (let key in attr){
attrStr +=`${key} = '${attr[key]}'`
        }
        return `< ${tag} ${attrStr} > ${escapedText} </${tag}>`;
    }
}

var wrap = buildWrapper('H1')
console.log(wrap("СТИХИ",{align:"center",title:"M&M's"}))

