const $=s=>document.querySelector(s),key='circolone-aperitivo-v1',positions=['In alto a sinistra','In alto a destra','In basso a sinistra','In basso a destra'];
let items=Array.from({length:4},()=>({name:'',desc:'',price:''}));try{const v=JSON.parse(localStorage.getItem(key));if(Array.isArray(v)&&v.length===4&&v.every(x=>x&&['name','desc','price'].every(k=>typeof x[k]==='string')))items=v}catch(e){}
items.forEach((item,i)=>{const c=document.createElement('div');c.className='dish';c.innerHTML=`<div class="slot-label">0${i+1} · ${positions[i]}</div><div class="row"><label>Nome del piatto<input data-i="${i}" data-k="name" maxlength="65" placeholder="Nome della proposta"></label><label>Prezzo al pezzo €<input data-i="${i}" data-k="price" type="number" min="0" max="999" step="0.01" placeholder="0,00"></label></div><label class="desc">Descrizione · facoltativa<textarea data-i="${i}" data-k="desc" rows="2" maxlength="180" placeholder="Ingredienti o descrizione"></textarea></label>`;c.querySelectorAll('[data-k]').forEach(el=>el.value=item[el.dataset.k]);$('#fields').append(c)});
const canvas=$('#preview'),ctx=canvas.getContext('2d'),sheet=$('#sheet'),sc=sheet.getContext('2d');canvas.width=1480;canvas.height=1050;sheet.width=2970;sheet.height=2100;
const art=new Image();let ready=false,valid=false;
const burgundy='#8D1926';
function round(x,y,w,h,r=20){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
function write(s,x,y,size,color=burgundy,align='center'){ctx.font=`${size}px Bebas`;ctx.fillStyle=color;ctx.textAlign=align;ctx.fillText(s,x,y)}
function wrap(s,width,size){ctx.font=`${size}px Bebas`;const out=[];for(const para of s.split(/\r?\n/)){let line='';for(const word of para.trim().split(/\s+/)){if(!word)continue;if(line&&ctx.measureText(line+' '+word).width>width){out.push(line);line=''}for(const ch of word){if(ctx.measureText(line+ch).width>width&&line){out.push(line);line=''}line+=ch}line+=' '}out.push(line.trim())}return out}
const layoutVersion='3.0';
function overlaps(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}
function geometry(p){return {box:{x:p.x+24,y:p.y+22,w:p.w-48,h:p.h-44},obstacles:[{x:p.bx-16,y:p.by-16,w:192,h:132},{x:494,y:476,w:492,h:162}]}}
function inkMetrics(str,size){ctx.font=`${size}px Bebas`;ctx.textAlign='left';const m=ctx.measureText(str);return {left:m.actualBoundingBoxLeft||0,right:m.actualBoundingBoxRight||m.width,ascent:m.actualBoundingBoxAscent||size*.85,descent:m.actualBoundingBoxDescent||size*.1,width:Math.max(m.width,(m.actualBoundingBoxLeft||0)+(m.actualBoundingBoxRight||0))}}
function lineSpan(box,obstacles,y,h){let spans=[[box.x,box.x+box.w]];for(const o of obstacles){if(y>=o.y+o.h||y+h<=o.y)continue;spans=spans.flatMap(([l,r])=>{if(o.x>=r||o.x+o.w<=l)return [[l,r]];const out=[];if(o.x>l)out.push([l,Math.min(r,o.x)]);if(o.x+o.w<r)out.push([Math.max(l,o.x+o.w),r]);return out})}return spans.sort((a,b)=>(b[1]-b[0])-(a[1]-a[0]))[0]}
function fit(item,p){
 const {box,obstacles}=geometry(p);
 for(let size=67;size>=40;size--){
  const ds=Math.max(27,Math.round(size*.51));let best=null;
  for(let start=box.y;start<=box.y+box.h-40;start+=4){let y=start,rows=[],failed=false;
   for(const [content,fontSize,gap]of [[item.name.trim()||'NOME DEL PIATTO',size,0],[item.desc.trim(),ds,12]]){
    if(!content)continue;if(gap)y+=gap;
    const ref=inkMetrics('ÁÉÌÒÙgj',fontSize),lineHeight=Math.max(fontSize*1.1,ref.ascent+ref.descent+6);
    for(const paragraph of content.split(/\r?\n/)){
     let words=paragraph.trim().split(/\s+/).filter(Boolean);if(!words.length){y+=lineHeight;continue}
     while(words.length){const span=lineSpan(box,obstacles,y,lineHeight);if(!span||span[1]-span[0]<70||y+lineHeight>box.y+box.h){failed=true;break}
      let line='';while(words.length){const next=line?line+' '+words[0]:words[0];if(inkMetrics(next,fontSize).width>span[1]-span[0]-10)break;line=next;words.shift()}
      if(!line){failed=true;break}
      const m=inkMetrics(line,fontSize),x=span[0]+(span[1]-span[0]-(m.left+m.right))/2+m.left,baseline=y+ref.ascent;
      const bounds={x:x-m.left,y:baseline-m.ascent,w:m.left+m.right,h:m.ascent+m.descent};
      if(obstacles.some(o=>overlaps(bounds,o))||bounds.x<box.x||bounds.x+bounds.w>box.x+box.w||bounds.y<box.y||bounds.y+bounds.h>box.y+box.h){failed=true;break}
      rows.push({text:line,size:fontSize,x,y:baseline,bounds});y+=lineHeight;
     }if(failed)break;
    }if(failed)break;
   }
   if(!failed){const score=Math.abs((start+y)/2-(box.y+box.h/2));if(!best||score<best.score)best={rows,score,fits:true,box,obstacles}}
  }if(best)return best;
 }
 return {rows:[],fits:false,box,obstacles};
}
function ornate(inset){const x=inset,y=inset,w=1480-inset*2,h=1050-inset*2,r=38;ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w-r,y+r,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w-r,y+h-r,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x+r,y+h-r,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x+r,y+r,x+r,y);ctx.closePath();ctx.stroke()}
function draw(){ctx.fillStyle='white';ctx.fillRect(0,0,1480,1050);ctx.strokeStyle=burgundy;ctx.lineWidth=3;ornate(31);ctx.lineWidth=2;ornate(42);
// Approved title and original logo remain fixed graphic elements; the proposals are live text.
if(ready){const title='L’APERITIVO DI OGGI';let size=122;ctx.font=`${size}px Captain`;while(ctx.measureText(title).width>1210&&size>60){size--;ctx.font=`${size}px Captain`}ctx.textAlign='center';ctx.fillStyle='#252626';ctx.fillText(title,746,166);ctx.fillStyle=burgundy;ctx.fillText(title,740,160);ctx.strokeStyle=burgundy;ctx.lineWidth=9;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(335,197);ctx.quadraticCurveTo(740,171,1145,197);ctx.stroke();ctx.lineCap='butt'}
const panels=[{x:58,y:235,w:674,h:320,cx:395,cy:405,bx:73,by:250},{x:748,y:235,w:674,h:320,cx:1085,cy:405,bx:1246,by:250},{x:58,y:574,w:674,h:335,cx:395,cy:728,bx:73,by:794},{x:748,y:574,w:674,h:335,cx:1085,cy:728,bx:1246,by:794}];let fits=true;
panels.forEach((p,i)=>{ctx.strokeStyle=burgundy;ctx.lineWidth=4;round(p.x,p.y,p.w,p.h);ctx.stroke();const item=items[i],plan=fit(item,p);fits=fits&&plan.fits;
// Centered text gets a protected zone between corner badges and the central logo.
if(plan.fits){ctx.save();ctx.beginPath();ctx.rect(plan.box.x,plan.box.y,plan.box.w,plan.box.h);ctx.clip();ctx.beginPath();ctx.rect(0,0,1480,1050);for(const o of plan.obstacles)ctx.rect(o.x,o.y,o.w,o.h);ctx.clip('evenodd');for(const row of plan.rows)write(row.text,row.x,row.y,row.size,burgundy,'left');ctx.restore();}else write('ABBREVIA IL TESTO',p.cx,p.cy,35);
ctx.fillStyle=burgundy;round(p.bx,p.by,160,100,18);ctx.fill();const price=item.price.trim()!==''&&Number.isFinite(Number(item.price))?'€ '+Number(item.price).toLocaleString('it-IT',{minimumFractionDigits:2,maximumFractionDigits:2}):'€ —';write(price,p.bx+80,p.by+48,43,'#fff');write('AL PEZZO',p.bx+80,p.by+81,27,'#fff');});
ctx.fillStyle='white';ctx.fillRect(510,492,460,128);if(ready)ctx.drawImage(art,520,493,450,130,515,492,450,130);
write('LE NOSTRE TAPAS DALLE 18:00 ALLE 20:00',740,981,48);ctx.strokeStyle=burgundy;ctx.lineWidth=3;for(const [a,b]of [[90,195],[1285,1390]]){ctx.beginPath();ctx.moveTo(a,960);ctx.lineTo(b,960);ctx.stroke()}
sc.fillStyle='white';sc.fillRect(0,0,2970,2100);for(const x of [5,1485])for(const y of [0,1050])sc.drawImage(canvas,x,y);sc.strokeStyle='#aaa';sc.lineWidth=1;sc.setLineDash([8,10]);sc.beginPath();sc.moveTo(1485,0);sc.lineTo(1485,2100);sc.moveTo(0,1050);sc.lineTo(2970,1050);sc.stroke();sc.setLineDash([]);
const complete=items.every(x=>x.name.trim()&&x.price.trim()!==''&&Number.isFinite(Number(x.price))&&Number(x.price)>=0&&Number(x.price)<=999);valid=ready&&complete&&fits;$('#download').disabled=!valid;const msg=!ready?'Caricamento della grafica…':!fits?'Un testo è troppo lungo: abbrevialo per mantenere tutto leggibile nel riquadro.':!complete?'Inserisci il nome e il prezzo di tutte e quattro le proposte.':'Pronto: il PDF contiene un A4 orizzontale con quattro copie identiche.';$('#notice').textContent=msg;$('#status').textContent=msg;$('#notice').classList.toggle('error',!fits);
}
function save(){try{localStorage.setItem(key,JSON.stringify(items))}catch(e){$('#status').textContent+=' Salvataggio nel browser non disponibile.'}}
$('#fields').addEventListener('input',e=>{if(e.target.dataset.k){items[Number(e.target.dataset.i)][e.target.dataset.k]=e.target.value;draw();save()}});
$('#clear').onclick=()=>{if(confirm('Svuotare tutte e quattro le proposte?')){items=Array.from({length:4},()=>({name:'',desc:'',price:''}));document.querySelectorAll('[data-k]').forEach(el=>el.value='');draw();save()}};
function pdfBlob(){const raw=atob(canvas.toDataURL('image/jpeg',.98).split(',')[1]),jpeg=Uint8Array.from(raw,c=>c.charCodeAt(0)),enc=new TextEncoder(),parts=[],offsets=[0];let len=0;const add=v=>{const b=typeof v==='string'?enc.encode(v):v;parts.push(b);len+=b.length};const obj=(id,s)=>{offsets[id]=len;add(`${id} 0 obj\n${s}\nendobj\n`)};const mm=n=>n*72/25.4;add('%PDF-1.4\n');obj(1,'<< /Type /Catalog /Pages 2 0 R >>');obj(2,'<< /Type /Pages /Kids [3 0 R] /Count 1 >>');obj(3,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${mm(297)} ${mm(210)}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`);offsets[4]=len;add(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width 1480 /Height 1050 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);add(jpeg);add('\nendstream\nendobj\n');let stream='';for(const x of [.5,148.5])for(const y of [0,105])stream+=`q\n${mm(148)} 0 0 ${mm(105)} ${mm(x)} ${mm(y)} cm\n/Im0 Do\nQ\n`;stream+=`0.7 G 0.3 w [2 3] 0 d\n${mm(148.5)} 0 m ${mm(148.5)} ${mm(210)} l S\n0 ${mm(105)} m ${mm(297)} ${mm(105)} l S\n`;obj(5,`<< /Length ${enc.encode(stream).length} >>\nstream\n${stream}endstream`);const pos=len;add('xref\n0 6\n0000000000 65535 f \n');for(let i=1;i<=5;i++)add(`${String(offsets[i]).padStart(10,'0')} 00000 n \n`);add(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${pos}\n%%EOF`);return new Blob(parts,{type:'application/pdf'})}
$('#download').onclick=()=>{if(!valid)return;const url=URL.createObjectURL(pdfBlob()),a=document.createElement('a');a.href=url;a.download='Circolone-aperitivo-A4.pdf';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000)};
async function init(){try{await Promise.all([document.fonts.load('50px Bebas'),document.fonts.load('100px Captain')]);await new Promise((resolve,reject)=>{art.onload=resolve;art.onerror=reject;art.src='grafica.png'});ready=true;draw()}catch(e){$('#notice').textContent='Impossibile caricare font o grafica: ricarica la pagina.';$('#download').disabled=true}}
const versionLabel=document.createElement('p');versionLabel.className='hint';versionLabel.textContent='Impaginazione 3.0';$('#fields').before(versionLabel);init();
