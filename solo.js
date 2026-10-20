import {createAbacus} from './abacus.js';
import {question} from './model.js';
import {hero,difficultyOptions,keypad,saveBest,getBest} from './ui.js';

const kindNames={set:'照數撥珠',read:'算盤讀數',mixed:'加減運算'};
export function mountSolo(root) {
  let interval=null,active=false,current,board,resolved=false,correct=0,attempts=0,index=0,history=[],deadline=0,settings;
  root.innerHTML=hero('02 / YOUR OWN PACE','小小算盤，大顯身手。','先想一想，再撥一撥。用自己的節奏練習，或和時間來一場友善比賽。')+`
    <div class="solo-layout"><aside class="setup-panel"><p class="eyebrow">挑戰設定</p><h2>今天，練習甚麼？</h2><fieldset class="kind-options"><legend>題目類型</legend>${Object.entries(kindNames).map(([key,label],i)=>`<label class="choice-row"><input type="radio" name="kind" value="${key}" ${i===0?'checked':''}><span>${label}<small>${['把指定數字撥在算盤上','看算珠，寫出它的數值','計算後用算盤表示答案'][i]}</small></span></label>`).join('')}</fieldset><label class="field-label" for="solo-level">難度</label><select id="solo-level">${difficultyOptions}</select><fieldset class="session-options"><legend>練習方式</legend><label><input type="radio" name="session" value="practice" checked> 10 題練習</label><label><input type="radio" name="session" value="timed"> 60 秒挑戰</label></fieldset><button class="button button-primary start-solo">開始挑戰 <span>→</span></button><p class="small muted">練習時不顯示算盤總值。<br>答錯可以再試，查看答案則該題不計分。</p><div class="personal-best"><span>這個組合的最佳成績</span><strong>0</strong><small>分 · 儲存在這部裝置</small></div></aside><section class="solo-stage" aria-label="單人遊戲區"></section></div>`;
  const get=s=>root.querySelector(s),stage=get('.solo-stage');
  function readSettings(){return {kind:get('[name=kind]:checked').value,max:Number(get('#solo-level').value),timed:get('[name=session]:checked').value==='timed'};}
  function key(){const s=readSettings();return `abacus-best-${s.kind}-${s.max}-${s.timed?'timed':'practice'}`;}
  function refreshBest(){get('.personal-best strong').textContent=getBest(key());}
  root.querySelectorAll('input,select').forEach(el=>el.addEventListener('change',refreshBest));
  function controlsDisabled(disabled){root.querySelectorAll('.setup-panel input,.setup-panel select').forEach(el=>el.disabled=disabled);}
  function stop(){clearInterval(interval);interval=null;active=false;}
  function preview() {
    stage.innerHTML=`<div class="waiting-label"><span class="status-dot"></span> 準備好，撥出你的第一個答案</div><div class="solo-preview-heading"><span class="eyebrow">練習之前，先暖暖手</span><h2>你能讀出這個數嗎？</h2></div><div class="board-host"></div><p class="preview-answer">這是 <strong>28</strong>。兩個十，加八個一。</p><p class="small muted">在左方選擇題型和難度，即可開始。</p>`;
    board=createAbacus(stage.querySelector('.board-host'));board.setValue(28);
  }
  function feedback(text,type='') {const el=stage.querySelector('.game-feedback');el.textContent=text;el.className=`game-feedback ${type}`;}
  function expired(){if(active&&settings.timed&&Date.now()>=deadline){finish();return true;}return false;}
  function tick(){if(!active)return;if(expired())return;stage.querySelector('.time-left').textContent=Math.max(0,Math.ceil((deadline-Date.now())/1000));}
  function newQuestion() {
    current=question(settings.kind,settings.max);resolved=false;
    stage.innerHTML=`<div class="game-topbar"><span class="round-label">${settings.timed?'限時挑戰':`第 ${index+1} / 10 題`}</span><span class="game-score">答對 <strong>${correct}</strong> 題</span>${settings.timed?'<span class="timer"><strong class="time-left">60</strong> 秒</span>':''}</div><div class="question-area"><p class="eyebrow">${current.kind==='read'?'看算盤，讀出數值':current.kind==='set'?'請在算盤撥出':'請用算盤表示答案'}</p><h2 class="question-text">${current.kind==='read'?'這是多少？':current.label}${['add','subtract'].includes(current.kind)?'<span> = ?</span>':''}</h2></div><div class="board-host"></div>${current.kind==='read'?'<div class="read-entry"><label for="read-answer">我的答案</label><input id="read-answer" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" maxlength="5" placeholder="輸入數字"><div class="keypad-host"></div></div>':''}<p class="game-feedback" role="status">${current.kind==='read'?'觀察哪些算珠靠近橫梁。':'點按或上下滑動算珠，完成後確認。'}</p><div class="game-actions"><button class="button button-quiet clear-solo">↺ 清零</button><button class="text-button reveal-solo">查看答案</button><button class="button button-primary confirm-solo">確認答案 →</button></div><button class="text-button end-solo">結束這次練習</button>`;
    board=createAbacus(stage.querySelector('.board-host'),{readonly:current.kind==='read'});
    if(current.kind==='read')board.setValue(current.answer);
    else if(current.kind==='add'||current.kind==='subtract')board.setValue(current.a);
    stage.querySelector('.clear-solo').disabled=current.kind==='read';
    stage.querySelector('.clear-solo').onclick=()=>board.clear();
    stage.querySelector('.end-solo').onclick=finish;
    stage.querySelector('.confirm-solo').onclick=confirm;
    stage.querySelector('.reveal-solo').onclick=reveal;
    if(current.kind==='read'){
      const input=stage.querySelector('#read-answer');
      input.addEventListener('input',()=>input.value=input.value.replace(/\D/g,''));
      input.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();confirm();}});
      keypad(stage.querySelector('.keypad-host'),key=>{if(resolved)return;input.value=key==='清除'?'':key==='⌫'?input.value.slice(0,-1):(input.value+key).slice(0,5);});
    }
    if(settings.timed)tick();
  }
  function record(response,status){history.push({label:current.kind==='read'?'算盤讀數':current.label,answer:current.answer,response,status});}
  function lockResolved(){board.lock();stage.querySelector('.clear-solo').disabled=true;stage.querySelector('.reveal-solo').disabled=true;const input=stage.querySelector('#read-answer');if(input)input.disabled=true;stage.querySelector('.confirm-solo').textContent=!settings.timed&&index===9?'查看成績 →':'下一題 →';}
  function confirm() {
    if(!active||expired())return;
    if(resolved){index++;if(!settings.timed&&index>=10){finish();return;}newQuestion();return;}
    const input=stage.querySelector('#read-answer');
    if(input&&!input.value.trim()){feedback('先輸入你讀到的數字。','wrong');return;}
    const answer=input?Number(input.value):board.value;attempts++;
    if(answer===current.answer){correct++;resolved=true;record(answer,'答對');feedback('答對了！做得好，準備下一題。','correct');stage.querySelector('.game-score strong').textContent=correct;lockResolved();}
    else feedback('還差一點！看看位值和靠梁的算珠，再試一次。','wrong');
  }
  function reveal() {
    if(!active||resolved||expired())return;
    resolved=true;record('—','看答案');board.setValue(current.answer);
    const input=stage.querySelector('#read-answer');if(input)input.value=current.answer;
    feedback(`答案是 ${current.answer}。這題不計分，記住方法，再接再厲。`);lockResolved();
  }
  function finish() {
    if(!active)return;
    if(!resolved&&current)record('未完成','未完成');
    stop();controlsDisabled(false);get('.start-solo').textContent='再練一次 →';
    const best=saveBest(key(),correct);refreshBest();
    const completed=history.filter(h=>h.status!=='未完成').length;
    stage.innerHTML=`<div class="result-screen"><p class="eyebrow">${settings.timed?'60 秒挑戰結束':'這次的練習紀錄'}</p><h2>${correct>=5?'每一撥，都有進步。':'慢慢來，你正在學會。'}</h2><div class="result-number">${correct}<small>題答對</small></div><div class="result-stats"><span>完成題目<strong>${completed}</strong></span><span>提交次數<strong>${attempts}</strong></span><span>個人最佳<strong>${best}</strong></span></div><button class="button button-primary retry-solo">再挑戰一次 →</button><details class="answer-review"><summary>看看這次的答題紀錄</summary><div class="table-scroll"><table><thead><tr><th>題目</th><th>正確答案</th><th>你的答案</th><th>結果</th></tr></thead><tbody>${history.map(h=>`<tr><td>${h.label}</td><td>${h.answer}</td><td>${h.response}</td><td>${h.status}</td></tr>`).join('')}</tbody></table></div></details></div>`;
    stage.querySelector('.retry-solo').onclick=start;
  }
  function start(){stop();settings=readSettings();active=true;correct=0;attempts=0;index=0;history=[];controlsDisabled(true);deadline=Date.now()+60000;get('.start-solo').textContent='重新開始 ↺';newQuestion();if(settings.timed)interval=setInterval(tick,200);}
  get('.start-solo').onclick=start;preview();refreshBest();return stop;
}
