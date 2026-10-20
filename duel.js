import {createAbacus} from './abacus.js';
import {question,createMatch,submit,nextRound} from './model.js';
import {hero,difficultyOptions,orientationRequest,unlockOrientation} from './ui.js';

export function mountDuel(root) {
  let timers=new Set(),match,boards=[],panels=[],current,playing=false,names=['青竹隊','朱砂隊'],max=99;
  const after=(fn,delay)=>{const id=setTimeout(()=>{timers.delete(id);fn();},delay);timers.add(id);};
  function clearTimers(){for(const id of timers)clearTimeout(id);timers.clear();}
  function setup() {
    clearTimers();playing=false;document.body.classList.remove('in-duel');unlockOrientation();
    root.innerHTML=hero('03 / BETTER TOGETHER','隔着算盤，來場對決。','兩個人，一部 iPad。面對面坐好，把算盤變成你們的數學遊戲場。')+`
      <div class="duel-setup-layout"><section class="duel-intro"><p class="eyebrow">FACE TO FACE · 面對面</p><div class="device-illustration" aria-hidden="true"><div class="mini-player top"><span>青竹隊</span><strong>8 + 5 = ?</strong><div class="mini-beads">● ● ●<br>● ● ●</div></div><div class="mini-divider">一部 iPad，兩個算盤</div><div class="mini-player"><span>朱砂隊</span><strong>8 + 5 = ?</strong><div class="mini-beads">● ● ●<br>● ● ●</div></div></div><div class="duel-rules"><div><span>01</span><p>iPad 轉直，<br>兩人坐在兩端。</p></div><div><span>02</span><p>同一道題目，<br>各自在算盤作答。</p></div><div><span>03</span><p>先答對得一分，<br>先到五分勝出。</p></div></div></section><section class="setup-panel duel-config"><p class="eyebrow">準備開賽</p><h2>今天誰是撥珠高手？</h2><label class="field-label" for="player-one">上方玩家 · 畫面旋轉 180°</label><input id="player-one" type="text" maxlength="12" value="青竹隊" autocomplete="off"><label class="field-label" for="player-two">下方玩家</label><input id="player-two" type="text" maxlength="12" value="朱砂隊" autocomplete="off"><label class="field-label" for="duel-level">比賽難度</label><select id="duel-level">${difficultyOptions}</select><div class="rule-note"><strong>先取 5 分 · 加減混合題</strong><p>答錯可以修正再提交。每回合由第一位答對的玩家得分，之後兩邊一起換題。</p></div><button class="button button-primary ready-duel">我們準備好了 →</button><p class="small muted">無需登入、無需配對。<br>兩位玩家可以同時撥珠。</p></section></div>`;
    root.querySelector('.ready-duel').onclick=()=>{names=[root.querySelector('#player-one').value.trim()||'青竹隊',root.querySelector('#player-two').value.trim()||'朱砂隊'];max=Number(root.querySelector('#duel-level').value);start();};
  }
  function start() {
    clearTimers();match=createMatch(5);playing=false;document.body.classList.add('in-duel');orientationRequest();
    root.innerHTML=`<div class="duel-arena"><section class="player-panel player-top" data-player="0"></section><div class="arena-divider"><button class="exit-duel" aria-label="離開對戰">✕ 離開</button><span>先取 5 分</span><span class="arena-round">第 1 回合</span></div><section class="player-panel player-bottom" data-player="1"></section></div><div class="rotate-gate"><div class="rotate-icon" aria-hidden="true">▯ ↻</div><h2>把 iPad 轉直，準備對戰。</h2><p>兩位玩家坐在裝置兩端。<br>轉成直向後即可繼續。</p><button class="button button-primary leave-rotate">返回設定</button></div>`;
    panels=[...root.querySelectorAll('.player-panel')];boards=panels.map((panel,i)=>{
      panel.innerHTML=`<div class="player-heading"><span class="player-name"></span><span class="player-score">0 <small>/ 5 分</small></span></div><div class="duel-question"><span class="duel-instruction">準備開始</span><strong class="duel-problem">3</strong></div><div class="board-host duel-board"></div><p class="player-feedback" role="status">倒數結束後，撥出答案再確認。</p><div class="player-actions"><button class="button button-quiet player-clear" disabled>↺ 清零</button><button class="button button-primary player-confirm" disabled>確認答案 →</button></div>`;
      panel.querySelector('.player-name').textContent=names[i];
      const b=createAbacus(panel.querySelector('.board-host'),{count:3,readonly:true});
      panel.querySelector('.player-clear').onclick=()=>{if(playing&&!match.locked)b.clear();};
      panel.querySelector('.player-confirm').onclick=()=>answer(i);
      return b;
    });
    root.querySelector('.exit-duel').onclick=setup;root.querySelector('.leave-rotate').onclick=setup;
    // Countdown starts only in portrait and pauses when the rotate gate is shown.
    let remaining=3;
    const countdown=()=>{
      if(window.matchMedia('(orientation: landscape)').matches){after(countdown,250);return;}
      panels.forEach(p=>p.querySelector('.duel-problem').textContent=remaining);
      if(remaining===0){playing=true;round();return;}
      remaining--;after(countdown,1000);
    };
    countdown();
  }
  function setLocked(locked){boards.forEach(b=>b.lock(locked));panels.forEach(p=>p.querySelectorAll('.player-actions button').forEach(el=>el.disabled=locked));}
  function round() {
    current=question('mixed',max);
    panels.forEach((p,i)=>{
      p.classList.remove('round-winner');p.querySelector('.duel-instruction').textContent='用算盤撥出答案';p.querySelector('.duel-problem').textContent=`${current.label} = ?`;
      p.querySelector('.player-feedback').textContent='想清楚，再出手。';p.querySelector('.player-feedback').className='player-feedback';
      boards[i].clear();
    });
    root.querySelector('.arena-round').textContent=`第 ${match.round} 回合`;setLocked(false);
  }
  function answer(player) {
    if(!playing||window.matchMedia('(orientation: landscape)').matches)return;
    const result=submit(match,player,boards[player].value,current.answer);
    const feedback=panels[player].querySelector('.player-feedback');
    if(result==='locked')return;
    if(result==='wrong'){feedback.textContent='再看看算珠，修正後可以再答。';feedback.className='player-feedback wrong';return;}
    setLocked(true);panels[player].classList.add('round-winner');
    panels.forEach((p,i)=>{
      p.querySelector('.player-score').innerHTML=`${match.scores[i]} <small>/ 5 分</small>`;
      p.querySelector('.player-feedback').textContent=i===player?'答對！你取得這一分。':`本回合答案是 ${current.answer}，下一題再接再厲！`;
      p.querySelector('.player-feedback').className=`player-feedback ${i===player?'correct':''}`;
    });
    if(result==='win'){playing=false;after(finish,1300);}
    else after(()=>{nextRound(match);round();},1600);
  }
  function finish() {
    clearTimers();
    panels.forEach((panel,i)=>{
      panel.innerHTML=`<div class="duel-result"><p class="eyebrow">${i===match.winner?'這場比賽，你勝出了':'好對手，下一場見'}</p><h2>${i===match.winner?'撥珠高手！':'每一撥，都在進步。'}</h2><p class="winner-name"></p><div class="duel-final-score">${match.scores[i]} <span>:</span> ${match.scores[1-i]}</div><p>共 ${match.round} 回合 · 先取 5 分</p><div class="result-actions"><button class="button button-primary rematch">再戰一場 ↺</button><button class="text-button back-setup">返回設定</button></div></div>`;
      panel.querySelector('.winner-name').textContent=`勝出：${names[match.winner]}`;
      panel.querySelector('.rematch').onclick=start;panel.querySelector('.back-setup').onclick=setup;
    });
  }
  setup();return ()=>{clearTimers();playing=false;unlockOrientation();document.body.classList.remove('in-duel');};
}
