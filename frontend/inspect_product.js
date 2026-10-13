const fs=require('fs'); 
function extractArray(r,v){
  const m=`const ${v} = [`; 
  const si=r.indexOf(m); 
  if(si===-1)return null; 
  const ai=si+m.length-1; 
  let d=0,ins=false,esc=false; 
  for(let j=ai;j<r.length;j++){
    const c=r[j]; 
    if(esc){esc=false;continue;} 
    if(c==='\\'){esc=true;continue;} 
    if(c==='"'){ins=!ins;continue;} 
    if(!ins){if(c==='[')d++; else if(c===']'){d--;if(d===0)return r.substring(ai,j+1);}}
  } 
  return null;
} 
const r=fs.readFileSync('js/mock_db.js','utf8'); 
const p=JSON.parse(extractArray(r,'PRODUCTS')); 
console.log(p[0]);
