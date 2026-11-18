const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(pointer: fine)');
let paused = reducedMotion.matches;
const cursor = document.querySelector('.cursor');
const cursorLabel = cursor.querySelector('span');
const glow = document.querySelector('.cursor-light');
const canvas = document.querySelector('#particles');
const context = canvas.getContext('2d');
const motionButton = document.querySelector('.motion-toggle');
const scene = document.querySelector('.liquid-scene');
const progress = document.querySelector('.scroll-progress');
let width = innerWidth, height = innerHeight, dpr = Math.min(devicePixelRatio || 1, 2);
let pointerX = width / 2, pointerY = height / 2, cursorX = pointerX, cursorY = pointerY;
let pointerVisible = false, particles = [], animationId = 0, lastFrame = 0;
let lastCursorSound = 0, lastSplash = -1000, cursorSpeed = 0;
const liquidTrail = Array.from({length: 9}, () => ({x:pointerX,y:pointerY}));
let audio, soundOn = true, lastPop = 0;
const controls = document.createElement('div');
controls.className = 'controls';
motionButton.before(controls);
controls.append(motionButton);
const soundButton = document.createElement('button');
soundButton.className = 'sound-toggle';
soundButton.type = 'button';
soundButton.setAttribute('aria-pressed', 'true');
soundButton.setAttribute('aria-label', 'Mute all sounds');
soundButton.title = 'Click once to activate cursor audio; use this button to mute all sounds.';
soundButton.textContent = '♪ Sound';
controls.append(soundButton);
soundButton.addEventListener('click', () => {
  soundOn = !soundOn;
  soundButton.setAttribute('aria-pressed', String(soundOn));
  soundButton.setAttribute('aria-label', soundOn ? 'Mute all sounds' : 'Enable sounds');
  soundButton.textContent = soundOn ? '♪ Sound' : '♪ Muted';
  if (soundOn) popSound();
});
const typingLine = document.createElement('p');
typingLine.className = 'typing-line';
typingLine.setAttribute('aria-hidden', 'true');
typingLine.innerHTML = '&gt; <span class="typing-text"></span><i class="typing-caret"></i>';
document.querySelector('.hero-copy').append(typingLine);
const typingText = typingLine.querySelector('.typing-text');
const phrases = ['Curiosity system: online.', 'Exploring: computer hardware.', 'Current fascination: GPUs.', 'Next chapter: still loading...'];
let phraseIndex = 0, character = 0, deleting = false, typingTimer;
function typeNext() {
  clearTimeout(typingTimer);
  if (paused || document.hidden) { typingText.textContent = phrases[0]; return; }
  const phrase = phrases[phraseIndex];
  character += deleting ? -1 : 1;
  typingText.textContent = phrase.slice(0, character);
  let delay = deleting ? 28 : 58;
  if (!deleting && character >= phrase.length) { deleting = true; delay = 2200; }
  else if (deleting && character <= 0) { deleting = false; phraseIndex = (phraseIndex + 1) % phrases.length; delay = 450; }
  typingTimer = setTimeout(typeNext, delay);
}
function resize() {
  width = innerWidth; height = innerHeight; dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
  context?.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resize();
addEventListener('resize', resize, {passive:true});
function addParticle(x, y, burst = false) {
  if (particles.length >= 170) particles.shift();
  const angle = Math.random() * Math.PI * 2;
  const speed = burst ? 1.5 + Math.random() * 5 : .15 + Math.random() * .5;
  particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,r:burst ? 2 + Math.random()*7 : 2 + Math.random()*4,life:1,decay:burst ? .018 + Math.random()*.012 : .018,hue:Math.random()>.5 ? 165 : 220});
}
function glassSplash(element) {
  if (paused || performance.now()-lastSplash < 350) return;
  const rect=element.getBoundingClientRect();
  if (rect.bottom<0 || rect.top>height) return;
  lastSplash=performance.now();
  const x=Math.max(35,Math.min(width-35,rect.left+rect.width*.5));
  const y=Math.max(110,Math.min(height-40,rect.top+Math.min(rect.height*.4,160)));
  const count=finePointer.matches?13:8;
  for(let i=0;i<count;i++) {
    if(particles.length>=170)particles.shift();
    const angle=(i/count)*Math.PI*2;
    const speed=2+Math.random()*4;
    particles.push({shard:true,x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed-1,r:10+Math.random()*24,rotation:angle,spin:(Math.random()-.5)*.12,life:1,decay:.013+Math.random()*.008});
  }
  for(let i=0;i<10;i++)addParticle(x,y,true);
}
function cursorSound(kind, intensity=1) {
  if(!soundOn || paused || !audio || audio.state!=='running' || performance.now()-lastCursorSound<220)return;
  lastCursorSound=performance.now();
  try {
    const oscillator=audio.createOscillator(),gain=audio.createGain(),now=audio.currentTime;
    oscillator.type='sine';
    const start=kind==='hover'?1060:360+intensity*160;
    oscillator.frequency.setValueAtTime(start,now);
    oscillator.frequency.exponentialRampToValueAtTime(start*.64,now+.09);
    gain.gain.setValueAtTime(.0001,now);
    gain.gain.exponentialRampToValueAtTime(kind==='hover'?.018:.007,now+.012);
    gain.gain.exponentialRampToValueAtTime(.0001,now+.11);
    oscillator.connect(gain);gain.connect(audio.destination);oscillator.start();oscillator.stop(now+.12);
    oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
  } catch { /* Keep visual interactions available when audio is unavailable. */ }
}
function draw(now) {
  animationId = 0;
  if (paused || document.hidden) return;
  const step = Math.min((now - lastFrame) / 16.67 || 1, 2.5); lastFrame = now;
  if (pointerVisible && finePointer.matches) {
    const oldX=cursorX,oldY=cursorY;
    cursorX += (pointerX-cursorX)*.18; cursorY += (pointerY-cursorY)*.18;
    const dx=cursorX-oldX,dy=cursorY-oldY,distance=Math.hypot(dx,dy);
    cursorSpeed+=(distance-cursorSpeed)*.15;
    cursor.style.transform = `translate3d(${cursorX}px,${cursorY}px,0)`;
    const stretch=Math.min(cursorSpeed*.008,.22);
    cursor.style.borderRadius=`${50-stretch*35}% ${50+stretch*35}% ${50-stretch*25}% ${50+stretch*25}%`;
    glow.style.transform = `translate3d(${pointerX}px,${pointerY}px,0)`;
    if(distance>.7){
      const count=Math.min(5,Math.max(1,Math.ceil(distance/9)));
      for(let i=0;i<count;i++)addParticle(oldX+dx*(i+1)/count,oldY+dy*(i+1)/count);
      if(cursorSpeed>3)cursorSound('flow',Math.min(cursorSpeed/20,1));
    }
  }
  if (context) {
    context.clearRect(0,0,width,height);
    if(pointerVisible && finePointer.matches){
      liquidTrail.forEach((bubble,i)=>{
        const target=i===0?{x:cursorX,y:cursorY}:liquidTrail[i-1];
        const follow=1-Math.pow(.72,step);
        bubble.x+=(target.x-bubble.x)*follow;bubble.y+=(target.y-bubble.y)*follow;
        const dx=target.x-bubble.x,dy=target.y-bubble.y;
        const radius=(12-i*.9)*Math.min(cursorSpeed/3,1);
        if(radius<.5)return;
        context.save();context.translate(bubble.x,bubble.y);context.rotate(Math.atan2(dy,dx));
        const shine=context.createRadialGradient(-radius*.3,-radius*.4,0,0,0,radius*1.5);
        shine.addColorStop(0,`rgba(230,255,255,${.23-i*.015})`);
        shine.addColorStop(.35,'rgba(174,221,255,.035)');shine.addColorStop(1,'rgba(183,164,255,.09)');
        context.beginPath();context.ellipse(0,0,radius*(1+Math.min(Math.hypot(dx,dy)*.018,.65)),radius,0,0,Math.PI*2);
        context.fillStyle=shine;context.fill();context.strokeStyle=`rgba(185,235,255,${.25-i*.02})`;context.lineWidth=.65;context.stroke();context.restore();
      });
    }
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => {
      p.x += p.vx*step; p.y += p.vy*step; p.vy += .025*step; p.life -= p.decay*step;
      const alpha = Math.max(0,p.life);
      if(p.shard){
        p.rotation+=p.spin*step;
        context.save();context.translate(p.x,p.y);context.rotate(p.rotation);
        context.beginPath();context.moveTo(-p.r*.65,-p.r*.35);context.lineTo(p.r*.8,-p.r*.65);context.lineTo(p.r*.15,p.r);context.closePath();
        const glass=context.createLinearGradient(-p.r,-p.r,p.r,p.r);
        glass.addColorStop(0,`rgba(234,255,255,${alpha*.35})`);glass.addColorStop(.4,`rgba(159,224,255,${alpha*.045})`);glass.addColorStop(1,`rgba(190,170,255,${alpha*.19})`);
        context.fillStyle=glass;context.fill();context.strokeStyle=`rgba(206,244,255,${alpha*.65})`;context.lineWidth=.75;context.stroke();context.restore();return;
      }
      context.beginPath();context.arc(p.x,p.y,p.r*alpha,0,Math.PI*2);
      context.fillStyle = `hsla(${p.hue},90%,85%,${alpha*.12})`;
      context.strokeStyle = `hsla(${p.hue},90%,88%,${alpha*.65})`;
      context.lineWidth = .8; context.fill(); context.stroke();
      context.beginPath();context.arc(p.x-p.r*.25,p.y-p.r*.3,Math.max(.25,p.r*.16*alpha),0,Math.PI*2);
      context.fillStyle = `rgba(255,255,255,${alpha*.7})`; context.fill();
    });
  }
  animationId = requestAnimationFrame(draw);
}
function startDrawing() { if (!animationId && !paused && !document.hidden) { lastFrame=performance.now(); animationId=requestAnimationFrame(draw); } }
addEventListener('pointermove', event => {
  if (paused || !finePointer.matches || event.pointerType === 'touch') return;
  pointerX=event.clientX;pointerY=event.clientY;
  if (!pointerVisible) { cursorX=pointerX;cursorY=pointerY;liquidTrail.forEach(p=>{p.x=pointerX;p.y=pointerY;}); }
  pointerVisible=true;cursor.style.opacity='1';glow.style.opacity='1';
}, {passive:true});
document.documentElement.addEventListener('pointerleave', () => { pointerVisible=false;cursor.style.opacity='0';glow.style.opacity='0'; });
function popSound() {
  if (!soundOn || performance.now()-lastPop<65) return;
  lastPop=performance.now();
  try {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    audio ||= new Audio();
    if (audio.state === 'suspended') audio.resume().catch(()=>{});
    const oscillator=audio.createOscillator(), gain=audio.createGain();
    oscillator.type='sine';
    oscillator.frequency.setValueAtTime(620,audio.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(140,audio.currentTime+.085);
    gain.gain.setValueAtTime(.0001,audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(.075,audio.currentTime+.006);
    gain.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+.12);
    oscillator.connect(gain);gain.connect(audio.destination);oscillator.start();oscillator.stop(audio.currentTime+.13);
    oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
  } catch { /* Sound is optional when the browser does not support it. */ }
}
addEventListener('click', event => {
  if (event.target.closest('.sound-toggle,.motion-toggle')) return;
  popSound();
  if (paused) return;
  const rect = event.target.getBoundingClientRect();
  const x = event.detail === 0 ? rect.left+rect.width/2 : event.clientX;
  const y = event.detail === 0 ? rect.top+rect.height/2 : event.clientY;
  for(let i=0;i<22;i++) addParticle(x,y,true);
  const ring=document.createElement('div');ring.className='ripple';ring.style.left=x+'px';ring.style.top=y+'px';ring.setAttribute('aria-hidden','true');document.body.append(ring);ring.addEventListener('animationend',()=>ring.remove(),{once:true});
  cursor.classList.add('clicking');setTimeout(()=>cursor.classList.remove('clicking'),180);
});
document.querySelectorAll('a,button,.tilt').forEach(element => {
  element.addEventListener('pointerenter',()=>{cursor.classList.add('hover');cursorLabel.textContent=element.dataset.cursor || (element.tagName==='A'?'↗':'');if(finePointer.matches)cursorSound('hover');});
  element.addEventListener('pointerleave',()=>{cursor.classList.remove('hover');cursorLabel.textContent='';});
});
document.querySelectorAll('.tilt').forEach(card => {
  card.addEventListener('pointermove', event => {
    if (paused || !finePointer.matches || event.pointerType==='touch') return;
    const r=card.getBoundingClientRect(),x=(event.clientX-r.left)/r.width,y=(event.clientY-r.top)/r.height;
    card.style.setProperty('--tx',`${(y-.5)*-7}deg`);card.style.setProperty('--ty',`${(x-.5)*8}deg`);
    card.style.setProperty('--mx',`${x*100}%`);card.style.setProperty('--my',`${y*100}%`);
  });
  card.addEventListener('pointerleave',()=>{card.style.setProperty('--tx','0deg');card.style.setProperty('--ty','0deg');});
});
scene.addEventListener('pointermove', event => {
  if (paused || !finePointer.matches || event.pointerType==='touch') return;
  const r=scene.getBoundingClientRect();scene.style.setProperty('--rx',`${((event.clientY-r.top)/r.height-.5)*-20}deg`);scene.style.setProperty('--ry',`${((event.clientX-r.left)/r.width-.5)*25}deg`);
});
scene.addEventListener('pointerleave',()=>{scene.style.setProperty('--rx','0deg');scene.style.setProperty('--ry','0deg');});
document.querySelectorAll('.magnetic').forEach(element=>{
  element.addEventListener('pointermove',event=>{
    if(paused || !finePointer.matches || event.pointerType==='touch')return;
    const r=element.getBoundingClientRect();element.style.translate=`${(event.clientX-r.left-r.width/2)*.15}px ${(event.clientY-r.top-r.height/2)*.2}px`;
  });element.addEventListener('pointerleave',()=>{element.style.translate='0 0';});
});
const reveals=document.querySelectorAll('.reveal');
if (!reducedMotion.matches && 'IntersectionObserver' in window) {
  document.documentElement.classList.add('js-motion');
  const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{
    if(entry.isIntersecting){
      entry.target.classList.add('visible');
      if(!paused){entry.target.classList.add('splash-in');glassSplash(entry.target);entry.target.addEventListener('animationend',()=>entry.target.classList.remove('splash-in'),{once:true});}
      observer.unobserve(entry.target);
    }
  });},{threshold:.08,rootMargin:'0px 0px -30px 0px'});
  reveals.forEach(element=>observer.observe(element));
}
function setMotion() {
  document.body.classList.toggle('motion-paused',paused);
  motionButton.setAttribute('aria-pressed',String(paused));
  motionButton.setAttribute('aria-label',paused?'Enable animations':'Pause animations');
  motionButton.querySelector('.motion-icon').textContent=paused?'▷':'Ⅱ';
  motionButton.querySelector('.motion-label').textContent=paused?'Motion off':'Motion on';
  if(paused){cancelAnimationFrame(animationId);animationId=0;particles=[];cursorSpeed=0;context?.clearRect(0,0,width,height);document.querySelectorAll('.ripple').forEach(el=>el.remove());reveals.forEach(el=>{el.classList.add('visible');el.classList.remove('splash-in');});}
  else startDrawing();
  character=0;deleting=false;typeNext();
}
motionButton.addEventListener('click',()=>{paused=!paused;setMotion();});
reducedMotion.addEventListener('change',()=>{paused=reducedMotion.matches;setMotion();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(animationId);animationId=0;clearTimeout(typingTimer);}else{startDrawing();typeNext();}});
let scrollQueued=false;
function updateScroll(){const max=document.documentElement.scrollHeight-innerHeight;progress.style.width=`${max>0?scrollY/max*100:0}%`;scrollQueued=false;}
addEventListener('scroll',()=>{if(!scrollQueued){scrollQueued=true;requestAnimationFrame(updateScroll);}},{passive:true});
updateScroll();setMotion();
