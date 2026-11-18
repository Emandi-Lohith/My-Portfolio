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
let pointerVisible = false, lastTrail = 0, particles = [], animationId = 0, lastFrame = 0;
let audio, soundOn = true, lastPop = 0;
const controls = document.createElement('div');
controls.className = 'controls';
motionButton.before(controls);
controls.append(motionButton);
const soundButton = document.createElement('button');
soundButton.className = 'sound-toggle';
soundButton.type = 'button';
soundButton.setAttribute('aria-pressed', 'true');
soundButton.setAttribute('aria-label', 'Mute click sounds');
soundButton.textContent = '♪ Sound';
controls.append(soundButton);
soundButton.addEventListener('click', () => {
  soundOn = !soundOn;
  soundButton.setAttribute('aria-pressed', String(soundOn));
  soundButton.setAttribute('aria-label', soundOn ? 'Mute click sounds' : 'Enable click sounds');
  soundButton.textContent = soundOn ? '♪ Sound' : '♪ Muted';
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
  if (particles.length >= 140) particles.shift();
  const angle = Math.random() * Math.PI * 2;
  const speed = burst ? 1.5 + Math.random() * 5 : .15 + Math.random() * .5;
  particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,r:burst ? 2 + Math.random()*7 : 2 + Math.random()*4,life:1,decay:burst ? .018 + Math.random()*.012 : .025,hue:Math.random()>.5 ? 165 : 220});
}
function draw(now) {
  animationId = 0;
  if (paused || document.hidden) return;
  const step = Math.min((now - lastFrame) / 16.67 || 1, 2.5); lastFrame = now;
  if (pointerVisible && finePointer.matches) {
    cursorX += (pointerX-cursorX)*.18; cursorY += (pointerY-cursorY)*.18;
    cursor.style.transform = `translate3d(${cursorX}px,${cursorY}px,0)`;
    glow.style.transform = `translate3d(${pointerX}px,${pointerY}px,0)`;
  }
  if (context) {
    context.clearRect(0,0,width,height);
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => {
      p.x += p.vx*step; p.y += p.vy*step; p.vy += .025*step; p.life -= p.decay*step;
      const alpha = Math.max(0,p.life);
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
  if (!pointerVisible) { cursorX=pointerX;cursorY=pointerY; }
  pointerVisible=true;cursor.style.opacity='1';glow.style.opacity='1';
  if (performance.now()-lastTrail > 24) { addParticle(pointerX,pointerY); lastTrail=performance.now(); }
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
  element.addEventListener('pointerenter',()=>{cursor.classList.add('hover');cursorLabel.textContent=element.dataset.cursor || (element.tagName==='A'?'↗':'');});
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
  const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}});},{threshold:.08});
  reveals.forEach(element=>observer.observe(element));
}
function setMotion() {
  document.body.classList.toggle('motion-paused',paused);
  motionButton.setAttribute('aria-pressed',String(paused));
  motionButton.setAttribute('aria-label',paused?'Enable animations':'Pause animations');
  motionButton.querySelector('.motion-icon').textContent=paused?'▷':'Ⅱ';
  motionButton.querySelector('.motion-label').textContent=paused?'Motion off':'Motion on';
  if(paused){cancelAnimationFrame(animationId);animationId=0;particles=[];context?.clearRect(0,0,width,height);reveals.forEach(el=>el.classList.add('visible'));}
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
