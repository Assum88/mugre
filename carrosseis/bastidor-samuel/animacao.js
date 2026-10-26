// Movimento de cada slide, para a versão em vídeo (animar.js).
// Linguagem das referências (carrossel-custo v02 e imprevisto v04): o slide já abre montado, igual ao PNG,
// e quem se move são detalhes vivos — luz passando no dourado, um pulso de energia correndo pela curva,
// poeira dourada, palavras-chave acendendo, o objeto de cada etapa funcionando. Nada de "entrar na tela".
// Tudo é função do tempo t (ms): Web Animations para CSS e __tick(t) para o canvas,
// então o exportador para o relógio e captura quadro a quadro. Ciclo de 6 s, que fecha em loop.
(function(){
  const DUR=6000, W=1080, H=1350;
  const GOLD='232,184,75', CREAM='255,240,200';
  const ease=x=>x<0?0:x>1?1:x*x*(3-2*x);
  const rnd=seed=>()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};

  const ticks=[];
  window.__tick=t=>ticks.forEach(f=>f(t));

  // canvas preso ao slide n: 'back' fica atrás do texto, 'front' por cima
  function layer(strip,n,front){
    const c=document.createElement('canvas');c.width=W;c.height=H;
    Object.assign(c.style,{position:'absolute',left:n*W+'px',top:0,width:W+'px',height:H+'px',pointerEvents:'none'});
    front?strip.appendChild(c):strip.insertBefore(c,strip.querySelector('svg.waves'));
    return c.getContext('2d');
  }
  // envolve trechos de texto num <span> para poder acender palavra a palavra
  function wrap(el,words){
    return words.map(w=>{const i=el.innerHTML.indexOf(w);if(i<0)return null;
      el.innerHTML=el.innerHTML.slice(0,i)+`<span class="kw">${w}</span>`+el.innerHTML.slice(i+w.length);
      return [...el.querySelectorAll('.kw')].find(s=>s.textContent===w)}).filter(Boolean);
  }
  // brilho que atravessa uma palavra dourada (como o reflexo no logo do imprevisto)
  function shine(el,delay,period){
    Object.assign(el.style,{backgroundImage:`linear-gradient(100deg,var(--amber) 0 42%,#FFF4D6 50%,var(--amber) 58% 100%)`,
      backgroundSize:'300% 100%',backgroundClip:'text',webkitBackgroundClip:'text',color:'transparent'});
    el.animate([{backgroundPosition:'100% 0'},{backgroundPosition:'0% 0'}],{duration:1400,delay,easing:'cubic-bezier(.4,0,.2,1)',fill:'both',iterations:Infinity,endDelay:period-1400});
  }
  // acende uma palavra em dourado e devolve ao branco
  function glow(el,delay,hold=1200){
    el.animate([{color:'var(--paper)'},{color:'var(--amber)',offset:.15},{color:'var(--amber)',offset:.85},{color:'var(--paper)'}],
      {duration:hold,delay,easing:'ease-in-out',fill:'none'});
  }

  // poeira dourada subindo devagar, em loop perfeito de 6 s
  function dust(ctx,count,seed,area){
    const r=rnd(seed),ps=[...Array(count)].map(()=>({x:area.x+r()*area.w,y:r()*H,s:.6+r()*1.8,v:20+r()*40,ph:r()*6.28,dx:(r()-.5)*30}));
    return t=>{const k=t/DUR;
      ps.forEach(p=>{const y=((p.y-p.v*6*k)%H+H)%H,x=p.x+p.dx*Math.sin(k*6.28+p.ph),a=.25+.55*Math.max(0,Math.sin(k*12.57+p.ph));
        const g=ctx.createRadialGradient(x,y,0,x,y,p.s*5);g.addColorStop(0,`rgba(${CREAM},${a})`);g.addColorStop(.4,`rgba(${GOLD},${a*.5})`);g.addColorStop(1,`rgba(${GOLD},0)`);
        ctx.fillStyle=g;ctx.fillRect(x-p.s*5,y-p.s*5,p.s*10,p.s*10)})};
  }
  // clarão de lente: núcleo, halo e o risco horizontal
  function flare(ctx,x,y,f,scale=1){
    if(f<=0)return;
    let g=ctx.createRadialGradient(x,y,0,x,y,170*scale);
    g.addColorStop(0,`rgba(255,255,245,${.95*f})`);g.addColorStop(.12,`rgba(${CREAM},${.7*f})`);g.addColorStop(.4,`rgba(${GOLD},${.25*f})`);g.addColorStop(1,`rgba(${GOLD},0)`);
    ctx.fillStyle=g;ctx.fillRect(x-170*scale,y-170*scale,340*scale,340*scale);
    ctx.save();ctx.translate(x,y);ctx.scale(1,.035);
    g=ctx.createRadialGradient(0,0,0,0,0,520*scale);g.addColorStop(0,`rgba(${CREAM},${.8*f})`);g.addColorStop(1,`rgba(${GOLD},0)`);
    ctx.fillStyle=g;ctx.fillRect(-520*scale,-520*scale,1040*scale,1040*scale);ctx.restore();
  }

  window.__animar=function(n){
    const strip=document.querySelector('#exportRoot .strip');
    const sec=strip.querySelectorAll('section.s')[n];
    const yAt=window.__yAt, x0=n*W;
    const back=layer(strip,n,false), front=layer(strip,n,true);
    const r=rnd(n+11);

    // fundo: uma luz azul passeia devagar pelo slide (ida e volta, fecha o loop)
    const lx=[.25,.75,.3,.7,.35,.65,.5,.8][n];
    ticks.push(t=>{back.clearRect(0,0,W,H);const k=.5-.5*Math.cos(t/DUR*6.283),x=W*(lx+(.5-lx)*k*1.2),y=H*(.32+.18*k);
      const g=back.createRadialGradient(x,y,0,x,y,620);g.addColorStop(0,'rgba(59,139,235,.16)');g.addColorStop(1,'rgba(59,139,235,0)');
      back.fillStyle=g;back.fillRect(0,0,W,H)});
    // ondas concêntricas respiram
    strip.querySelectorAll('.wave').forEach((g,i)=>g.animate(
      [{transform:'scale(1) rotate(0deg)'},{transform:`scale(1.05) rotate(${i%2?-3:3}deg)`},{transform:'scale(1) rotate(0deg)'}],
      {duration:DUR,easing:'ease-in-out',iterations:Infinity}));

    // pulso de energia correndo pela curva (sai do slide anterior e segue para o próximo)
    const last=n===7, palco=8460, t0=500, t1=last?2700:3300;
    const xEnd=last?palco:x0+W+120;
    ticks.push(t=>{
      const k=(t-t0)/(t1-t0);if(k<0||k>1.25)return;
      const head=x0-120+(xEnd-(x0-120))*ease(Math.min(k,1)),fade=k>1?1-(k-1)/.25:1;
      front.save();front.globalCompositeOperation='lighter';
      for(let j=0;j<40;j++){const x=head-j*9;if(x<x0-20)break;const a=(1-j/40)**2*.55*fade,y=yAt(x);
        front.fillStyle=`rgba(${CREAM},${a})`;front.beginPath();front.arc(x-x0,y,7-j*.13,0,6.283);front.fill()}
      if(!last||k<1)flare(front,head-x0,yAt(head),.55*fade,.45);
      front.restore()});
    // poeira: discreta em todos, mais densa na capa, no Dia D e no fechamento
    const dz=dust(front,[60,26,22,22,22,22,50,70][n],n*7+3,{x:0,w:W});
    ticks.push(t=>{front.clearRect(0,0,W,H);front.save();front.globalCompositeOperation='lighter';dz(t);front.restore()});
    ticks.reverse(); // limpa o canvas antes do pulso

    if(n===0){
      // capa: a luz passa por "palestra"; a foto respira; a seta chama o swipe
      shine(sec.querySelector('.hd em'),700,DUR);
      const img=sec.querySelector('.foto img');img.style.transformOrigin='50% 100%';
      img.animate([{transform:'scale(1)'},{transform:'scale(1.025)'},{transform:'scale(1)'}],{duration:DUR,easing:'ease-in-out',iterations:Infinity});
      const arrow=[...sec.querySelectorAll('.mono')].find(e=>e.textContent.includes('ARRASTA'));
      arrow.innerHTML=arrow.innerHTML.replace('→','<span class="arw" style="display:inline-block">→</span>');
      arrow.querySelector('.arw').animate([{transform:'none'},{transform:'translateX(14px)',offset:.15},{transform:'none',offset:.3},{transform:'none'}],{duration:2000,iterations:Infinity,easing:'ease-in-out'});
    }
    if(n===1){ // convite: cada plateia acende na sua vez
      shine(sec.querySelector('.hd em'),400,DUR);
      const kws=wrap(sec.querySelectorAll('.tx')[1],['equipe de vendas','representantes farmacêuticos','líderes de empresa']);
      kws.forEach((el,k)=>glow(el,1400+k*1100,1300));
    }
    if(n===2){ // pesquisa: o material vai sendo juntado
      shine(sec.querySelector('.hd em'),400,DUR);
      const kws=wrap(sec.querySelectorAll('.tx')[0],['dados','histórias','exemplo']);
      kws.forEach((el,k)=>glow(el,1500+k*900,1700));
      glow(wrap(sec.querySelectorAll('.tx')[1],['bem mais material'])[0],4300,1500);
    }
    if(n===3){ // estrutura: um pulso percorre o rascunho e acende cada bloco
      shine(sec.querySelector('.hd em'),400,DUR);
      const flow=sec.querySelector('.flow'),dot=document.createElement('i');
      Object.assign(dot.style,{position:'absolute',top:'3px',left:'0',width:'20px',height:'20px',borderRadius:'50%',background:'#FFF4D6',
        boxShadow:'0 0 18px 8px rgba(232,184,75,.75),0 0 60px 20px rgba(232,184,75,.35)'});
      flow.appendChild(dot);
      dot.animate([{transform:'translateX(-10px)',opacity:0},{opacity:1,offset:.05},{transform:'translateX(910px)',opacity:1,offset:.9},{transform:'translateX(930px)',opacity:0}],
        {duration:3400,delay:900,easing:'cubic-bezier(.45,0,.55,1)',fill:'none'});
      sec.querySelectorAll('.st').forEach((st,k)=>{
        const at=900+3400*.9*(k/4.1)+40;
        st.querySelector('i').animate([{transform:'scale(1)',boxShadow:'0 0 0 0 rgba(232,184,75,0)'},{transform:'scale(1.35)',boxShadow:'0 0 24px 6px rgba(232,184,75,.7)',offset:.25},{transform:'scale(1)',boxShadow:'0 0 0 0 rgba(232,184,75,0)'}],{duration:900,delay:at});
        st.querySelector('span').animate([{color:'var(--paper)'},{color:'var(--amber)',offset:.2},{color:'var(--amber)',offset:.7},{color:'var(--paper)'}],{duration:1500,delay:at});
      });
    }
    if(n===4){ // ensaio: o celular está gravando de verdade — REC, cronômetro e a onda da voz
      shine(sec.querySelector('.hd em'),400,DUR);
      sec.querySelector('.rec-dot').animate([{opacity:1},{opacity:.15},{opacity:1}],{duration:1000,iterations:Infinity});
      const tm=sec.querySelector('.rec-time');
      const scr=sec.querySelector('.rec-dot').closest('div').parentElement;
      const bars=document.createElement('div');
      Object.assign(bars.style,{position:'absolute',left:'22px',right:'22px',top:'78px',height:'70px',display:'flex',alignItems:'center',gap:'5px'});
      const bs=[...Array(16)].map(()=>{const b=document.createElement('i');Object.assign(b.style,{flex:'1',height:'10px',borderRadius:'3px',background:'var(--amber)'});bars.appendChild(b);return b});
      scr.appendChild(bars);
      const ph=bs.map(()=>r()*6.28),fq=bs.map(()=>1.5+r()*2.5);
      ticks.push(t=>{const s=38*60+12+Math.floor(t/1000);tm.textContent=String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
        const env=.35+.65*Math.abs(Math.sin(t/DUR*6.283*3));
        bs.forEach((b,i)=>{b.style.height=(8+58*env*Math.abs(Math.sin(t/1000*fq[i]*3.14+ph[i])))+'px'})});
      wrap(sec.querySelectorAll('.tx')[0],['uma palavra repetida','um gesto que volta toda hora']).forEach((el,k)=>glow(el,1600+k*1400,1400));
    }
    if(n===5){ // véspera: a lista de mala vai sendo ticada
      shine(sec.querySelector('.hd em'),400,DUR);
      sec.querySelectorAll('.tops li').forEach((li,k)=>{
        const ck=document.createElementNS('http://www.w3.org/2000/svg','svg');ck.setAttribute('viewBox','0 0 24 24');
        Object.assign(ck.style,{position:'absolute',left:'-6px',top:'.08em',width:'34px',height:'34px',overflow:'visible'});
        ck.innerHTML='<path d="M3 13 L9 19 L22 4" fill="none" stroke="#FFF4D6" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" style="filter:drop-shadow(0 0 6px rgba(232,184,75,.9))"/>';
        li.appendChild(ck);
        const at=1200+k*750;
        ck.firstChild.animate([{strokeDashoffset:1},{strokeDashoffset:0}],{duration:380,delay:at,easing:'cubic-bezier(.3,0,.2,1)',fill:'forwards'});
        ck.animate([{opacity:1},{opacity:1,offset:.9},{opacity:0}],{duration:DUR,iterations:1,fill:'both'});
        li.animate([{color:'var(--paper)'},{color:'var(--amber)',offset:.3},{color:'var(--paper)'}],{duration:900,delay:at});
      });
    }
    if(n===6){ // dia D: o refletor oscila, o título brilha e o "brrrr" vibra
      shine(sec.querySelector('.hd'),300,DUR);
      const beam=sec.querySelector('.beam');beam.style.transformOrigin='540px 0px';
      beam.animate([{transform:'rotate(-4deg)',opacity:.06},{transform:'rotate(4deg)',opacity:.11},{transform:'rotate(-4deg)',opacity:.06}],{duration:DUR,easing:'ease-in-out',iterations:Infinity});
      const br=sec.querySelector('.tops.warm li:nth-child(2)');
      const b=wrap(br,['“brrrr”'])[0];b.style.display='inline-block';
      ticks.push(t=>{const on=(t%3000)>1200&&(t%3000)<2400;b.style.transform=on?`translate(${(Math.sin(t*.9)*2.2).toFixed(1)}px,${(Math.cos(t*1.3)*1.6).toFixed(1)}px)`:'none';b.style.color=on?'var(--amber)':''});
      sec.querySelectorAll('.tops.warm li b').forEach((el,k)=>el.animate([{textShadow:'0 0 0 rgba(232,184,75,0)'},{textShadow:'0 0 18px rgba(232,184,75,.9)',offset:.3},{textShadow:'0 0 0 rgba(232,184,75,0)'}],{duration:1100,delay:1300+k*1000}));
    }
    if(n===7){ // fechamento: o pulso chega ao palco e acende; a luz passa no logo
      shine(sec.querySelector('.hd em'),3400,DUR);
      const px=palco-x0,py=yAt(palco),burst=[...Array(36)].map(()=>({a:r()*6.283,v:120+r()*260,s:1+r()*2}));
      ticks.push(t=>{const k=(t-2700)/1000;if(k<0)return;
        const f=k<.25?k/.25:Math.max(.35,1-(k-.25)*.5),pulse=.12*Math.sin(t/260);
        front.save();front.globalCompositeOperation='lighter';flare(front,px,py,f+pulse*(k>1.6?1:0),1.1);
        burst.forEach(p=>{const d=p.v*Math.min(k,2.2)*(1-Math.min(k,2.2)/4.4),a=Math.max(0,1-k/2.6);
          front.fillStyle=`rgba(${CREAM},${a*.9})`;front.beginPath();front.arc(px+Math.cos(p.a)*d,py+Math.sin(p.a)*d,p.s,0,6.283);front.fill()});
        front.restore()});
      const logo=sec.querySelector('.logo'),sh=document.createElement('div');
      Object.assign(sh.style,{position:'absolute',inset:0,background:'linear-gradient(100deg,transparent 40%,rgba(255,250,230,.95) 50%,transparent 60%)',backgroundSize:'300% 100%',
        webkitMaskImage:`url(${logo.querySelector('img').src})`,maskImage:`url(${logo.querySelector('img').src})`,maskSize:'contain',webkitMaskSize:'contain',maskRepeat:'no-repeat',webkitMaskRepeat:'no-repeat',maskPosition:'left center',webkitMaskPosition:'left center'});
      logo.appendChild(sh);
      sh.animate([{backgroundPosition:'100% 0'},{backgroundPosition:'0% 0'}],{duration:1300,delay:4200,easing:'ease-in-out',fill:'both'});
    }
    return DUR;
  };
})();
