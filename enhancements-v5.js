(()=>{
  const $=id=>document.getElementById(id);
  function toast(msg){
    let t=document.getElementById('rienToast');
    if(!t){t=document.createElement('div');t.id='rienToast';Object.assign(t.style,{position:'fixed',left:'50%',bottom:'110px',transform:'translateX(-50%)',zIndex:'9999',padding:'12px 16px',borderRadius:'16px',background:'#111528',color:'#fff',border:'1px solid #ffffff22',boxShadow:'0 12px 40px #0008',font:'600 14px system-ui',maxWidth:'88vw',textAlign:'center'});document.body.appendChild(t)}
    t.textContent=msg;t.style.opacity='1';clearTimeout(t._timer);t._timer=setTimeout(()=>t.style.opacity='0',2600);
  }

  async function makeStoryBlob(){
    const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1920;const c=canvas.getContext('2d');
    const g=c.createLinearGradient(0,0,1080,1920);g.addColorStop(0,'#050711');g.addColorStop(.5,'#10112b');g.addColorStop(1,'#090a13');c.fillStyle=g;c.fillRect(0,0,1080,1920);
    for(let i=0;i<90;i++){c.globalAlpha=.18+Math.random()*.45;c.fillStyle='#fff';c.beginPath();c.arc(Math.random()*1080,Math.random()*1920,Math.random()*2+1,0,Math.PI*2);c.fill()}c.globalAlpha=1;
    const rg=c.createRadialGradient(540,800,20,540,800,430);rg.addColorStop(0,'#a35cffaa');rg.addColorStop(.45,'#6c49ff44');rg.addColorStop(1,'#00000000');c.fillStyle=rg;c.fillRect(50,300,980,1000);
    c.textAlign='center';c.fillStyle='#fff';c.font='900 150px system-ui';c.fillText('RIEN™',540,420);
    c.fillStyle='#c8b0ff';c.font='700 38px system-ui';c.fillText("L'ART DE NE RIEN FAIRE",540,500);
    c.beginPath();c.arc(540,830,255,0,Math.PI*2);c.fillStyle='#0c0f1c';c.fill();c.lineWidth=18;c.strokeStyle='#8d55ff';c.shadowBlur=70;c.shadowColor='#8d55ff';c.stroke();c.shadowBlur=0;
    c.fillStyle='#fff';c.font='900 110px system-ui';c.fillText('RIEN',540,865);
    const count=document.getElementById('personalCount')?.textContent||'0';
    c.fillStyle='#a9b0cf';c.font='600 42px system-ui';c.fillText("J'ai fait RIEN",540,1210);c.fillStyle='#d875ff';c.font='900 150px system-ui';c.fillText(count,540,1370);c.fillStyle='#a9b0cf';c.font='600 42px system-ui';c.fillText('fois',540,1445);
    c.fillStyle='#fff';c.font='700 42px system-ui';c.fillText('Qui me rejoint dans le vide ?',540,1620);
    c.fillStyle='#8f96b7';c.font='500 30px system-ui';c.fillText('mathscreve-toy.github.io/RIEN',540,1715);
    return await new Promise(r=>canvas.toBlob(r,'image/png',.95));
  }

  async function shareStoryCard(){
    const blob=await makeStoryBlob(); if(!blob) return toast('Impossible de créer la Story.');
    const file=new File([blob],'rien-story.png',{type:'image/png'});
    try{
      if(navigator.share && (!navigator.canShare || navigator.canShare({files:[file]}))){
        await navigator.share({title:'RIEN™',text:'Mon exploit inutile du jour.',files:[file]});return;
      }
    }catch(e){if(e?.name==='AbortError')return;}
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='rien-story.png';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500);toast('Carte Story créée. Ajoute-la à Instagram, TikTok ou Facebook.');
  }

  function addStoryButton(){
    const grid=document.querySelector('#shareDialog .social-grid');if(!grid||document.getElementById('storyCardButton'))return;
    const b=document.createElement('button');b.id='storyCardButton';b.className='social story-card';b.type='button';b.innerHTML='<span style="font-size:24px">▣</span><span>Carte Story</span>';b.addEventListener('click',shareStoryCard);grid.appendChild(b);
  }

  function addLegalLinks(){
    const terms=document.getElementById('termsLabel');if(!terms||document.getElementById('legalLinks'))return;
    const p=document.createElement('p');p.id='legalLinks';p.style.cssText='font-size:12px;color:#8f96b7;line-height:1.45;margin:4px 0 12px';p.innerHTML='En créant un compte, tu acceptes les <a href="terms.html" target="_blank" style="color:#c7a7ff">CGU</a> et la <a href="privacy.html" target="_blank" style="color:#c7a7ff">politique de confidentialité</a>.';terms.after(p);
  }

  function handleAuthReturn(){
    const hash=location.hash||'';const q=new URLSearchParams(location.search);
    if(hash.includes('access_token')||q.get('code')){toast('Email validé. Bienvenue dans RIEN™.');setTimeout(()=>history.replaceState({},'',location.pathname),1200)}
    if(q.get('error_description')) toast(decodeURIComponent(q.get('error_description')));
  }

  function installPrompt(){
    let deferred=null;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;const top=document.querySelector('.top-icons');if(!top||document.getElementById('installAppButton'))return;const b=document.createElement('button');b.id='installAppButton';b.className='account-pill';b.textContent='Installer';b.onclick=async()=>{if(!deferred)return;deferred.prompt();await deferred.userChoice;deferred=null;b.remove()};top.prepend(b)});
  }

  document.addEventListener('DOMContentLoaded',()=>{addStoryButton();addLegalLinks();handleAuthReturn();installPrompt()});
})();