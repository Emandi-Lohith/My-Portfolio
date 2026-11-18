const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
const reveals = document.querySelectorAll('.reveal');
if (!motion.matches && 'IntersectionObserver' in window) {
  document.documentElement.classList.add('js-motion');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  reveals.forEach(element => observer.observe(element));
}
const progress = document.querySelector('.progress');
let scheduled = false;
function updateProgress() {
  const distance = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.width = `${distance > 0 ? window.scrollY / distance * 100 : 0}%`;
  scheduled = false;
}
window.addEventListener('scroll', () => {
  if (!scheduled) { requestAnimationFrame(updateProgress); scheduled = true; }
}, { passive: true });
updateProgress();
const stage = document.querySelector('.hardware-stage');
const gpu = document.querySelector('.gpu');
stage.addEventListener('pointermove', event => {
  if (motion.matches || event.pointerType === 'touch') return;
  const bounds = stage.getBoundingClientRect();
  const x = (event.clientX - bounds.left) / bounds.width - 0.5;
  const y = (event.clientY - bounds.top) / bounds.height - 0.5;
  gpu.style.transform = `rotate(${-14 + x * 7}deg) rotateY(${-13 + x * 18}deg) rotateX(${18 - y * 18}deg)`;
});
stage.addEventListener('pointerleave', () => { gpu.style.transform = ''; });
const boost = document.querySelector('.spin-button');
boost.addEventListener('click', () => {
  const active = boost.getAttribute('aria-pressed') !== 'true';
  boost.setAttribute('aria-pressed', String(active));
  stage.classList.toggle('boost', active);
  boost.innerHTML = active ? 'Back to idle <span>↘</span>' : 'Boost the fans <span>↗</span>';
});
motion.addEventListener('change', () => {
  if (motion.matches) { gpu.style.transform = ''; reveals.forEach(el => el.classList.add('visible')); }
});
