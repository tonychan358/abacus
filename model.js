export const blank = (count = 5) => Array.from({length:count},()=>({upper:0,lower:0}));
export const value = rods => rods.reduce((sum,r,i)=>sum+(r.upper*5+r.lower)*10**(rods.length-1-i),0);

export function encode(number,count=5) {
  if(!Number.isInteger(number)||number<0||number>=10**count) throw new RangeError('數值超出算盤範圍');
  return String(number).padStart(count,'0').split('').map(d=>({upper:Math.floor(Number(d)/5),lower:Number(d)%5}));
}

// Index runs top-to-bottom. Groups always stay contiguous beside the beam.
export function move(rods,rod,deck,index,direction) {
  const next=rods.map(r=>({...r}));
  const target=deck==='lower' ? (direction==='in'? index+1:index) : (direction==='in'?2-index:1-index);
  next[rod][deck]=direction==='in'?Math.max(rods[rod][deck],target):Math.min(rods[rod][deck],target);
  return next;
}

export function question(kind,max=99,rng=Math.random) {
  const integer=(min,limit)=>min+Math.floor(rng()*(limit-min+1));
  if(kind==='mixed') kind=rng()<.5?'add':'subtract';
  if(kind==='set'||kind==='read') {
    const answer=integer(1,max); return {kind,answer,label:String(answer)};
  }
  if(kind==='add') {
    const a=integer(0,max-1),b=integer(1,max-a);
    return {kind,a,b,operator:'+',answer:a+b,label:`${a} + ${b}`};
  }
  const a=integer(1,max),b=integer(1,a);
  return {kind:'subtract',a,b,operator:'−',answer:a-b,label:`${a} − ${b}`};
}

export const createMatch=(target=5)=>({target,scores:[0,0],round:1,locked:false,winner:null});
export function submit(match,player,answer,target) {
  if(match.locked||match.winner!==null) return 'locked';
  if(answer!==target) return 'wrong';
  match.scores[player]++; match.locked=true;
  if(match.scores[player]>=match.target) {match.winner=player;return 'win';}
  return 'point';
}
export function nextRound(match) {
  if(match.winner!==null) return;
  match.round++; match.locked=false;
}
