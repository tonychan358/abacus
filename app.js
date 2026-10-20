import {mountLearn} from './learn.js';
import {mountSolo} from './solo.js';
import {mountDuel} from './duel.js';
const main=document.querySelector('main');
document.querySelector('.skip-link').addEventListener('click',event=>{event.preventDefault();main.focus();});
let cleanup=()=>{};
function route() {
  cleanup();document.body.classList.remove('in-duel');
  const mode=['learn','solo','duel'].includes(location.hash.slice(1))?location.hash.slice(1):'learn';
  document.querySelectorAll('[data-mode]').forEach(a=>{
    if(a.dataset.mode===mode)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
  });
  cleanup=({learn:mountLearn,solo:mountSolo,duel:mountDuel})[mode](main);
  window.scrollTo(0,0);
}
window.addEventListener('hashchange',route);route();
