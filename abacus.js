import {blank,value,encode,move} from './model.js';
let serial=0;
const places=['個','十','百','千','萬'];

export function createAbacus(host,{count=5,onChange=()=>{},readonly=false,highlight=null}={}) {
  const id=`abacus-${++serial}`;
  let rods=blank(count),locked=readonly,animations=[];
  const pointers=new Map();
  host.innerHTML=`<svg class="abacus" viewBox="0 0 640 440" role="group" aria-label="中國算盤，上二珠下五珠">
    <defs>
      <linearGradient id="${id}-wood" x2="0" y2="1"><stop stop-color="#805239"/><stop offset=".47" stop-color="#5d3928"/><stop offset="1" stop-color="#432c21"/></linearGradient>
      <linearGradient id="${id}-bead" x2="0" y2="1"><stop stop-color="#a45b40"/><stop offset=".34" stop-color="#7c3f2b"/><stop offset="1" stop-color="#482a21"/></linearGradient>
      <linearGradient id="${id}-active" x2="0" y2="1"><stop stop-color="#d79763"/><stop offset=".4" stop-color="#ba7047"/><stop offset="1" stop-color="#8c472d"/></linearGradient>
      <marker id="${id}-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#b06b20"/></marker>
    </defs>
    <rect x="18" y="18" width="604" height="389" rx="13" fill="url(#${id}-wood)"/>
    <rect x="38" y="38" width="564" height="349" rx="3" fill="#eee7d6"/>
    <g class="rod-layer"></g>
    <rect x="29" y="151" width="582" height="24" rx="2" fill="url(#${id}-wood)"/>
    <path d="M37 155H602" stroke="#b68a61" opacity=".6"/>
    <g class="bead-layer"></g><g class="place-layer"></g><g class="motion-layer" pointer-events="none" aria-hidden="true"></g>
  </svg>`;
  const svg=host.querySelector('svg'),beads=[];
  const xAt=i=>count===1?320:100+i*440/(count-1);
  host.querySelector('.rod-layer').innerHTML=rods.map((r,i)=>`<rect class="rod-highlight" x="${xAt(i)-43}" y="39" width="86" height="347" rx="10" fill="#d1b866" opacity="${i===highlight?.rod?.[0]?'.25':'0'}"/><rect x="${xAt(i)-3}" y="38" width="6" height="349" rx="3" fill="#967955"/><path d="M${xAt(i)-1} 38V387" stroke="#d1b78b"/>`).join('');
  const layer=host.querySelector('.bead-layer');
  rods.forEach((r,rod)=>{
    for(const deck of ['upper','lower']) for(let index=0;index<(deck==='upper'?2:5);index++) {
      const g=document.createElementNS('http://www.w3.org/2000/svg','g');
      g.setAttribute('class','bead');g.setAttribute('role','button');g.setAttribute('tabindex',locked?'-1':'0');
      g.dataset.rod=rod;g.dataset.deck=deck;g.dataset.index=index;
      const w=count<=3?98:78;
      g.innerHTML=`<path class="bead-shape" d="M${-w/2} 0 Q${-w/2+5} -13 0 -14 Q${w/2-5} -13 ${w/2} 0 Q${w/2-5} 13 0 14 Q${-w/2+5} 13 ${-w/2} 0Z"/><path d="M${-w*.32} -5 Q0 -12 ${w*.32} -5" fill="none" stroke="#e9b488" stroke-width="1.4" opacity=".35"/><rect class="bead-hit" x="${-w/2-4}" y="-16" width="${w+8}" height="32" fill="transparent"/>`;
      layer.append(g);beads.push({g,rod,deck,index});
    }
  });
  host.querySelector('.place-layer').innerHTML=rods.map((r,i)=>`<text x="${xAt(i)}" y="430" text-anchor="middle" class="place-label">${places[count-1-i]}位</text>`).join('');
  function active(rod,deck,index) {return deck==='upper'?index>=2-rods[rod].upper:index<rods[rod].lower;}
  const selectedAt=(deck,index,total)=>deck==='upper'?index>=2-total:index<total;
  const yAt=(deck,index,total)=>deck==='upper'?(selectedAt(deck,index,total)?105:54)+index*32:(selectedAt(deck,index,total)?190:236)+index*32;
  function paint() {
    for(const {g,rod,deck,index} of beads) {
      const selected=active(rod,deck,index);
      const y=deck==='upper'?(selected?105:54)+index*32:(selected?190:236)+index*32;
      g.setAttribute('transform',`translate(${xAt(rod)} ${y})`);
      g.querySelector('.bead-shape').setAttribute('fill',`url(#${id}-${selected?'active':'bead'})`);
      g.setAttribute('aria-pressed',String(selected));g.setAttribute('aria-disabled',String(locked));
      g.setAttribute('aria-label',`${places[count-1-rod]}位${deck==='upper'?'上珠，值五':'下珠，值一'}，第${index+1}珠，${selected?'已靠梁':'未靠梁'}`);
      g.setAttribute('tabindex',locked?'-1':'0');
    }
  }
  function change(rod,deck,index,direction) {
    if(locked)return;
    svg.setAttribute('data-scripted','false');
    cancelAnimations();clearCue();
    rods=move(rods,rod,deck,index,direction);paint();onChange(value(rods),rods);
  }
  function local(event) {
    const matrix=svg.getScreenCTM();
    return matrix?new DOMPoint(event.clientX,event.clientY).matrixTransform(matrix.inverse()):null;
  }
  svg.addEventListener('pointerdown',e=>{
    const g=e.target.closest('.bead');if(!g||locked||e.button>0)return;
    const p=local(e);if(!p)return;
    e.preventDefault();g.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId,{g,y:p.y,rod:Number(g.dataset.rod),deck:g.dataset.deck,index:Number(g.dataset.index)});
    g.classList.add('is-held');
  });
  svg.addEventListener('pointerup',e=>{
    const p=pointers.get(e.pointerId);if(!p)return;
    pointers.delete(e.pointerId);p.g.classList.remove('is-held');
    const end=local(e);if(!end||locked)return;
    const dy=end.y-p.y;
    const direction=Math.abs(dy)<10?(active(p.rod,p.deck,p.index)?'out':'in'):(p.deck==='upper'?(dy>0?'in':'out'):(dy<0?'in':'out'));
    change(p.rod,p.deck,p.index,direction);
  });
  for(const event of ['pointercancel','lostpointercapture']) svg.addEventListener(event,e=>{
    const p=pointers.get(e.pointerId);if(p){p.g.classList.remove('is-held');pointers.delete(e.pointerId);}
  });
  function cancelGestures() {
    const pending=[...pointers.entries()];pointers.clear();
    for(const [id,p] of pending){p.g.classList.remove('is-held');if(p.g.hasPointerCapture(id))p.g.releasePointerCapture(id);}
  }
  function cancelAnimations(){for(const animation of animations)animation.cancel();animations=[];}
  function clearCue(){for(const {g} of beads)g.classList.remove('is-demo-target');host.querySelector('.motion-layer').innerHTML='';}
  function setState(state,{duration=0}={}) {
    if(!Array.isArray(state)||state.length!==count||state.some(r=>!r||!Number.isInteger(r.upper)||r.upper<0||r.upper>2||!Number.isInteger(r.lower)||r.lower<0||r.lower>5))throw new RangeError('無效算盤狀態');
    cancelGestures();cancelAnimations();
    svg.setAttribute('data-scripted','true');
    const old=rods;rods=state.map(r=>({...r}));paint();
    const reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if(duration>0&&!reduced)for(const {g,rod,deck,index} of beads){
      const from=yAt(deck,index,old[rod][deck]),to=yAt(deck,index,rods[rod][deck]);
      if(from!==to&&g.animate){
        const animation=g.animate([{transform:`translate(${xAt(rod)}px, ${from}px)`},{transform:`translate(${xAt(rod)}px, ${to}px)`}],{duration,easing:'cubic-bezier(.35,0,.25,1)'});
        animations.push(animation);
      }
    }
    onChange(value(rods),rods);
  }
  function showMoves(moves) {
    clearCue();let arrows='';
    for(const move of moves){
      let arrow='';
      for(const {g,rod,deck,index} of beads)if(rod===move.rod&&deck===move.deck&&selectedAt(deck,index,move.from)!==selectedAt(deck,index,move.to)){
        g.classList.add('is-demo-target');
        if(!arrow){const from=yAt(deck,index,move.from),to=yAt(deck,index,move.to),x=xAt(rod)+(count<=3?59:48);arrow=`<path d="M${x} ${from}V${to}" fill="none" stroke="#b06b20" stroke-width="3" marker-end="url(#${id}-arrow)"/><circle cx="${x}" cy="${from}" r="3" fill="#b06b20"/>`;}
      }
      arrows+=arrow;
    }
    host.querySelector('.motion-layer').innerHTML=arrows;api.highlight(moves.map(m=>m.rod));
  }
  svg.addEventListener('keydown',e=>{
    const g=e.target.closest('.bead');if(!g||locked)return;
    const rod=Number(g.dataset.rod),deck=g.dataset.deck,index=Number(g.dataset.index);
    let direction;
    if(e.key==='Enter'||e.key===' ')direction=active(rod,deck,index)?'out':'in';
    if(e.key==='ArrowUp')direction=deck==='upper'?'out':'in';
    if(e.key==='ArrowDown')direction=deck==='upper'?'in':'out';
    if(direction){e.preventDefault();change(rod,deck,index,direction);}
  });
  paint();
  const api={
    get value(){return value(rods);},
    setValue(n){setState(encode(n,count));clearCue();},
    setState,showMoves,showMove(move){showMoves(move?[move]:[]);},clearCue,cancelAnimations,
    pauseAnimations(){for(const a of animations)a.pause?.();},
    resumeAnimations(){for(const a of animations)if(a.playState==='paused')a.play?.();},
    clear(){setState(blank(count));clearCue();},
    lock(v=true){if(v||locked!==v)cancelGestures();locked=v;paint();},
    highlight(rod){const selected=new Set(Array.isArray(rod)?rod:[rod]);host.querySelectorAll('.rod-highlight').forEach((el,i)=>el.setAttribute('opacity',selected.has(i)?'.25':'0'));},
  };
  return api;
}
