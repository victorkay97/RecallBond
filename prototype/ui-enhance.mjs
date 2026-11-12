// Upgrade stray decorative text symbols to real, consistent vector icons.
// Shared by landing, consumer and business. Text, link destination and event handlers stay intact.
const sprite=new URL('./assets/mingcute.svg',import.meta.url).pathname;
const svgNamespace='http://www.w3.org/2000/svg';
function spriteIcon(name) {
 const svg=document.createElementNS(svgNamespace,'svg');
 svg.classList.add('rg-icon');svg.setAttribute('aria-hidden','true');
 const use=document.createElementNS(svgNamespace,'use');
 use.setAttribute('href',sprite+'#'+name);svg.append(use);
 return svg;
}
function closeIcon(){
 const svg=document.createElementNS(svgNamespace,'svg');
 svg.classList.add('rg-icon');svg.setAttribute('viewBox','0 0 24 24');
 svg.setAttribute('aria-hidden','true');svg.setAttribute('fill','none');
 svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.8');
 svg.setAttribute('stroke-linecap','round');
 for(const d of ['M5 5l14 14','M19 5 5 19']) {
  const path=document.createElementNS(svgNamespace,'path');path.setAttribute('d',d);svg.append(path);
 }
 return svg;
}
function enhance(container){
 const nodes=[];
 const walker=document.createTreeWalker(container,NodeFilter.SHOW_TEXT);
 while(walker.nextNode())nodes.push(walker.currentNode);
 for(const textNode of nodes){
  const parent=textNode.parentElement;
  if(!parent||parent.closest('script,style,textarea,input,[contenteditable]'))continue;
  const raw=textNode.textContent;
  const item=parent.closest('a,button');
  if(item&&/\s*↗\s*$/.test(raw)){
   textNode.textContent=raw.replace(/\s*↗\s*$/,' ');
   parent.insertBefore(spriteIcon('arrow-up-right'),textNode.nextSibling);
  }else if(item&&/\s*→\s*$/.test(raw)){
   textNode.textContent=raw.replace(/\s*→\s*$/,' ');
   parent.insertBefore(spriteIcon('arrow-right'),textNode.nextSibling);
  }else if((parent.matches('.brand-glyph,.mini-passport,.choice-icon')||parent.closest('.mini-passport'))&&raw.trim()==='◇'){
   textNode.textContent='';parent.append(spriteIcon('diamond'));
  }else if(parent.matches('.dialog-close')&&raw.trim()==='×'){
   textNode.textContent='';parent.append(closeIcon());
  }
 }
}
enhance(document.body);
const observer=new MutationObserver(records=>{
 for(const record of records){
  for(const node of record.addedNodes){
   if(node.nodeType===Node.ELEMENT_NODE){
    if(node.matches('a,button,.mini-passport,.brand-glyph,.choice-icon')||node.querySelector('a,button,.mini-passport,.brand-glyph,.choice-icon'))enhance(node);
   }else if(node.nodeType===Node.TEXT_NODE&&node.parentElement?.closest('a,button,.mini-passport,.brand-glyph,.choice-icon'))enhance(node.parentElement);
  }
 }
});
observer.observe(document.body,{subtree:true,childList:true});
