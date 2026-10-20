import {createAbacus} from './abacus.js';
import {hero,format} from './ui.js';
import {lessons} from './lessons.js';
import {createPlayback,playbackSpeeds} from './playback.js';

export function mountLearn(root) {
  let chapter=0,showValue=true,board,player,programmatic=false,dirty=false;
  root.innerHTML=hero('01 / EXPLORE THE ABACUS','把數學，撥在指尖。','直接看數，整組撥珠。進退位先動十位，再處理個位補數。')+`
    <div class="learn-layout detailed-learn">
      <aside class="lesson-sidebar"><div class="section-heading"><span>學習路線</span><span>${lessons.length} 個主題</span></div><div class="lesson-list">${lessons.map((l,i)=>`<button class="lesson-link" data-lesson="${i}"><span class="lesson-number">${String(i+1).padStart(2,'0')}</span><span>${l.title}<small>${l.tag}</small></span><span class="lesson-arrow">↗</span></button>`).join('')}</div><div class="sidebar-note"><span class="tiny-label">中學數學 · 算盤實驗</span><p>原數直接就緒，<br>進退位分兩步。</p><a href="https://www.youtube.com/watch?v=PTv34mM2KRs&list=PLzdMBhpFo9yKq7tS1TpWOCIGH9kCmO5CI" target="_blank" rel="noopener">老師提供的參考課程 ↗</a></div></aside>
      <section class="learning-workspace" aria-label="互動教學">
        <div class="board-topline"><span class="eyebrow chapter-tag"></span><button class="text-button value-toggle" aria-pressed="true">隱藏數值 ◉</button></div>
        <div class="lesson-copy"><h2></h2><p></p></div>
        <div class="principle-strip"><span>拆數原理</span><strong class="principle-equation"></strong></div>
        <div class="demo-strip"><button class="button button-primary play-demo">▶ 播放</button><label class="speed-label">速度<select class="demo-speed" aria-label="示範速度"><option value="normal">課堂</option><option value="slow">慢看</option></select></label><div class="step-navigation"><button class="icon-button previous-step" aria-label="上一步">←</button><span class="step-count"></span><button class="icon-button next-step" aria-label="下一步">→</button></div></div>
        <div class="bead-action-panel" aria-live="polite"><div class="action-heading"><span class="phase-label">準備</span><h3 class="action-title"></h3><span class="action-change"></span></div><strong class="action-equation"></strong><p class="step-caption"></p></div>
        <div class="board-readout"><span>目前算盤上的數值</span><output aria-live="polite">0</output><button class="text-button clear-board">↺ 清零</button></div>
        <div class="board-host teaching-board"></div>
        <div class="step-tools"><button class="text-button replay-step">↺ 重播運算</button><span>每步整組撥珠 · 可暫停觀察</span></div><div class="step-track" role="group" aria-label="運算步驟"></div>
      </section>
      <aside class="lesson-notes"><div class="note-mark">撥珠筆記</div><h3 class="note-title"></h3><p class="lesson-note"></p><div class="rod-summary"><span>個位珠況</span><strong class="ones-state">上 0 · 下 0</strong><span>十位珠況</span><strong class="tens-state">上 0 · 下 0</strong></div><div class="bead-legend"><span><i class="legend-bead upper"></i> 上珠 × 5</span><span><i class="legend-bead"></i> 下珠 × 1</span><span><i class="motion-key"></i> 亮框＋箭頭：同步動作</span></div><div class="touch-tip"><span>看完，親手試</span><p>點一下看完整個運算，<br>可暫停、重播或選慢看。<br>停定後可自由試撥。</p></div><a class="practice-link" href="#solo">學會了？挑戰自己 <span>→</span></a></aside>
    </div>`;
  const get=s=>root.querySelector(s);
  const mutate=fn=>{programmatic=true;try{fn();}finally{programmatic=false;}};
  board=createAbacus(get('.board-host'),{onChange:(n,rods)=>{
    get('output').textContent=showValue?format(n):'—';
    get('.ones-state').textContent=`上 ${rods[4].upper} · 下 ${rods[4].lower}`;
    get('.tens-state').textContent=`上 ${rods[3].upper} · 下 ${rods[3].lower}`;
    if(!programmatic&&player){dirty=true;player.stop();board.clearCue();board.highlight(null);get('.phase-label').textContent='自由試撥';get('.step-caption').textContent='按「重播運算」回到原數，再看一次。';get('.action-equation').textContent='自由探索中';get('.action-change').textContent='';}
  }});
  function updateStatus(state) {
    if(state.paused)board.pauseAnimations();else board.resumeAnimations();
    board.lock(state.paused||state.phase!=='settled'||state.playing);
    const running=!state.paused&&(state.playing||state.phase!=='settled');
    get('.play-demo').textContent=running?'Ⅱ 暫停':state.paused?'▶ 繼續':'▶ 播放';
    get('.play-demo').setAttribute('aria-pressed',String(running));
    get('.play-demo').disabled=lessons[chapter].frames.length===1;
    get('.previous-step').disabled=state.index===0;get('.next-step').disabled=state.index===lessons[chapter].frames.length-1;
    if(state.paused)get('.phase-label').textContent=state.phase==='preview'?'已暫停 · 準備階段':state.phase==='move'?'已暫停 · 撥珠中':'已暫停 · 本步完成';
    else if(!dirty)get('.phase-label').textContent=state.phase==='preview'?'準備撥珠':state.phase==='move'?'整組撥珠':state.index===0?'原數就緒':state.index===lessons[chapter].frames.length-1?'運算完成':'本步完成';
  }
  function showPhase(index,phase) {
    dirty=false;
    const lesson=lessons[chapter],frame=lesson.frames[index];
    get('.action-title').textContent=frame.label;get('.step-caption').textContent=frame.text;get('.action-equation').textContent=frame.equation;
    get('.action-change').textContent=frame.moves.length&&lesson.id!=='intro'?`${frame.amount>0?'+':'−'}${Math.abs(frame.amount)}`:'';
    get('.action-change').className=`action-change ${frame.amount<0?'subtract':'add'}`;
    get('.step-count').textContent=`${index+1} / ${lesson.frames.length}`;
    get('.step-track').querySelectorAll('[data-step]').forEach(el=>{const selected=Number(el.dataset.step)===index;el.setAttribute('aria-pressed',String(selected));el.classList.toggle('active',selected);});
    mutate(()=>{
      if(phase==='preview'){board.setState(lesson.frames[index-1].rods);board.showMoves(frame.moves);}
      else if(phase==='move'){board.setState(frame.rods,{duration:player.timing.move});}
      else {board.setState(frame.rods);board.showMoves(frame.moves);}
    });
  }
  function chooseChapter(next) {
    player?.destroy();board.cancelAnimations();chapter=next;dirty=false;
    const lesson=lessons[chapter];
    get('.chapter-tag').textContent=`單元 ${String(chapter+1).padStart(2,'0')} / ${lesson.tag}`;
    get('.lesson-copy h2').textContent=lesson.title;get('.lesson-copy p').textContent=lesson.description;
    get('.principle-equation').textContent=lesson.principle;get('.lesson-note').textContent=lesson.note;get('.note-title').textContent=lesson.noteTitle;
    root.querySelectorAll('[data-lesson]').forEach(el=>{const selected=Number(el.dataset.lesson)===chapter;el.classList.toggle('active',selected);el.setAttribute('aria-pressed',String(selected));});
    get('.step-track').innerHTML=lesson.frames.map((f,i)=>{const label=i===0?'原數':lesson.frames.length===2?'結果':`第 ${i} 步`;return `<button data-step="${i}" aria-label="${label}：${f.label}">${label}</button>`;}).join('');
    get('.step-track').querySelectorAll('[data-step]').forEach(el=>el.onclick=()=>player.seek(Number(el.dataset.step)));
    player=createPlayback({length:lesson.frames.length,timing:playbackSpeeds[get('.demo-speed').value],onPhase:showPhase,onStatus:updateStatus});player.seek(0);
  }
  root.querySelectorAll('[data-lesson]').forEach(el=>el.onclick=()=>chooseChapter(Number(el.dataset.lesson)));
  get('.previous-step').onclick=()=>player.seek(player.state.index-1);get('.next-step').onclick=()=>player.seek(player.state.index+1);
  get('.replay-step').onclick=()=>{player.seek(0);player.play();};
  get('.play-demo').onclick=()=>{const s=player.state;if(!s.paused&&(s.playing||s.phase!=='settled'))player.pause();else{if(dirty)player.seek(s.index);player.play();}};
  get('.demo-speed').onchange=()=>player.setTiming(playbackSpeeds[get('.demo-speed').value]);
  get('.clear-board').onclick=()=>{player.stop();board.lock(false);board.clear();};
  get('.value-toggle').onclick=()=>{showValue=!showValue;get('.value-toggle').textContent=showValue?'隱藏數值 ◉':'顯示數值 ○';get('.value-toggle').setAttribute('aria-pressed',String(showValue));get('output').textContent=showValue?format(board.value):'—';};
  chooseChapter(0);
  return ()=>{player.destroy();board.cancelAnimations();};
}
