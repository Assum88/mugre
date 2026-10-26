// Movimento de cada slide, para a versão em vídeo (animar.js).
// As entradas básicas (data-a em index.html) já vêm do CSS ao ligar .play; aqui ficam as extras.
// Tudo usa Web Animations, então o exportador consegue parar o relógio e capturar quadro a quadro.
(function(){
  const EASE='cubic-bezier(.2,.8,.2,1)';
  // duração de cada vídeo, em ms (o 7 tem mais texto)
  const DUR=[6000,6000,6000,7000,6500,7000,8000,6500];

  const stagger=(els,delay,step,frames,opts={})=>[...els].forEach((el,k)=>
    el.animate(frames,{duration:700,easing:EASE,fill:'both',...opts,delay:delay+k*step}));
  const rise=[{opacity:0,transform:'translateY(40px)'},{opacity:1,transform:'none'}];

  let tick=()=>{};
  window.__tick=t=>tick(t);

  window.__animar=function(n){
    const strip=document.querySelector('#exportRoot .strip');
    const sec=strip.querySelectorAll('section.s')[n];
    const dur=DUR[n];
    sec.classList.add('play');void sec.offsetWidth;

    // a curva se desenha da borda esquerda à direita do slide, como se a tira continuasse
    const x0=n*1080,clip=x=>`inset(-40px ${8640-x}px -40px -40px)`;
    strip.querySelector('svg.curve').animate([{clipPath:clip(x0)},{clipPath:clip(x0+1080)}],
      {duration:1800,delay:300,easing:'cubic-bezier(.45,0,.2,1)',fill:'both'});
    // as ondas respiram devagar
    strip.querySelectorAll('.wave').forEach((g,i)=>g.animate(
      [{transform:'scale(1) rotate(0deg)'},{transform:`scale(1.06) rotate(${i%2?-4:4}deg)`}],
      {duration:dur,easing:'ease-in-out',fill:'both'}));

    if(n===0){ // capa: a foto assenta com um leve recuo
      const img=sec.querySelector('.foto img');img.style.transformOrigin='50% 100%';
      img.animate([{transform:'scale(1.08)'},{transform:'scale(1)'}],{duration:dur,easing:'cubic-bezier(.3,0,.2,1)',fill:'both'});
    }
    if(n===3){ // estrutura: cada bloco acende quando a linha passa
      stagger(sec.querySelectorAll('.st'),950,180,rise);
      stagger(sec.querySelectorAll('.st i'),950,180,[{transform:'scale(0)'},{transform:'scale(1.3)',offset:.7},{transform:'scale(1)'}],{duration:500});
    }
    if(n===4){ // ensaio: REC pisca e o cronômetro corre
      sec.querySelector('.rec-dot').animate([{opacity:1},{opacity:.15},{opacity:1}],{duration:1000,iterations:Infinity});
      const tm=sec.querySelector('.rec-time');
      tick=t=>{const s=38*60+12+Math.floor(Math.max(0,t)/1000);tm.textContent=String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};
    }
    if(n===5){ // véspera: lista de mala, item a item, com a caixinha marcada
      const li=sec.querySelectorAll('.tops li');
      stagger(li,1100,300,rise);
      stagger(li,1400,300,[{background:'transparent'},{background:'var(--amber)'}],{duration:250,pseudoElement:'::before'});
    }
    if(n===6){ // dia D: o refletor abre do topo e os exercícios entram um a um
      const beam=sec.querySelector('.beam');beam.style.transformOrigin='540px 0px';
      beam.animate([{transform:'scaleX(.05)',opacity:0},{transform:'scaleX(1)',opacity:.07}],{duration:900,easing:EASE,fill:'both'});
      stagger(sec.querySelectorAll('.tops.warm li'),1100,350,rise);
    }
    if(n===7){ // fechamento: o ponto do palco acende quando a curva chega nele
      const p=strip.querySelector('.palco');p.style.transformBox='fill-box';p.style.transformOrigin='center';
      p.animate([{transform:'scale(1)',filter:'none'},{transform:'scale(1.45)',filter:'drop-shadow(0 0 22px var(--amber))'},{transform:'scale(1)',filter:'none'}],
        {duration:1600,delay:1900,iterations:Infinity,easing:'ease-in-out',fill:'both'});
    }
    return dur;
  };
})();
