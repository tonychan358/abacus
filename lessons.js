import {encode,value} from './model.js';

// Each frame is one teaching step. Bead groups within that step move together.
export function compileLesson(definition) {
  let rods=encode(definition.initial??0,5);
  const frames=[{rods:rods.map(r=>({...r})),moves:[],amount:0,label:definition.initialLabel??'原數就緒',text:definition.start??'直接看原數，按播放看整個運算。',equation:definition.initialEquation??String(value(rods)),n:value(rods)}];
  for(const action of definition.actions??[]) {
    const before=rods;
    let next;
    if(Object.hasOwn(action,'target'))next=encode(action.target,5);
    else {
      next=rods.map(r=>({...r}));
      for(const {rod,deck,delta} of action.moves??[action]){
        if(!Number.isInteger(rod)||rod<0||rod>=5||!['upper','lower'].includes(deck)||!Number.isInteger(delta)||delta===0)throw new RangeError('無效的撥珠動作');
        const to=next[rod][deck]+delta;
        if(to<0||to>(deck==='upper'?2:5))throw new RangeError('撥珠超出珠數');
        next[rod][deck]=to;
      }
    }
    const moves=[];
    for(let rod=0;rod<5;rod++)for(const deck of ['upper','lower']){
      const from=before[rod][deck],to=next[rod][deck],delta=to-from;
      if(delta)moves.push({rod,deck,from,to,delta,amount:delta*(deck==='upper'?5:1)*10**(4-rod)});
    }
    rods=next;
    frames.push({rods:rods.map(r=>({...r})),moves,amount:value(rods)-value(before),label:action.label??'同步撥珠',text:action.text??'所有高亮算珠同時移動。',equation:action.equation??String(value(rods)),n:value(rods)});
  }
  return {...definition,frames};
}

