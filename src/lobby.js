const $=id=>document.getElementById(id);
const menu=$('main-menu');
const toast=$('lobby-toast');
let toastTimer;
function notify(message){if(!toast)return;toast.textContent=message;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),2100);}
function setTab(tab){
 document.querySelectorAll('[data-tab]').forEach(el=>el.classList.toggle('active',el.dataset.tab===tab));
 if(tab==='arsenal'){$('skins-panel')?.classList.remove('hidden');notify('ARSENAL · ESCOLHA SEU VISUAL');}
 else if(tab==='loja')notify('LOJA EM DESENVOLVIMENTO');
}
document.querySelectorAll('[data-tab]').forEach(el=>el.addEventListener('click',()=>setTab(el.dataset.tab)));
$('play-btn')?.addEventListener('click',()=>{menu?.classList.add('menu-hidden');});
$('open-skins')?.addEventListener('click',()=>$('skins-panel')?.classList.remove('hidden'));
$('open-settings')?.addEventListener('click',()=>$('settings-panel')?.classList.remove('hidden'));
document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>$(button.dataset.close)?.classList.add('hidden')));
const names=['OPERADOR TÁTICO','ÁRTICO','INFERNO','SOMBRA'];
const saved=Number(localStorage.getItem('empire-skin')||0);
document.querySelectorAll('[data-skin]').forEach(button=>button.addEventListener('click',()=>{
 const index=Number(button.dataset.skin)||0;
 localStorage.setItem('empire-skin',String(index));
 document.querySelectorAll('.skin-option').forEach((item,i)=>item.classList.toggle('selected',i===index));
 const name=$('skin-name');if(name)name.textContent=names[index]||names[0];
 window.dispatchEvent(new CustomEvent('empire:skinchange',{detail:index}));
}));
document.querySelectorAll('.skin-option').forEach((item,i)=>item.classList.toggle('selected',i===saved));
if($('skin-name'))$('skin-name').textContent=names[saved]||names[0];
$('menu-btn')?.addEventListener('click',()=>{$('pause-screen')?.classList.add('hidden');menu?.classList.remove('menu-hidden');});
