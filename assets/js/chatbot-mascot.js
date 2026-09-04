(() => {
  'use strict';

  const init = () => {
    const launcher = document.querySelector('.nji-chatbot__launcher');
    if (!launcher || launcher.dataset.mascotReady === '1') return;
    launcher.dataset.mascotReady = '1';

    const root = launcher.closest('.nji-chatbot');
    launcher.querySelector('svg')?.remove();
    launcher.querySelectorAll('.nji-chatbot__mascot-stage,.nji-chatbot__launcher-character,.nji-chatbot__idle-fx').forEach((el) => el.remove());

    const stage = document.createElement('span');
    stage.className = 'nji-chatbot__mascot-stage';
    stage.setAttribute('aria-hidden', 'true');
    launcher.prepend(stage);

    const base = 'assets/images/chatbot-parts/';
    const defs = [
      ['body','01_body.png'],['armLeft','02_arm_left.png'],['armRight','03_arm_right.png'],
      ['eyeLOpen','04_eye_left_open.png'],['eyeROpen','05_eye_right_open.png'],
      ['eyeLClose','06_eye_left_close.png'],['eyeRClose','07_eye_right_close.png'],
      ['mouthNormal','09_mouth_normal.png'],
      ['footLeft','12_foot_left.png'],['footRight','13_foot_right.png'],['antenna','14_antenna.png'],
      ['cheekLeft','15_cheek_left.png'],['cheekRight','16_cheek_right.png'],
      ['z1','17_z.png'],['z2','18_zz.png'],['z3','19_zzz.png']
    ];

    const parts = {};
    defs.forEach(([name,file]) => {
      const img = document.createElement('img');
      img.className = `nji-chatbot__part nji-chatbot__part--${name}`;
      img.src = `${base}${file}?v=896pad`;
      img.alt = '';
      img.decoding = 'async';
      img.draggable = false;
      stage.appendChild(img);
      parts[name] = img;
    });

    document.querySelector('style[data-nji-chatbot-character-style]')?.remove();
    const style = document.createElement('style');
    style.dataset.njiChatbotCharacterStyle = '';
    style.textContent = `
      .nji-chatbot{--nji-bg:#fff!important;--nji-panel:#fff!important;--nji-line:#e3e8ef!important;--nji-text:#13243b!important;--nji-muted:#6d7b8d!important;--nji-accent:#245fae!important;color:#13243b!important;overflow:visible!important;right:22px!important;bottom:22px!important}
      .nji-chatbot__launcher{width:207px!important;height:207px!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;overflow:visible!important;transform:none!important}
      .nji-chatbot__launcher:hover{transform:none!important}
      .nji-chatbot__launcher-label{z-index:40;right:222px!important}
      .nji-chatbot__mascot-stage{position:absolute;left:-78px;top:-78px;width:362px;height:362px;z-index:2;display:block;overflow:visible!important;pointer-events:none;filter:drop-shadow(0 14px 18px rgba(0,0,0,.22));contain:none!important;clip-path:none!important}
      .nji-chatbot__part{position:absolute;inset:0;width:362px;height:362px;max-width:none!important;max-height:none!important;object-fit:contain;object-position:center;overflow:visible!important;pointer-events:none;user-select:none;-webkit-user-drag:none;will-change:transform,opacity}
      .nji-chatbot__part--footLeft,.nji-chatbot__part--footRight{z-index:1}
      .nji-chatbot__part--antenna{z-index:2;transform-origin:51.714% 36.857%}
      .nji-chatbot__part--body{z-index:3;transform-origin:50% 56.857%}
      .nji-chatbot__part--armRight{z-index:4;transform-origin:64.857% 50.571%}
      .nji-chatbot__part--armLeft{z-index:5;transform-origin:36.857% 48.857%}
      .nji-chatbot__part--cheekLeft,.nji-chatbot__part--cheekRight{z-index:6}
      .nji-chatbot__part--eyeLOpen,.nji-chatbot__part--eyeROpen,.nji-chatbot__part--eyeLClose,.nji-chatbot__part--eyeRClose{z-index:7}
      .nji-chatbot__part--mouthNormal{z-index:8}
      .nji-chatbot__part--z1,.nji-chatbot__part--z2,.nji-chatbot__part--z3{z-index:12}
      .nji-chatbot__part--eyeLClose,.nji-chatbot__part--eyeRClose,.nji-chatbot__part--z1,.nji-chatbot__part--z2,.nji-chatbot__part--z3{opacity:0}
      .nji-chatbot__panel{bottom:225px!important;background:#fff!important;border:1px solid #dce4ee!important;color:#13243b!important;box-shadow:0 24px 68px rgba(10,31,58,.24)!important;overflow:visible!important;isolation:isolate}
      .nji-chatbot__panel::after{content:'';position:absolute;right:72px;bottom:-15px;width:30px;height:30px;background:#fff;border-right:1px solid #dce4ee;border-bottom:1px solid #dce4ee;transform:rotate(45deg);z-index:-1}
      .nji-chatbot__head{background:#fff!important;border-bottom:1px solid #e3e8ef!important;border-radius:22px 22px 0 0}.nji-chatbot__eyebrow{color:#245fae!important}.nji-chatbot__title{color:#13243b!important}.nji-chatbot__status{color:#6d7b8d!important}
      .nji-chatbot__close{background:#f1f4f8!important;color:#13243b!important}.nji-chatbot__body{background:#fff!important;color:#13243b!important}.nji-chatbot__bubble{background:#f2f5f9!important;border-color:#e1e7ef!important;color:#1b2d45!important}.nji-chatbot__row.is-user .nji-chatbot__bubble{background:#17365f!important;border-color:#17365f!important;color:#fff!important}
      .nji-chatbot__choice{background:#fff!important;border-color:#bfd0e6!important;color:#18314f!important}.nji-chatbot__choice small{color:#6f7f92!important}.nji-chatbot__action{background:#f2f5f9!important;border-color:#dce4ee!important;color:#17365f!important}.nji-chatbot__action.is-primary{background:#17365f!important;border-color:#17365f!important;color:#fff!important}
      .nji-chatbot__inputbar{background:#fff!important;border-top:1px solid #e3e8ef!important}.nji-chatbot__input{background:#fff!important;border-color:#cbd6e4!important;color:#13243b!important}.nji-chatbot__send{background:#17365f!important;color:#fff!important}.nji-chatbot__foot{background:#fff!important;color:#8491a1!important;border-radius:0 0 22px 22px}.back-to-top{right:252px!important}
      @media(max-width:640px){.nji-chatbot{right:14px!important;bottom:14px!important;overflow:visible!important}.nji-chatbot__launcher{width:98px!important;height:98px!important;overflow:visible!important}.nji-chatbot__mascot-stage{left:-37px;top:-37px;width:172px;height:172px;overflow:visible!important;filter:drop-shadow(0 8px 12px rgba(0,0,0,.2))}.nji-chatbot__part{width:172px;height:172px}.nji-chatbot__panel{bottom:120px!important;border-radius:18px!important}.nji-chatbot__panel::after{right:38px;bottom:-12px;width:24px;height:24px}.nji-chatbot__head{border-radius:18px 18px 0 0}.nji-chatbot__foot{border-radius:0 0 18px 18px}.back-to-top{right:126px!important}}
    `;
    document.head.appendChild(style);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let state = 'idle';
    let blinkTimer = 0;
    let specialTimer = 0;
    const running = new Set();
    let breathing = [];

    const torsoParts = [parts.body,parts.eyeLOpen,parts.eyeROpen,parts.mouthNormal,parts.cheekLeft,parts.cheekRight,parts.antenna];
    const resetOpacity = () => {
      parts.eyeLOpen.style.opacity='1'; parts.eyeROpen.style.opacity='1';
      parts.eyeLClose.style.opacity='0'; parts.eyeRClose.style.opacity='0';
      parts.mouthNormal.style.opacity='1';
      parts.z1.style.opacity='0'; parts.z2.style.opacity='0'; parts.z3.style.opacity='0';
    };
    const animate = (el,keyframes,options) => {
      const a = el.animate(keyframes,options);
      running.add(a);
      return a.finished.catch(()=>{}).finally(()=>running.delete(a));
    };
    const cancelRunning = () => { running.forEach(a=>a.cancel()); running.clear(); };
    const stopBreathing = () => { breathing.forEach(a=>a.cancel()); breathing=[]; };
    const startBreathing = () => {
      stopBreathing();
      if (reduced.matches || state !== 'idle') return;
      const k = [
        {transform:'scale(1,1)',offset:0},{transform:'scale(0.998,0.997)',offset:.18},
        {transform:'scale(1.009,1.014)',offset:.52},{transform:'scale(1.003,1.006)',offset:.72},
        {transform:'scale(1,1)',offset:1}
      ];
      torsoParts.forEach((el,i)=>breathing.push(el.animate(k,{duration:3600+i*35,iterations:Infinity,easing:'cubic-bezier(.45,0,.55,1)'})));
    };
    const hardReset = () => {
      cancelRunning(); stopBreathing(); resetOpacity();
      Object.values(parts).forEach(el=>{ el.style.transform=''; });
    };
    const clearTimers = () => {
      if (blinkTimer) { clearTimeout(blinkTimer); blinkTimer=0; }
      if (specialTimer) { clearTimeout(specialTimer); specialTimer=0; }
    };
    const canIdleAnimate = () => !reduced.matches && !document.hidden && !root?.classList.contains('is-open');
    const scheduleBlink = () => {
      if (blinkTimer || !canIdleAnimate()) return;
      blinkTimer=setTimeout(()=>{ blinkTimer=0; if(state==='idle') blink(); else scheduleBlink(); },2000+Math.random()*2000);
    };
    const scheduleSpecial = () => {
      if (specialTimer || !canIdleAnimate()) return;
      specialTimer=setTimeout(()=>{
        specialTimer=0;
        if(state!=='idle'){
          specialTimer=setTimeout(()=>{ specialTimer=0; scheduleSpecial(); },900+Math.random()*900);
          return;
        }
        (Math.random()<0.5 ? wave : sleepMotion)();
      },5000+Math.random()*3000);
    };
    const scheduleAll = () => { scheduleBlink(); scheduleSpecial(); };
    const enterIdle = () => { state='idle'; hardReset(); startBreathing(); scheduleAll(); };

    const blink = async () => {
      if(state!=='idle') return;
      state='blink'; stopBreathing();
      await Promise.all([
        animate(parts.eyeLOpen,[{opacity:1},{opacity:0}],{duration:90,easing:'cubic-bezier(.4,0,1,1)',fill:'forwards'}),
        animate(parts.eyeROpen,[{opacity:1},{opacity:0}],{duration:90,easing:'cubic-bezier(.4,0,1,1)',fill:'forwards'}),
        animate(parts.eyeLClose,[{opacity:0},{opacity:1}],{duration:95,easing:'ease-out',fill:'forwards'}),
        animate(parts.eyeRClose,[{opacity:0},{opacity:1}],{duration:95,easing:'ease-out',fill:'forwards'})
      ]);
      await new Promise(r=>setTimeout(r,70));
      await Promise.all([
        animate(parts.eyeLOpen,[{opacity:0},{opacity:1}],{duration:135,easing:'cubic-bezier(0,0,.2,1)',fill:'forwards'}),
        animate(parts.eyeROpen,[{opacity:0},{opacity:1}],{duration:135,easing:'cubic-bezier(0,0,.2,1)',fill:'forwards'}),
        animate(parts.eyeLClose,[{opacity:1},{opacity:0}],{duration:120,easing:'ease-in',fill:'forwards'}),
        animate(parts.eyeRClose,[{opacity:1},{opacity:0}],{duration:120,easing:'ease-in',fill:'forwards'})
      ]);
      enterIdle();
    };

    const wave = async () => {
      if(state!=='idle') return;
      state='wave'; stopBreathing();
      const main=animate(parts.armLeft,[
        {transform:'rotate(0deg)',offset:0},{transform:'rotate(-7deg)',offset:.10},
        {transform:'rotate(24deg)',offset:.25},{transform:'rotate(-14deg)',offset:.42},
        {transform:'rotate(20deg)',offset:.58},{transform:'rotate(-9deg)',offset:.74},
        {transform:'rotate(7deg)',offset:.88},{transform:'rotate(0deg)',offset:1}
      ],{duration:1750,easing:'cubic-bezier(.2,.85,.25,1)',fill:'forwards'});
      const secondary=animate(parts.antenna,[
        {transform:'rotate(0deg)'},{transform:'rotate(-3deg)',offset:.22},{transform:'rotate(4deg)',offset:.48},
        {transform:'rotate(-2deg)',offset:.72},{transform:'rotate(0deg)'}
      ],{duration:1500,delay:120,easing:'cubic-bezier(.25,.8,.3,1)',fill:'forwards'});
      const counter=animate(parts.armRight,[
        {transform:'rotate(0deg)'},{transform:'rotate(-2deg)',offset:.4},{transform:'rotate(1deg)',offset:.72},{transform:'rotate(0deg)'}
      ],{duration:1300,delay:180,easing:'ease-in-out',fill:'forwards'});
      await Promise.all([main,secondary,counter]);
      enterIdle();
    };

    const sleepMotion = async () => {
      if(state!=='idle') return;
      state='sleep'; stopBreathing();
      await Promise.all([
        animate(parts.eyeLOpen,[{opacity:1},{opacity:0}],{duration:260,easing:'ease-in',fill:'forwards'}),
        animate(parts.eyeROpen,[{opacity:1},{opacity:0}],{duration:260,easing:'ease-in',fill:'forwards'}),
        animate(parts.eyeLClose,[{opacity:0},{opacity:1}],{duration:300,easing:'ease-out',fill:'forwards'}),
        animate(parts.eyeRClose,[{opacity:0},{opacity:1}],{duration:300,easing:'ease-out',fill:'forwards'})
      ]);
      const slowBreath=[{transform:'scale(1)'},{transform:'scale(1.006,1.014)'},{transform:'scale(.998,.994)'},{transform:'scale(1.006,1.014)'},{transform:'scale(1)'}];
      const sleepParts=[parts.body,parts.eyeLClose,parts.eyeRClose,parts.mouthNormal,parts.cheekLeft,parts.cheekRight,parts.antenna];
      const breathe=sleepParts.map((el,i)=>animate(el,slowBreath,{duration:3300,delay:i*18,easing:'cubic-bezier(.45,0,.55,1)',fill:'forwards'}));
      const zAnim=(el,delay)=>animate(el,[
        {opacity:0,transform:'translate(0,8px) scale(.72)'},{opacity:1,transform:'translate(2px,0) scale(1)',offset:.24},
        {opacity:1,transform:'translate(6px,-8px) scale(1.08)',offset:.62},{opacity:0,transform:'translate(11px,-19px) scale(1.16)'}
      ],{duration:1800,delay,easing:'cubic-bezier(.18,.7,.25,1)',fill:'forwards'});
      await Promise.all([...breathe,zAnim(parts.z1,380),zAnim(parts.z2,900),zAnim(parts.z3,1420)]);
      state='wake';
      await Promise.all([
        animate(parts.eyeLClose,[{opacity:1},{opacity:0}],{duration:170,easing:'ease-in',fill:'forwards'}),
        animate(parts.eyeRClose,[{opacity:1},{opacity:0}],{duration:170,easing:'ease-in',fill:'forwards'}),
        animate(parts.eyeLOpen,[{opacity:0},{opacity:1}],{duration:240,easing:'ease-out',fill:'forwards'}),
        animate(parts.eyeROpen,[{opacity:0},{opacity:1}],{duration:240,easing:'ease-out',fill:'forwards'}),
        animate(parts.body,[{transform:'scale(1)'},{transform:'scale(1.015,.985)',offset:.35},{transform:'scale(.995,1.012)',offset:.62},{transform:'scale(1)'}],{duration:520,easing:'cubic-bezier(.2,.9,.3,1.15)',fill:'forwards'}),
        animate(parts.antenna,[{transform:'rotate(0)'},{transform:'rotate(-4deg)',offset:.35},{transform:'rotate(2deg)',offset:.65},{transform:'rotate(0)'}],{duration:620,easing:'ease-out',fill:'forwards'})
      ]);
      enterIdle();
    };

    launcher.addEventListener('click',()=>{ clearTimers(); hardReset(); state='idle'; });
    document.addEventListener('visibilitychange',()=>{ if(document.hidden){ clearTimers(); hardReset(); state='idle'; } else enterIdle(); });
    new MutationObserver(()=>{ if(root?.classList.contains('is-open')){ clearTimers(); hardReset(); state='idle'; } else enterIdle(); }).observe(root,{attributes:true,attributeFilter:['class']});
    enterIdle();
  };

  if (document.querySelector('.nji-chatbot__launcher')) init();
  else new MutationObserver((_,obs)=>{ if(document.querySelector('.nji-chatbot__launcher')){ obs.disconnect(); init(); } }).observe(document.documentElement,{childList:true,subtree:true});
})();