export const lessons=[
  {
    id:'intro',title:'算盤速讀',tag:'珠值・位值・清零',initial:7,initialLabel:'一眼看出 7',initialEquation:'7 = 5 + 2',
    description:'上珠值 5、下珠值 1；靠梁才計數。由右至左是個、十、百位。',
    principle:'珠值 × 位值；例如 128 = 100 + 20 + 8',noteTitle:'三個規則，就能開始。',
    note:'每檔上二下五。示範用標準十進位表示；清零就是全部離梁。可以直接試撥，或按播放看位值例子。',
    start:'這是 7：個位一顆上珠、兩顆下珠靠梁。',
    actions:[{target:128,label:'換一個數：128',equation:'128 = 100 + 20 + 8',text:'百位 1、十位 2、個位 8。各檔同時就位，直接讀出 128。'}],
  },
  {
    id:'direct',title:'直接加法：12 + 2',tag:'整組撥入',initial:12,initialLabel:'原數 12',
    description:'原數直接就緒；個位兩珠一起撥入，一次完成加 2。',
    principle:'12 + 2 = 14',noteTitle:'能直接撥，就整組撥。',
    note:'個位第三、第四顆下珠同時靠梁；原有兩珠和十位不動。',start:'12 已撥好。按播放，直接看兩顆下珠一起加入。',
    actions:[{target:14,label:'兩珠一起加入',equation:'12 + 2 = 14',text:'個位兩顆下珠同時向上靠梁，直接由 12 變成 14。'}],
  },
  {
    id:'five',title:'補五加法：3 + 4',tag:'同檔交換',initial:3,initialLabel:'原數 3',
    description:'用 +5 −1 表示 +4；上珠加入與下珠退出同步完成。',
    principle:'3 + 4 = 3 + (5 − 1) = 7',noteTitle:'加五、減一，同時做。',
    note:'4 與 1 合成 5。原理解說留在算式，盤面直接由 3 變成 7。',start:'3 已撥好：個位三顆下珠靠梁。',
    actions:[{target:7,label:'同步加五、減一',equation:'3 + (5 − 1) = 7',text:'個位一顆上珠靠梁，同時一顆下珠離梁，直接得到 7。'}],
  },
  {
    id:'carry',title:'進位加法：7 + 4',tag:'先進位，再去補數',initial:7,initialLabel:'原數 7：一上二下',initialEquation:'7 = 5 + 2',
    description:'+4 = +10 −6。先十位進一，再個位去六；去六的上、下珠同時退出。',
    principle:'7 + 4 = 7 + 10 − 6 = 11',noteTitle:'先加十，再減六。',
    note:'第一步：十位一顆下珠靠梁，7 → 17。第二步：個位一顆上珠、一顆下珠同時離梁，17 → 11。',start:'7 已直接撥好。先看十位進一，再看個位去六。',
    actions:[
      {target:17,label:'第一步：十位進一',equation:'7 + 10 = 17',text:'十位一顆下珠靠梁，加 10；個位仍保留原來的 7。'},
      {target:11,label:'第二步：個位去六',equation:'17 − 5 − 1 = 11',text:'個位一顆上珠、一顆下珠同時離梁，一次減 6，得到 11。'},
    ],
  },
  {
    id:'borrow',title:'退位減法：11 − 4',tag:'先退位，再補六',initial:11,initialLabel:'原數 11',
    description:'−4 = −10 +6。先十位退一，再個位補六；補六的上、下珠同時加入。',
    principle:'11 − 4 = 11 − 10 + 6 = 7',noteTitle:'先減十，再加六。',
    note:'第一步：十位一顆下珠離梁，11 → 1。第二步：個位一顆上珠、一顆下珠同時靠梁，1 → 7。',start:'11 已撥好。先看十位退一，再看個位補六。',
    actions:[
      {target:1,label:'第一步：十位退一',equation:'11 − 10 = 1',text:'十位一顆下珠離梁，減 10；個位的一顆下珠保留。'},
      {target:7,label:'第二步：個位補六',equation:'1 + 5 + 1 = 7',text:'個位一顆上珠、一顆下珠同時靠梁，一次加 6，得到 7。'},
    ],
  },
  {
    id:'tens-add',title:'兩位數加法：37 + 55',tag:'先十位，再個位進位',initial:37,initialLabel:'原數 37',
    description:'先加 50，再加 5；個位加 5 用先進十、再減五完成。',
    principle:'37 + 55 = 37 + 50 + 10 − 5 = 92',noteTitle:'把前面的方法連起來。',
    note:'先在十位加一顆上珠：37 → 87。再處理個位 +5：先十位加一顆下珠到 97，再個位退一顆上珠到 92。',start:'37 已撥好。把 55 分成 50 和 5，先算十位。',
    actions:[
      {target:87,label:'第一步：十位加五十',equation:'37 + 50 = 87',text:'十位一顆上珠靠梁，加 50；個位的 7 保留。'},
      {target:97,label:'第二步：個位加五，先進十',equation:'87 + 10 = 97',text:'個位 +5 改用 +10 −5。先在十位加一顆下珠，進一個十。'},
      {target:92,label:'第三步：個位減五',equation:'97 − 5 = 92',text:'個位一顆上珠離梁，減 5，完成 37 + 55 = 92。'},
    ],
  },
  {
    id:'tens-subtract',title:'兩位數減法：64 − 38',tag:'十位補五・個位退位',initial:64,initialLabel:'原數 64',
    description:'先減 30，用補五；再減 8，先退十、再用補五加 2。',
    principle:'64 − 38 = 64 − 30 − 10 + 2 = 26',noteTitle:'先減十位，再減個位。',
    note:'十位 −30 用 −50 +20 同步到 34。個位 −8 用 −10 +2：先十位退一到 24，再個位上珠 +5、三顆下珠 −3 同步到 26。',start:'64 已撥好。把 38 分成 30 和 8，先算十位。',
    actions:[
      {target:34,label:'第一步：十位減三十',equation:'64 − 50 + 20 = 34',text:'十位上珠離梁、兩顆下珠同時靠梁；減 50 加 20，實際減 30。'},
      {target:24,label:'第二步：個位減八，先退十',equation:'34 − 10 = 24',text:'個位 −8 改用 −10 +2。先在十位退一顆下珠，減 10。'},
      {target:26,label:'第三步：個位補二',equation:'24 + 5 − 3 = 26',text:'個位上珠加入，同時三顆下珠退出；用 +5 −3 加 2，完成 64 − 38 = 26。'},
    ],
  },
].map(compileLesson);
