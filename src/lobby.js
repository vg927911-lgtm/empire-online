const $=id=>document.getElementById(id);
const menu=$('main-menu');
$('play-btn')?.addEventListener('click',()=>{menu?.classList.add('menu-hidden');});
$('open-skins')?.addEventListener('click',()=>$('skins-panel')?.classList.remove('hidden'));
$('open-settings')?.addEventListener('click',()=>$('settings-panel')?.classList.remove('hidden'));
document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>$(button.dataset.close)?.classList.add('hidden')));
document.querySelectorAll('[data-skin]').forEach(button=>button.addEventListener('click',()=>{
 const index=Number(button.dataset.skin)||0;
 localStorage.setItem('empire-skin',String(index));
 document.querySelectorAll('.skin-option').forEach((item,i)=>item.classList.toggle('selected',i===index));
 const names=['OPERADOR TÁTICO','ÁRTICO','INFERNO','SOMBRA'];
 const name=$('skin-name');if(name)name.textContent=names[index]||names[0];
 window.dispatchEvent(new CustomEvent('empire:skinchange',{detail:index}));
}));
$('menu-btn')?.addEventListener('click',()=>{$('pause-screen')?.classList.add('hidden');menu?.classList.remove('menu-hidden');});
