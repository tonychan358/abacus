export const playbackSpeeds={normal:{preview:100,move:550,hold:650},slow:{preview:300,move:1000,hold:1200}};
export function createPlayback({length,onPhase,onStatus=()=>{},timing=playbackSpeeds.normal,clock={now:()=>Date.now(),setTimeout:(fn,ms)=>setTimeout(fn,ms),clearTimeout:id=>clearTimeout(id)}}) {
  let index=0,phase='settled',playing=false,paused=false,timer=null,deadline=0,remaining=0,pending=null,disposed=false;
  const state=()=>({index,phase,playing,paused});
  const status=()=>onStatus(state());
  function clear(){if(timer!==null)clock.clearTimeout(timer);timer=null;pending=null;remaining=0;}
  function schedule(fn,ms){clear();pending=fn;remaining=ms;deadline=clock.now()+ms;timer=clock.setTimeout(()=>{timer=null;pending=null;remaining=0;if(!disposed)fn();},ms);}
  function emit(next){phase=next;onPhase(index,phase);status();}
  function settled(){emit('settled');if(playing){if(index===length-1){playing=false;status();}else schedule(()=>begin(index+1),timing.hold);}}
  function begin(next){
    index=next;
    if(index===0){settled();return;}
    emit('preview');schedule(()=>{emit('move');schedule(settled,timing.move);},timing.preview);
  }
  const api={
    get state(){return state();},get timing(){return {...timing};},
    seek(next){if(disposed)return;clear();playing=false;paused=false;begin(Math.max(0,Math.min(length-1,next)));},
    play(){
      if(disposed)return;playing=true;
      if(paused){paused=false;const resume=pending,ms=remaining;status();if(resume)schedule(resume,ms);else settled();return;}
      if(phase!=='settled'){status();return;}
      if(index===length-1){clear();index=0;emit('settled');}
      status();schedule(()=>begin(index+1),timing.hold);
    },
    pause(){if(disposed||paused)return;playing=false;paused=true;if(timer!==null){remaining=Math.max(0,deadline-clock.now());clock.clearTimeout(timer);timer=null;}status();},
    stop(){clear();playing=false;paused=false;phase='settled';status();},
    setTiming(next){timing={...next};api.seek(index);},
    destroy(){clear();disposed=true;playing=false;paused=false;},
  };
  return api;
}
