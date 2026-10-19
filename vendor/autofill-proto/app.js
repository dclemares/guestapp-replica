'use strict';

const fieldLabels={nationality:'Nationality',firstName:'First name(s)',surname:'Surname',secondSurname:'Second surname',birthDate:'Date of birth',documentNumber:'Document number',expiryDate:'Expiry date'};
const scanKeys=['firstName','surname','nationality','birthDate','documentNumber','expiryDate'];
function blankForm(){return {nationality:'',firstName:'',surname:'',secondSurname:'',birthDate:'',documentType:'id',documentNumber:'',expiryDate:'',sources:{}};}
function conflictsFor(current,read){return scanKeys.filter(key=>current[key]&&read[key]&&current[key]!==read[key]);}
function mergeRead(current,read,accept={}){
  const next={...current,sources:{...current.sources}};
  for(const key of scanKeys){const value=String(read[key]??'').trim();if(value&&(!current[key]||accept[key])){next[key]=value;next.sources[key]='read';}}
  return next;
}
if(typeof module!=='undefined')module.exports={blankForm,conflictsFor,mergeRead};

if(typeof document!=='undefined'){
  const $=id=>document.getElementById(id);
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let form=blankForm(),profile=profiles[1],attempts=0,token=0,readData=null,docType='id',correctedPhoto=false,partialFixed=false,issuingCountry='',documentKey='',propertyCountry='ES';
  const dialog=$('scan-dialog');
  const announce=message=>{$('live-status').textContent=message;};
  function remember(){for(const key of [...Object.keys(fieldLabels),'documentType'])form[key]=$(key).value;}
  function renderForm(){
    document.querySelectorAll('.read-origin').forEach(el=>el.remove());
    for(const key of [...Object.keys(fieldLabels),'documentType']){$(key).value=form[key];$(key).classList.toggle('read',form.sources[key]==='read');}
    for(const key of scanKeys)if(['read','user_corrected'].includes(form.sources[key])){const label=document.createElement('small');label.className='read-origin';label.textContent=form.sources[key]==='read'?'✓ Read from your document':'✓ Completed with your correction';$(key).parentElement.append(label);}
  }
  function note(message,kind='success'){$('form-notice').textContent=message;$('form-notice').className=`notice ${kind}`;$('form-notice').hidden=false;}
  function reset(){
    token++;if(dialog.open)dialog.close();issuingCountry='';documentKey='';form=blankForm();attempts=0;readData=null;correctedPhoto=false;partialFixed=false;
    if(profile.scenario==='conflict'){form.firstName='Diego';form.surname='García López';form.nationality='Spanish';}
    docType=[2,10].includes(profile.id)?'passport':'id';form.documentType=docType;
    $('profile-select').value=String(profile.id);$('form-notice').hidden=true;renderForm();
    $('profile-detail').innerHTML=`<span class="context-tag">${esc(profile.context)}</span><h4>Expects</h4><p>${esc(profile.expectation)}</p><h4>Simulated feedback</h4><p>“${esc(profile.feedback)}”</p><h4>Decision applied</h4><p>${esc(profile.decision)}</p>`;
    announce(`Profile ${profile.name} ready. Sample data.`);
  }
  // Document type icons (SVG, use the text color)
  const docIcon=type=>type==='passport'
    ?'<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="3.5" width="18" height="25" rx="2.5"/><circle cx="16" cy="13.5" r="5"/><ellipse cx="16" cy="13.5" rx="2.2" ry="5"/><path d="M11 13.5h10"/><rect x="13" y="22.5" width="6" height="3" rx=".8"/></svg>'
    :'<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="26" height="18" rx="3"/><circle cx="11" cy="14" r="2.6"/><path d="M6.5 22c.4-2.6 2.2-4 4.5-4s4.1 1.4 4.5 4"/><path d="M19 13h7M19 17h7M19 21h4.5"/></svg>';
  const stageHtml=(d,cam,flip,fx)=>{
    if(!d)return `<div class="stage ${cam?'cam':''}"><div class="stage-empty"><span aria-hidden="true">▭</span>Choose a country and type to see<br>which side to photograph</div></div>`;
    const passInner=`<div class="pass-stage"><img class="pdata" src="${d.image}" alt="${esc(d.alt)}"><div class="pcover-wrap"><img class="pcover" src="assets/passport/cover.webp" alt=""></div></div>`;
    const inner=flip&&d.formType==='passport'&&fx?passInner:flip&&d.imageOther?`<div class="flip-wrap"><div class="flip-inner" style="--fd:${FLIP_DELAY}s"><div class="face"><img src="${d.imageOther}" alt=""></div><div class="face turned"><img src="${d.image}" alt="${esc(d.alt)}"></div></div></div>`:`<img src="${d.image}" alt="${esc(d.alt)}">`;
    const corners=cam?'<i class="c tl"></i><i class="c tr"></i><i class="c bl"></i><i class="c br"></i>':'';
    return `<div class="stage ${cam?'cam':''}">${fx?`<div class="tilt">${inner}${fx}</div>`:inner}${corners}</div>`;
  };
  function currentDoc(){const d=resolveDocument(issuingCountry,documentKey,propertyCountry);/*REP*/return window.__repFront&&d&&d.imageOther&&d.formType!=='passport'?{...d,side:'front',front:true,image:d.imageOther,imageOther:null,alt:(d.alt||'').replace(/back$/,'front'),mrz:[8,10,40,30]}:d;}
  function typeOptions(){
    return `<option value="">Select</option>${documentsFor(issuingCountry,propertyCountry).map(([key,d])=>`<option value="${key}" ${documentKey===key?'selected':''}>${esc(d.label)}</option>`).join('')}`;
  }
  const stepsHtml=n=>`<ol class="steps" aria-label="Steps"><li class="${n===1?'on':n>1?'done':''}"><b>1</b> Document</li><li class="${n===2?'on':n>2?'done':''}"><b>2</b> Get ready</li><li class="${n===3?'on':''}"><b>3</b> Photo</li></ol>`;
  const sideName=d=>d.sideLabel.split(' · ')[0];
  // Step 1 · choose document
  // Preload: animations don't start until all their images are loaded and decoded
  const preloadCache=new Map();
  function preloadImg(src){
    if(!src)return Promise.resolve(true);
    if(preloadCache.has(src))return preloadCache.get(src);
    const p=new Promise(res=>{
      const im=new Image();im.decoding='async';
      im.onload=()=>(im.decode?im.decode():Promise.resolve()).then(()=>res(true),()=>res(true));
      im.onerror=()=>{preloadCache.delete(src);res(false);};   // if it fails, it can be retried
      im.src=src;
    });
    preloadCache.set(src,p);return p;
  }
  function docAssets(d){return [d.image,d.imageOther,'assets/hand.webp',d.formType==='passport'?'assets/passport/cover.webp':null].filter(Boolean);}
  function preloadDoc(d,ms=8000){
    if(!d)return Promise.resolve(true);
    const all=Promise.all(docAssets(d).map(preloadImg)).then(r=>r.every(Boolean));
    return Promise.race([all,new Promise(r=>setTimeout(()=>r(false),ms))]);
  }
  ['assets/hand.webp','assets/passport/cover.webp'].forEach(preloadImg);   // hand and cover: from startup
  function guide(){
    const d=currentDoc();if(d){docType=d.formType;preloadDoc(d);}   // load while the person is choosing
    const types=documentsFor(issuingCountry,propertyCountry);
    const typeButtons=types.length?`<div class="type-options" role="radiogroup" aria-label="Document type">${types.map(([k,t])=>`<button type="button" role="radio" aria-checked="${documentKey===k}" class="type-option ${documentKey===k?'on':''}" data-action="pick-type" data-key="${k}"><span class="ti" aria-hidden="true">${docIcon(t.formType)}</span><span class="tl">${esc(t.label)}</span></button>`).join('')}</div>`:'<p class="hint">First choose your nationality.</p>';
    const preview=d?`<div class="pick-preview"><div class="pp-img"><img src="${d.image}" alt="${esc(d.alt)}"></div><div class="pp-cap"><b>You will photograph: ${esc(sideName(d))}</b><span>${d.formType==='passport'?'The page with your photo and details.':'Just this side; the other isn\'t needed.'}${d.hint?` <button type="button" class="text-button whats" data-action="doc-help">What\'s this?</button>`:''}</span></div></div>`:'';
    body('Which document will you use?',`<div class="field combo"><label for="issuing-country">Nationality</label><div class="cbx"><input id="issuing-country" class="big-select" role="combobox" aria-expanded="false" aria-controls="country-list" aria-autocomplete="list" autocomplete="off" autocapitalize="words" spellcheck="false" placeholder="Choose a country" value="${esc(documentCatalog[issuingCountry]?.name||'')}"><ul id="country-list" class="cbx-list" role="listbox" hidden></ul></div></div><div class="field"><span class="lbl">Document type</span>${typeButtons}</div>${preview}<div class="dialog-actions single"><button class="primary" data-action="prepare" ${d?'':'disabled'}>Continue</button></div>`,stepsHtml(1),true);   // same height as the other steps: the country list fits inside
  }
  // Document mock-up: photo, data and reading-line zones as a visual reference for the photo
  function genericMock(d){
    const pass=d.formType==='passport',front=d.side==='front';let n=0;
    const part=(cls,style,inner='')=>`<i class="${cls}" style="${style};--i:${n++}">${inner}</i>`;
    const bar=(l,t,w)=>part('mb',`left:${l}%;top:${t}%;width:${w}%`);
    const photo=(l,t,w,h)=>part('mphoto',`left:${l}%;top:${t}%;width:${w}%;height:${h}%`,'<b></b>');
    const lines=pass?['P&lt;XXXMOCK&lt;&lt;DEMO&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;','DEMO000012XXX9001018M3101018&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;']:['IDXXXDEMO00012345&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;','9001017M3101018XXX&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;2','MOCK&lt;&lt;DEMO&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;'];
    let body,top,h;
    if(pass){body=photo(5,13,25,46)+bar(36,14,50)+bar(36,26,38)+bar(36,38,46)+bar(36,50,30);top=74;h=21;}
    else if(front){body=photo(6,14,26,50)+bar(38,16,48)+bar(38,28,36)+bar(38,40,44)+bar(38,52,30);top=68;h=27;}
    else{body=bar(6,12,46)+bar(6,24,34)+bar(6,36,52)+bar(60,12,32)+bar(60,24,28)+part('mchip','left:6%;top:40%');top=62;h=33;}
    const band=`<div class="mband" style="top:${top}%;height:${h}%;--i:${n++}"><pre class="${pass?'p':'i'}">${lines.join('\n')}</pre></div>`;
    return `<div class="cam-mock" aria-hidden="true">${body}${band}</div>`;
  }
  // Simplified flag outline by design type (the type comes from the layout; unknown = just the rectangle)
  function flagSvg(k){
    const ln=p=>`<path d="${p}" class="l"/>`;
    let g='';
    switch(k){
      case'h2':g=ln('M0.8 10h28.4');break;
      case'h3':g=ln('M0.8 7.2h28.4M0.8 12.8h28.4');break;
      case'v2':g=ln('M15 0.8v18.4');break;
      case'v3':g=ln('M10.4 0.8v18.4M19.6 0.8v18.4');break;
      case'h3c':g=ln('M0.8 7.2h28.4M0.8 12.8h28.4')+'<circle cx="15" cy="10" r="2.4" class="l"/>';break;
      case'cross':g=ln('M15 4.5v11M9.5 10h11');break;
      case'nordic':g=ln('M10.5 0.8v18.4M0.8 10h28.4');break;
      case'stars':g=Array.from({length:12},(_,n)=>{const a=n*Math.PI/6;return `<circle cx="${(15+5.8*Math.sin(a)).toFixed(2)}" cy="${(10-5.8*Math.cos(a)).toFixed(2)}" r="0.7" class="f"/>`}).join('');break;
      case'canton':g='<rect x="0.8" y="0.8" width="12.4" height="9.4" class="l"/>'+ln('M13.2 5.5h16M0.8 12.6h28.4M0.8 15.9h28.4');break;
      case'diag':g=ln('M0.8 19.2L29.2 0.8');break;
      case'crescent':g='<circle cx="13" cy="10" r="4.4" class="l"/><circle cx="19.5" cy="10" r="1.2" class="f"/>';break;
    }
    return `<svg viewBox="0 0 30 20" preserveAspectRatio="none" aria-hidden="true"><rect x="0.8" y="0.8" width="28.4" height="18.4" rx="1.6"/>${g}</svg>`;
  }
  // Real mock-up: draws the annotated zones on each document image (photo, chip, QR, MRZ…)
  function mockHtml(d){
    const key=(d.image||'').split('/').pop().replace(/\.\w+$/,'');
    const L=typeof documentLayouts!=='undefined'?documentLayouts[key]:null;
    if(!L||!L.length)return genericMock(d);
    const pass=d.formType==='passport';let n=0;
    const box=(cls,x,y,w,h,inner='',st='')=>`<i class="${cls}" style="left:${x}%;top:${y}%;width:${w}%;height:${h}%;--i:${n++};${st}">${inner}</i>`;
    const twoLineCard=!pass&&d.lines===2,chars=pass?44:twoLineCard?36:30;
    const mrzLines=twoLineCard?['IDXXXMOCK&lt;&lt;DEMO&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;','DEMO000012XXX9001018M3101018&lt;&lt;&lt;&lt;&lt;&lt;&lt;2']:pass?['P&lt;XXXMOCK&lt;&lt;DEMO&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;','DEMO000012XXX9001018M3101018&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;']:['IDXXXDEMO00012345&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;','9001017M3101018XXX&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;2','MOCK&lt;&lt;DEMO&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;'];
    const parts=L.map(([t,x,y,w,h,k])=>{
      switch(t){
        case 'photo':return box('mphoto',x,y,w,h,'<b></b>');
        case 'ghost':return box('mphoto ghost',x,y,w,h,'<b></b>');
        case 'chip':return box('mchip',x,y,w,h);
        case 'qr':return box('mqr',x,y,w,h,'<svg viewBox="0 0 21 21" preserveAspectRatio="xMidYMid meet" shape-rendering="crispEdges"><g fill="none" stroke="currentColor" stroke-width="1"><rect x=".5" y=".5" width="6" height="6"/><rect x="14.5" y=".5" width="6" height="6"/><rect x=".5" y="14.5" width="6" height="6"/></g><g fill="currentColor"><rect x="2" y="2" width="3" height="3"/><rect x="16" y="2" width="3" height="3"/><rect x="2" y="16" width="3" height="3"/><rect x="9" y="0" width="2" height="2"/><rect x="12" y="1" width="1" height="2"/><rect x="9" y="3" width="1" height="3"/><rect x="11" y="5" width="2" height="1"/><rect x="8" y="8" width="2" height="2"/><rect x="11" y="9" width="1" height="2"/><rect x="13" y="8" width="2" height="1"/><rect x="16" y="9" width="2" height="2"/><rect x="19" y="8" width="2" height="1"/><rect x="0" y="9" width="2" height="1"/><rect x="3" y="9" width="1" height="2"/><rect x="5" y="11" width="2" height="1"/><rect x="8" y="12" width="1" height="2"/><rect x="10" y="13" width="2" height="1"/><rect x="14" y="12" width="2" height="1"/><rect x="18" y="12" width="1" height="2"/><rect x="9" y="16" width="2" height="1"/><rect x="12" y="15" width="2" height="2"/><rect x="15" y="14" width="1" height="2"/><rect x="17" y="16" width="2" height="2"/><rect x="20" y="15" width="1" height="2"/><rect x="9" y="19" width="1" height="2"/><rect x="12" y="19" width="2" height="1"/><rect x="15" y="18" width="1" height="3"/><rect x="18" y="19" width="2" height="2"/></g></svg>');
        case 'barcode':return box('mbar',x,y,w,h);
        case 'holo':return box('mholo',x,y,w,h);
        case 'sign':return box('msign',x,y,w,h,'<svg viewBox="0 0 100 30" preserveAspectRatio="none"><path d="M2 22C10 2 18 28 26 12S42 26 52 10 70 24 98 8"/></svg>');
        case 'box':return box('mbox',x,y,w,h);
        case 'flag':return box('mflag',x,y,w,h,flagSvg(k));
        case 'emblem':return box('memb',x,y,w,h,'<svg viewBox="0 0 24 28" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><path d="M3 4h18v10c0 6-4.2 9.4-9 11C7.2 23.4 3 20 3 14V4z"/><path d="M12 4v21M3 11h18" class="l"/></svg>');
        case 'text':{const kk=Math.max(1,Math.min(k||2,8));return box('mtext',x,y,w,h,'<s></s>'.repeat(kk),`--k:${kk}`);}
        case 'mrz':{const kk=Math.max(1,Math.min(k||(pass?2:3),3));
          const ln=Array.from({length:kk},(_,j)=>{const src=mrzLines[Math.min(j,mrzLines.length-1)];return `<span>${[...src.replace(/&lt;/g,'<')].slice(0,chars).map(c=>`<s>${c==='<'?'&lt;':c}</s>`).join('')}</span>`}).join('');
          return box('mband',x,y,w,h,ln,`font-size:min(calc(var(--mh,200px)*${(h/100/kk*0.72).toFixed(4)}),calc(var(--mw,300px)*${(w/100/(chars*0.62)).toFixed(4)}))`);}
        default:return '';
      }
    }).join('');
    return `<div class="cam-mock real" aria-hidden="true">${parts}</div>`;
  }
  // The device's real camera (requires HTTPS or localhost). If there is no permission or device, the simulation stays.
  let camStream=null,camPerm='idle',camPromise=null;   // camPerm: idle | pending | granted | denied | unavailable
  function stopCam(){if(camStream){camStream.getTracks().forEach(t=>t.stop());camStream=null;}}
  const CAM_CONSTRAINTS={video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}},audio:false};
  // Requested when pressing "Continue" (step 1): this way the browser prompt doesn't cover the step 3 transition
  function requestCamera(){
    if(camStream&&camStream.active)return Promise.resolve('granted');
    if(window.__noLock){camPerm='unavailable';return Promise.resolve(camPerm);}
    if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia){camPerm='unavailable';return Promise.resolve(camPerm);}
    if(camPerm==='denied')return Promise.resolve('denied');
    camPerm='pending';
    camPromise=navigator.mediaDevices.getUserMedia(CAM_CONSTRAINTS).then(stream=>{
      if(!dialog.open){stream.getTracks().forEach(t=>t.stop());return null;}   // the dialog was closed while the user was deciding
      camStream=stream;camPerm='granted';return stream;
    }).catch(e=>{camPerm=e&&e.name==='NotAllowedError'?'denied':'unavailable';return null;});
    const wait=new Promise(r=>setTimeout(()=>r('timeout'),25000));      // if the user takes too long to decide, carry on and use the camera when it arrives
    return Promise.race([camPromise.then(()=>camPerm),wait]);
  }
  async function startCam(){
    const st=dialog.querySelector('.stage.cam'),v=st?.querySelector('.cam-video');if(!v)return;
    const fail=msg=>{st.classList.add('no-video');if(!dialog.querySelector('.cam-note'))st.insertAdjacentHTML('afterend',`<p class="hint cam-note">${msg}</p>`);};
    if(!(camStream&&camStream.active)){
      if(camPerm==='pending'&&camPromise)await camPromise;                        // still deciding in step 1
      else if(camPerm==='idle'||camPerm==='granted'){                              // arrived without going through step 1 (e.g. retry)
        if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia)return fail('Simulation: this page cannot open the camera (HTTPS is required).');
        await requestCamera();
      }
    }
    if(!st.isConnected||!dialog.open)return;
    if(!(camStream&&camStream.active)){
      return fail(camPerm==='denied'?'Simulation: camera access has been blocked.':!window.isSecureContext||!navigator.mediaDevices?.getUserMedia?'Simulation: this page cannot open the camera (HTTPS is required).':'Simulation: no available camera was found.');
    }
    v.srcObject=camStream;
    const show=()=>{if(!st.isConnected||st.classList.contains('has-video'))return;st.classList.add('has-video');
      const cap=dialog.querySelector('[data-action="capture"]');if(cap)cap.textContent='Take photo';};
    v.addEventListener('loadeddata',show,{once:true});
    v.play().then(show).catch(()=>{});
    setTimeout(show,1500);   // in case the browser is slow to report
  }
  function containRect(st,pad,ratio){
    const b=st.getBoundingClientRect(),W=b.width-2*pad,H=b.height-2*pad;let w=W,h=W/ratio;if(h>H){h=H;w=H*ratio;}
    return {left:b.left+(b.width-w)/2,top:b.top+(b.height-h)/2,width:w,height:h};
  }
  // Step 2 → camera transition: the document flies to the viewfinder and the camera opens like an iris from it
  function layoutCam(from){
    const st=dialog.querySelector('.stage.cam');if(!st)return;
    const card=st.querySelector('.cam-card'),frame=st.querySelector('.cam-frame'),img=st.querySelector('.cam-card img');
    const run=()=>{
      const sb=st.getBoundingClientRect(),r2=containRect(st,40,from?.ratio||img.naturalWidth/img.naturalHeight);
      const L=r2.left-sb.left,T=r2.top-sb.top;
      Object.assign(card.style,{left:L+'px',top:T+'px',width:r2.width+'px',height:r2.height+'px'});
      Object.assign(frame.style,{left:(L-10)+'px',top:(T-10)+'px',width:(r2.width+20)+'px',height:(r2.height+20)+'px'});
      st.style.setProperty('--mw',r2.width+'px');st.style.setProperty('--mh',r2.height+'px');st.style.setProperty('--ix',(L+r2.width/2)+'px');st.style.setProperty('--iy',(T+r2.height/2)+'px');
      const still=matchMedia('(prefers-reduced-motion: reduce)').matches;
      if(from&&!still){
        const sc=from.width/r2.width;
        card.style.transformOrigin='0 0';card.style.transition='none';
        card.style.transform=`translate(${from.left-r2.left}px,${from.top-r2.top}px) scale(${sc})`;
        card.getBoundingClientRect();
        card.style.transition='transform .8s cubic-bezier(.22,.8,.2,1)';card.style.transform='none';st.classList.add('live');
      }else st.classList.add('live',still?'still':'soft');
    };
    from?.ratio||(img.complete&&img.naturalWidth)?run():img.addEventListener('load',run,{once:true});
  }
  const FLIP_DELAY=.935,FLIP_DUR=.9; // initial delay 10% longer (was 0.85 s)
  function fitFx(){
    const st=dialog.querySelector('.stage'),fx=st?.querySelector('.fx-wrap');if(!fx)return;
    const img=st.querySelector('.face.turned img')||st.querySelector('img');
    const tilt=st.querySelector('.tilt');if(tilt)['--bd','--ud','--po','--pt','--cr','--pdur'].forEach(p=>tilt.style.setProperty(p,fx.style.getPropertyValue(p)));
    const place=()=>{const pad=12,W=st.clientWidth-2*pad,H=st.clientHeight-2*pad,r=img.naturalWidth/img.naturalHeight;let w=W,h=W/r;if(h>H){h=H;w=H*r;}
      Object.assign(fx.style,{left:(st.clientWidth-w)/2+'px',top:(st.clientHeight-h)/2+'px',width:w+'px',height:h+'px'});
      const ps=st.querySelector('.pass-stage');if(ps&&tilt){const Hb=ps.clientHeight;tilt.style.setProperty('--ps',(w/Hb).toFixed(4));tilt.style.setProperty('--psy',(h/(.75*Hb)).toFixed(4));}};   // the cover fits both the width AND the height of the data page
    img.complete&&img.naturalWidth?place():img.addEventListener('load',place,{once:true});
  }
  window.addEventListener('resize',()=>{if(dialog.open)fitFx();});
  // Step 2 · how to prepare the document
  function prepare(loaded=true){
    const d=currentDoc();if(!d)return guide();docType=d.formType;
    const flipEnd=FLIP_DELAY+FLIP_DUR;
    const isPass=d.formType==='passport';
    const TURN_AT=FLIP_DELAY,OPEN_AT=FLIP_DELAY,OPEN_DUR=1.5; // the passport opens more slowly than the ID turn // passport: appears closed and horizontal, pauses, then the cover opens at the spine
    const BAD=isPass?OPEN_AT+OPEN_DUR/2:FLIP_DELAY+FLIP_DUR/2; // hand, glare and tilt come in just as the document is halfway through its turn
    const endOpen=isPass?OPEN_AT+OPEN_DUR:flipEnd;
    const GAP=1.45; // time between steps
    const T={side:endOpen,place:endOpen+GAP,lines:endOpen+2*GAP,glare:endOpen+3*GAP};
    const _ic=p=>`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
    const TIPIC={side:_ic('<rect x="3" y="5" width="18" height="14" rx="2.5"/><circle cx="9" cy="11" r="2"/><path d="M14 10h4M14 14h4M6.5 16.5c.7-1.2 1.6-1.7 2.5-1.7"/>'),place:_ic('<rect x="7" y="6" width="10" height="7" rx="1.2"/><path d="M3 16.5h18M5.5 16.5V20M18.5 16.5V20"/>'),lines:_ic('<path d="M4 9V6a2 2 0 0 1 2-2h3M15 4h3a2 2 0 0 1 2 2v3M20 15v3a2 2 0 0 1-2 2h-3M9 20H6a2 2 0 0 1-2-2v-3"/>'),glare:_ic('<circle cx="12" cy="12" r="3.6"/><path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>')};
    const tips=[['side',isPass?'Open it to the photo page':d.side==='back'?'Show the back side':'Show the photo side'],['place','Lay it flat on a plain background'],['lines',d.code==='barcode'?'Keep the whole barcode in view':d.front?'Keep all four corners in view':'Keep the bottom lines fully in view'],['glare','No glare or fingers']];
    const hand=`<img class="hand hand-img" src="assets/hand.webp" alt="">`;
    const fx=`<div class="fx-wrap" style="--bd:${BAD}s;--ud:${(T.place-.7).toFixed(2)}s;--hd:${(T.lines-.55).toFixed(2)}s;--tp:${T.place}s;--ts:${T.side}s;--po:${OPEN_AT}s;--pt:${TURN_AT}s;--pdur:${OPEN_DUR}s;--cr:.75;--tl:${T.lines}s;--tg:${T.glare}s;--mt:${d.formType==='passport'?76:d.lines===2||d.code==='barcode'?d.mrz[1]-2:58}%;--mh:${d.formType==='passport'?20:d.lines===2||d.code==='barcode'?d.mrz[3]+4:36}%"><div class="fx">${isPass?'<i class="pshadow"></i>':''}<i class="ring r1"></i>${T.side?'<i class="ring r2"></i>':''}<i class="mrz-glow"></i><i class="glare"></i><i class="glint"></i></div><div class="hand-box">${hand}</div></div>`;
    body.keep=true;
    body(`Get your ${d.formType==='passport'?'passport':d.code==='barcode'?'driving licence':'ID document'} ready`,`<p class="hint"><span class="pill-doc">${esc(documentCatalog[d.issuer||issuingCountry].name)} · ${esc(d.label)}</span> <button class="text-button" data-action="choose">Change</button></p>${stageHtml(d,false,true,fx)}<ul class="tips big">${tips.map(([k,t])=>`<li style="--t:${T[k]}s"><span class="mk" aria-hidden="true"><b class="x">${TIPIC[k]||""}</b><b class="ok">✓</b></span>${t}</li>`).join('')}</ul><div class="dialog-actions"><button class="primary" data-action="camera">Take the photo <span aria-hidden="true">→</span></button><button class="secondary" data-action="gallery">Choose from gallery</button><button class="text-button" data-action="choose">Back</button></div>`,stepsHtml(2),true);
    fitFx();
    if(!loaded)dialog.querySelector('.dialog-body').dataset.static='1';   // no animations if images are missing: no jerky cuts
  }
  function body(title,content,label='GET YOUR DOCUMENT READY',tall=false){
    if(!body.keep)stopCam();body.keep=false;
    dialog.classList.toggle('tall',tall);
    $('dialog-context').textContent='Autofill with a photo';
    $('dialog-content').innerHTML=`<div class="dialog-body">${label.startsWith('<ol')?label:`<div class="step-label">${label}</div>`}<h2 id="dialog-title" tabindex="-1">${title}</h2>${content}</div>`;
    if(dialog.open)$('dialog-title').focus();
  }
  function closeScan(){token++;stopCam();dialog.close();$('start-scan').focus();}
  function exitToForm(){closeScan();note('Scan closed. What you had already typed is still in the form.','neutral');$('firstName').focus();}
  function camera(fromRect){
    if(['denied','desktop'].includes(profile.scenario)){
      body(profile.scenario==='denied'?'Camera permission needed':'No camera available',`<p>${profile.scenario==='denied'?'You can allow access in your browser settings or choose a photo of the document.':'You can use an image of the document that you already have.'}</p><div class="notice warning">Simulated state. We haven't requested real access to your camera.</div><div class="dialog-actions"><button class="primary" data-action="gallery">Choose from gallery</button><button class="secondary" data-action="exit">Back to the form</button><button class="text-button" data-action="intro">Back to the guide</button></div>`);return;
    }
    const d=currentDoc();
    const camStage=`<div class="stage cam m-enfoque"><div class="cam-bg"></div><video class="cam-video" muted playsinline autoplay></video><div class="cam-scrim"></div><div class="cam-card"><div class="cam-float"><img src="${d.image}" alt="${esc(d.alt)}">${mockHtml(d)}<i class="scan"></i></div></div><div class="cam-frame"><i class="c tl"></i><i class="c tr"></i><i class="c bl"></i><i class="c br"></i></div><div class="cam-chip"><span>Align your document with the guide</span></div></div>`;
    body.keep=true;
    body(d.side==='back'?'Place the back in the frame':d.side==='front'?'Place the front in the frame':'Frame the photo page',`${camStage}<div class="dialog-actions single"><button class="primary" data-action="capture">Simulate capture</button><button class="text-button" data-action="intro">Back</button></div>`,stepsHtml(3),true);
    dialog.querySelector('.dialog-body').classList.add('noslide');
    announce('Camera open.');layoutCam(fromRect);startCam();
  }

  const errorMessages={
    glare:['Glare is covering the lines','Tilt the document slightly or change the lighting. Make sure the glare doesn\'t cover the letters.'],
    blur:['The lines aren\'t sharp','Rest the document on a surface, clean the lens and wait for it to focus before taking the photo.'],
    'wrong-side':['We can\'t see the MRZ reading lines','Look for the side with two or three lines of letters, numbers and < signs.'],
    cropped:['One end of the lines is cut off','Move the document back a little. The lines must be visible from start to finish.'],
    multiple:['There is more than one document in the photo','Leave just one document in the image so the details don\'t get mixed up.'],
    dark:['We need a bit more light','Move the document closer to an even light. Avoid casting a shadow from your phone over the lines.'],
    'no-mrz':['We couldn\'t find any lines we can read','If your document doesn\'t have these lines, you can go back to the form and type in the details. This doesn\'t mean your document is invalid.'],
    offline:['The connection was interrupted','You don\'t need to retake the photo. You can try reading the same image again or cancel.'],
    timeout:['Reading is taking too long','You can try reading the same photo again or cancel. What you already typed is still in the form.']
  };
  const barcodeMessages={
    glare:['Glare is covering the barcode','Tilt the card slightly or change the lighting so the barcode has no shine on it.'],
    blur:['The barcode isn\'t sharp','Rest the card on a surface, clean the lens and wait for it to focus before taking the photo.'],
    cropped:['Part of the barcode is cut off','Move the card back a little. The whole barcode must be in the photo.'],
    dark:['We need a bit more light','Move the card closer to an even light. Avoid casting a shadow over the barcode.'],
    'no-mrz':['We couldn\'t read the barcode','If the barcode is damaged, you can go back to the form and type in the details. This doesn\'t mean your document is invalid.']};
  function errorScreen(kind){
    const d=currentDoc();
    const [title,message]=kind==='wrong-side'&&d?[d.title,d.instruction]:d?.code==='barcode'&&barcodeMessages[kind]||errorMessages[kind];const manualFirst=attempts>=2||kind==='no-mrz';const service=['offline','timeout'].includes(kind);
    body(title,`<p>${esc(message)}</p>${attempts>=2?'<div class="notice warning">You have tried twice already. You can go back to the form without losing what you typed.</div>':''}<div class="dialog-actions">${manualFirst?'<button class="primary" data-action="exit">Back to the form</button>':''}${kind!=='no-mrz'?`<button class="${manualFirst?'secondary':'primary'}" data-action="${service?'retry-read':'retry-photo'}">${service?'Retry reading':'Take another photo'}</button>`:''}${!manualFirst?'<button class="secondary" data-action="exit">Cancel scan</button>':''}<button class="text-button" data-action="intro">View the guide</button></div>${kind!=='no-mrz'?`<div class="sim-control"><span>Test control</span><button class="text-button" data-action="recover">${service?'Simulate service restored':'Simulate a corrected photo'} →</button></div>`:''}`,'WE COULDN\'T COMPLETE THE READING');
  }
  function sample(){
    let data={...resolveDocument(issuingCountry,documentKey).sample};
    if(profile.scenario==='names')data={...data,firstName:'AMINA',surname:'EL AMRANI'};
    if(profile.scenario==='partial')data={...data,firstName:'WEI',surname:'ZHANG',nationality:'China',documentNumber:''};
    if(profile.scenario==='conflict')data={...data,firstName:'DIEGO ALBERTO',surname:'GARCIA LOPEZ'};
    return data;
  }
  function read(){
    attempts++;const request=++token;
    body(currentDoc()?.code==='barcode'?'We\'re reading the barcode':'We\'re reading the lines',`<p>${currentDoc()?.code==='barcode'?'When it\'s read':'When they\'re ready'}, we\'ll fill in the form fields.</p><div class="loading" aria-hidden="true"></div><p role="status">Simulated reading in progress…</p><div class="dialog-actions"><button class="secondary" data-action="exit">Cancel reading</button></div>`,'READING YOUR PHOTO');
    announce('Reading the photo.');
    setTimeout(()=>{
      if(request!==token||!dialog.open)return;
      const kind=profile.scenario;
      if(errorMessages[kind]&&!correctedPhoto)return errorScreen(kind);
      readData=sample();partialFixed=false;
      if(kind==='partial')return partialReview();
      if(conflictsFor(form,readData).length)return conflictReview();
      applyResult();
    },profile.scenario==='timeout'?1700:750);
  }
  function partialReview(){
    body('Just one detail left to read',`<p>We\'ve read the rest of the details, but we couldn\'t make out one character of the document number.</p><div class="notice warning">We won\'t guess it. Type it exactly as it appears on the document or retake the photo.</div><div class="field"><label for="uncertain-number">Document number</label><input id="uncertain-number" autocomplete="off" spellcheck="false" aria-describedby="uncertain-hint"><small id="uncertain-hint">In this example you can type DEMO12345.</small><small id="uncertain-error" class="field-error" hidden></small></div><div class="dialog-actions"><button class="primary" data-action="resolve">Use this number and fill in</button><button class="secondary" data-action="retry-photo">Take another photo</button><button class="text-button" data-action="exit">Cancel without applying</button></div>`,'PARTIAL READING');
  }
  function conflictReview(){
    const conflicts=conflictsFor(form,readData);
    body('You had already typed some details',`<p>There are differences with the photo. We\'ll keep what you typed unless you choose to replace it.</p><div class="notice warning">Check that you photographed the right document.</div><div class="review-grid">${conflicts.map(key=>`<div class="field"><label for="accept-${key}">${esc(fieldLabels[key])}</label><p class="current-value">Current: <b>${esc(form[key])}</b><br>Read: <b>${esc(readData[key])}</b></p><label class="check conflict-choice"><input id="accept-${key}" type="checkbox" data-accept="${key}"> Use the detail from the photo</label></div>`).join('')}</div><p class="small-note">Empty fields will be filled in with the details we read.</p><div class="dialog-actions"><button class="primary" data-action="apply-conflicts">Fill in the form</button><button class="secondary" data-action="intro">Use another document</button><button class="text-button" data-action="exit">Cancel without applying</button></div>`,'BEFORE REPLACING DETAILS');
  }
  function applyResult(accept={}){
    const before={...form};form=mergeRead(form,readData,accept);
    // The choice describes the photographed document, but existing populated type is preserved on conflicts.
    if(!before.documentNumber||accept.documentNumber)form.documentType=docType;
    if(partialFixed)form.sources.documentNumber='user_corrected';
    const updated=scanKeys.filter(key=>form[key]!==before[key]);closeScan();renderForm();
    const extra=profile.scenario==='names'?' The name keeps the spelling shown in the document\'s reading lines.':'';
    note(`${partialFixed?'Reading completed with your correction.':'Document read.'} ${updated.length?`${updated.length} fields filled in`:'The details were already in the form'}.${extra}`);
    $('form-notice').setAttribute('tabindex','-1');$('form-notice').focus();$('form-notice').scrollIntoView({block:'center',behavior:'auto'});announce('Autofill complete. The details we read are in the form.');
  }
  $('profile-select').innerHTML=profiles.map(p=>`<option value="${p.id}">${String(p.id).padStart(2,'0')} · ${esc(p.name)} — ${esc(p.context.split(' · ')[0])}</option>`).join('');
  $('profile-list').innerHTML=profiles.map(p=>`<article class="profile-card"><h2><span class="profile-number">${String(p.id).padStart(2,'0')}</span>${esc(p.name)}</h2><p class="context">${esc(p.context)}</p><dl><dt>Round 1 · What they expect</dt><dd>${esc(p.expectation)}</dd><dt>Expected friction</dt><dd>${esc(p.risk)}</dd><dt>Round 2 · Simulated feedback on V1</dt><dd>“${esc(p.feedback)}”</dd><dt>Change in V2</dt><dd>${esc(p.decision)}</dd><dt>Still to validate</dt><dd>${esc(p.residual)}</dd></dl><button class="secondary" data-profile="${p.id}">Try this case →</button></article>`).join('');
  function showStudy(show){$('study').hidden=!show;$('prototype').hidden=show;$('study-toggle').textContent=show?'Back to the prototype ↗':'20-profile study ↗';window.scrollTo({top:0,behavior:'auto'});}
  $('study-toggle').onclick=()=>showStudy($('study').hidden);
  $('profile-list').onclick=e=>{const button=e.target.closest('[data-profile]');if(button){profile=profiles.find(p=>p.id===Number(button.dataset.profile));reset();showStudy(false);}};
  $('property-country').innerHTML=Object.entries(documentCatalog).sort((x,y)=>x[1].name.localeCompare(y[1].name,'en')).map(([code,c])=>`<option value="${code}" ${code===propertyCountry?'selected':''}>${esc(c.name)}</option>`).join('');
  $('property-country').onchange=e=>{propertyCountry=e.target.value;if(dialog.open&&dialog.querySelector('#issuing-country')){if(!resolveDocument(issuingCountry,documentKey,propertyCountry))documentKey=documentsFor(issuingCountry,propertyCountry)[0]?.[0]||'';guide();}};
  $('profile-select').onchange=e=>{profile=profiles.find(p=>p.id===Number(e.target.value));reset();};$('reset').onclick=reset;
  $('guest-form').addEventListener('input',e=>{if(fieldLabels[e.target.id]){form.sources[e.target.id]='manual';e.target.classList.remove('read');e.target.parentElement.querySelector('.read-origin')?.remove();}remember();});
  $('guest-form').onsubmit=e=>e.preventDefault();
  $('start-scan').onclick=()=>{remember();attempts=0;correctedPhoto=false;partialFixed=false;docType=form.documentType;guide();dialog.showModal();$('dialog-title').focus();};
  $('manual').onclick=()=>{$('firstName').focus();};$('close-dialog').onclick=closeScan;
  dialog.addEventListener('cancel',()=>{token++;});
  dialog.addEventListener('close',()=>{token++;stopCam();});
  $('dialog-content').onclick=e=>{
    const el=e.target.closest('[data-action]');if(!el)return;const action=el.dataset.action;
    if(action==='choose')guide();
    if(action==='intro'){prepare();return;}
    if(action==='prepare'){
      const b=el;b.disabled=true;b.textContent='Waiting for camera permission…';
      requestCamera().then(()=>{if(dialog.open&&dialog.querySelector('[data-action="prepare"]')){b.textContent='Loading the guide…';}return preloadDoc(currentDoc());})
        .then(ok=>{if(dialog.open&&dialog.querySelector('[data-action="prepare"]'))prepare(ok);});
      return;
    }
    if(action==='pick-type'){documentKey=el.dataset.key;guide();dialog.querySelector('.type-option.on')?.focus();}
    if(action==='doc-help'){const d=currentDoc();if(!d)return;const imgs=[d.imageOther,d.image].filter(Boolean).map(src=>`<img src="${src}" alt="">`).join('');
      const h=document.createElement('div');h.className='doc-help';h.innerHTML=`<div class="dh-card" role="dialog" aria-modal="true" aria-labelledby="dh-title"><h3 id="dh-title">${esc(d.label)}</h3><p>${esc(d.hint)}</p><div class="dh-imgs">${imgs}</div><button type="button" class="primary" data-action="doc-help-close">Got it</button></div>`;
      $('dialog-content').append(h);h.querySelector('button').focus();}
    if(action==='doc-help-close'){dialog.querySelector('.doc-help')?.remove();dialog.querySelector('.whats')?.focus();}
    if(action==='camera'||action==='retry-photo'){
      const st=dialog.querySelector('.stage'),im=st&&(st.querySelector('.face.turned img')||st.querySelector('img'));
      camera(action==='camera'&&st&&st.querySelector('.fx-wrap')&&im&&im.naturalWidth?{...containRect(st,12,im.naturalWidth/im.naturalHeight),ratio:im.naturalWidth/im.naturalHeight}:null);
    }
    if(['gallery','capture','retry-read'].includes(action))read();
    if(action==='exit')exitToForm();
    if(action==='no-lines')body('Check the country and document version',`<p>You may have a different version. Review your selection to see the instructions that match your document.</p><div class="dialog-actions"><button class="primary" data-action="choose">Change country or document</button><button class="secondary" data-action="exit">Back to the form</button></div>`);
    if(action==='recover'){correctedPhoto=true;read();}
    if(action==='apply-conflicts'){const accept={};document.querySelectorAll('[data-accept]').forEach(el=>{accept[el.dataset.accept]=el.checked;});applyResult(accept);}
    if(action==='resolve'){
      const number=$('uncertain-number').value.trim();
      if(!number){$('uncertain-error').hidden=false;$('uncertain-error').textContent='Type the number exactly as it appears on your document.';$('uncertain-number').setAttribute('aria-invalid','true');$('uncertain-number').setAttribute('aria-describedby','uncertain-error');$('uncertain-number').focus();return;}
      readData.documentNumber=number;partialFixed=true;if(conflictsFor(form,readData).length)conflictReview();else applyResult();
    }
  };
  // Country: dropdown styled like a select; opening it or typing filters the list (accent- and case-insensitive)
  const nrm=t=>String(t||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  let comboActive=-1;
  const comboEls=()=>({inp:$('issuing-country'),list:$('country-list')});
  function renderCountryList(q=''){
    const {inp,list}=comboEls();if(!list)return;
    const n=nrm(q);
    const all=Object.entries(documentCatalog).map(([code,c])=>({code,name:c.name,k:nrm(c.name)}));
    const hits=n?all.filter(c=>c.k.includes(n)).sort((a,b)=>(b.k.startsWith(n)-a.k.startsWith(n))||a.name.localeCompare(b.name,'en')):all;
    list.innerHTML=hits.length?hits.map((c,i)=>`<li role="option" id="co-${c.code}" data-code="${c.code}" aria-selected="${c.code===issuingCountry}">${esc(c.name)}</li>`).join(''):'<li class="none" role="presentation">No country matches that name</li>';
    comboActive=-1;inp.removeAttribute('aria-activedescendant');
    if(!n&&issuingCountry){const cur=list.querySelector(`[data-code="${issuingCountry}"]`);if(cur)list.scrollTop=Math.max(0,cur.offsetTop-70);}
  }
  function openCombo(){const {inp,list}=comboEls();if(!list)return;renderCountryList('');list.hidden=false;inp.setAttribute('aria-expanded','true');inp.closest('.cbx').classList.add('open');inp.select();}
  function closeCombo(){const {inp,list}=comboEls();if(!list)return;list.hidden=true;inp.setAttribute('aria-expanded','false');inp.closest('.cbx')?.classList.remove('open');inp.value=documentCatalog[issuingCountry]?.name||'';}
  let choosing=false;
  function chooseCountry(code,viaKey=false){
    if(!documentCatalog[code])return;
    issuingCountry=code;
    const keys=documentsFor(code,propertyCountry).map(([k])=>k);documentKey=keys.includes('id')?'id':(keys[0]||'');   // default to the ID document; if the country doesn't have one, the passport
    choosing=true;try{guide();}finally{choosing=false;}   // re-rendering fires a focusout with the old text: it must not re-select the previous country
    if(viaKey)dialog.querySelector('.type-option.on')?.focus();   // only keyboard users: a mouse/touch pick must not leave a focus ring on the document type
  }
  window.__pickCountry=chooseCountry;   // hook for tests
  function moveActive(d){
    const items=[...$('country-list').querySelectorAll('li[data-code]')];if(!items.length)return;
    comboActive=(comboActive+d+items.length)%items.length;
    items.forEach((li,i)=>li.classList.toggle('active',i===comboActive));
    const li=items[comboActive];li.scrollIntoView({block:'nearest'});$('issuing-country').setAttribute('aria-activedescendant',li.id);
  }
  const dc=$('dialog-content');
  dc.addEventListener('focusin',e=>{if(e.target.id==='issuing-country'&&$('country-list').hidden)openCombo();});
  dc.addEventListener('click',e=>{if(e.target.id==='issuing-country'&&$('country-list').hidden)openCombo();});
  dc.addEventListener('input',e=>{if(e.target.id==='issuing-country'){const {list,inp}=comboEls();list.hidden=false;inp.setAttribute('aria-expanded','true');inp.closest('.cbx').classList.add('open');renderCountryList(inp.value);}});
  dc.addEventListener('keydown',e=>{
    if(e.target.id!=='issuing-country')return;
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if($('country-list').hidden)openCombo();else moveActive(e.key==='ArrowDown'?1:-1);}
    else if(e.key==='Enter'){e.preventDefault();const items=[...$('country-list').querySelectorAll('li[data-code]')];const li=items[comboActive]||(items.length===1?items[0]:null)||items[0];if(li&&!$('country-list').hidden)chooseCountry(li.dataset.code,true);}
    else if(e.key==='Escape'&&!$('country-list').hidden){e.stopPropagation();e.preventDefault();closeCombo();}
  });
  dc.addEventListener('mousedown',e=>{const li=e.target.closest('#country-list li[data-code]');if(li){e.preventDefault();chooseCountry(li.dataset.code);}});
  dc.addEventListener('focusout',e=>{if(e.target.id==='issuing-country'){if(choosing)return;const q=nrm(e.target.value);const codes=Object.keys(documentCatalog);const exact=q&&codes.find(c=>nrm(documentCatalog[c].name)===q);if(exact&&exact!==issuingCountry){chooseCountry(exact);return;}closeCombo();}});
  /*REP*/window.__noLock=true;   // sin cámara real: se usa el mockup del documento
  const repSet=(c,k)=>{window.__repFront=/:front$/.test(k||'');k=(k||'').replace(/:front$/,'');if(c){issuingCountry=c;documentKey=k;}const d=currentDoc();if(d)docType=d.formType;return d;};
  const repPost=()=>{const b=dialog.querySelector('.dialog-body');if(!b)return;const f=()=>parent.postMessage({rep:'prep-h',h:Math.ceil(b.getBoundingClientRect().height)},'*');f();};
  window.__repPrep=async(c,k)=>{const d=repSet(c,k);if(!d)return;const ok=await preloadDoc(d);if(!dialog.open)dialog.show();prepare(ok);{const bd=dialog.querySelector('.dialog-body');if(bd&&window.__repFront)bd.dataset.front='1';}repPost();};
  window.__repCam=async(c,k)=>{const d=repSet(c,k);if(!d)return;const ok=await preloadDoc(d);if(!dialog.open)dialog.show();
    const st=dialog.querySelector('.stage'),im=st&&(st.querySelector('.face.turned img')||st.querySelector('img'));
    camera(st&&st.querySelector('.fx-wrap')&&im&&im.naturalWidth?{...containRect(st,12,im.naturalWidth/im.naturalHeight),ratio:im.naturalWidth/im.naturalHeight}:null);};
  parent.postMessage({rep:'prep-ready'},'*');
  reset();
}
