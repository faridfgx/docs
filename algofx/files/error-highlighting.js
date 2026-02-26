class AlgoErrorHighlighter{constructor(){this.editor=null;this.errorContainer=null;this.errors=[];this.debounceTimer=null;this.keywords=new Set(['algorithme','var','const','debut','fin','si','alors','sinon','finsi','pour','de','pas','faire','finpour','tantque','fintantque','ecrire','lire','sortir','et','ou','non','mod','div','puissance','racine','vrai','faux','entier','reel','chaine','caractere','booleen','tableau']);this.standaloneKeywords=new Set(['var','const','debut','fin','sinon','finsi','finpour','fintantque']);this.controlStartKeywords=new Set(['si','pour','tantque']);this.init()}
init(){if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',()=>this.setup())}else{this.setup()}}
setup(){this.editor=document.getElementById('codeEditor');this.errorContainer=document.getElementById('errorIndicators');if(!this.editor||!this.errorContainer){console.error('[AlgoFX][Init] Missing editor or error container');return}
this.editor.addEventListener('input',()=>{this.updateContainerHeight();this.debounce(()=>this.validateCode(),400)});this.editor.addEventListener('scroll',()=>this.syncScroll());const codeArea=this.editor.closest('.code-area');if(codeArea){codeArea.addEventListener('scroll',()=>this.syncScroll())}
this.updateContainerHeight();this.validateCode();this.exposeGlobalMethods()}
exposeGlobalMethods(){window.refreshErrorHighlighting=()=>this.refresh();window.clearErrorHighlighting=()=>this.clearErrors()}
debounce(fn,delay){clearTimeout(this.debounceTimer);this.debounceTimer=setTimeout(fn,delay)}
updateContainerHeight(){if(!this.editor||!this.errorContainer)return;const lineCount=this.editor.value.split('\n').length;const lineHeight=this.getLineHeight();const totalHeight=lineCount*lineHeight;const minHeight=this.editor.scrollHeight;const height=Math.max(totalHeight,minHeight,100);this.errorContainer.style.height=`${height}px`}
syncScroll(){if(!this.editor||!this.errorContainer)return;const scrollTop=this.editor.scrollTop;this.errorContainer.style.transform=`translateY(${-scrollTop}px)`}
stripCommentsAndStrings(line){let result='';let inString=!1;let stringChar=null;for(let i=0;i<line.length;i++){const char=line[i];const nextChar=line[i+1];if(!inString&&char==='/'&&nextChar==='/'){break}
if((char==='"'||char==="'")&&(i===0||line[i-1]!=='\\')){if(!inString){inString=!0;stringChar=char;result+=' '}else if(char===stringChar){inString=!1;stringChar=null}
continue}
if(inString){result+=' '}else{result+=char}}
return result.trim()}
isValidIdentifier(name){if(!/^[a-z_]/i.test(name)){return{valid:!1,reason:'doit commencer par une lettre ou "_"'}}
if(!/^[a-z_][a-z0-9_]*$/i.test(name)){return{valid:!1,reason:'ne peut contenir que lettres, chiffres et "_"'}}
if(/\s/.test(name)){return{valid:!1,reason:'ne peut pas contenir d\'espaces'}}
if(this.keywords.has(name.toLowerCase())){return{valid:!1,reason:'est un mot-clé réservé'}}
return{valid:!0}}
validateCode(){if(!this.editor)return;const code=this.editor.value;const lines=code.split('\n');this.errors=[];if(!code.trim()){this.renderErrors();return}
let hasAlgorithme=!1;let hasVar=!1;let hasConst=!1;let hasDebut=!1;let inVarSection=!1;let inConstSection=!1;let afterDebut=!1;lines.forEach((rawLine,i)=>{const lineNum=i+1;const originalLine=rawLine.trim();if(!originalLine)return;if(originalLine.startsWith('//'))return;const line=this.stripCommentsAndStrings(originalLine).toLowerCase();if(!line)return;if(lineNum===1){const match=line.match(/^algorithme\s+(\w+)\s*;?\s*$/);if(!match){this.addError(lineNum,'Ligne 1 doit être: Algorithme NomAlgo;','error');return}else{hasAlgorithme=!0;const algoName=match[1];const validation=this.isValidIdentifier(algoName);if(!validation.valid){this.addError(lineNum,`Nom algorithme "${algoName}" ${validation.reason}`,'error')}}
return}
if(line.startsWith('var')){const afterVar=line.substring(3).trim();if(afterVar.length>0){this.addError(lineNum,'Déclarez les variables sur les lignes suivantes, pas avec "Var"','error');hasVar=!0;inVarSection=!0;inConstSection=!1;return}
if(afterDebut){this.addError(lineNum,'"Var" doit être avant "Debut"','error')}
hasVar=!0;inVarSection=!0;inConstSection=!1;return}
if(line.startsWith('const')){const afterConst=line.substring(5).trim();if(afterConst.length>0){this.addError(lineNum,'Déclarez les constantes sur les lignes suivantes, pas avec "Const"','error');hasConst=!0;inConstSection=!0;inVarSection=!1;return}
if(afterDebut){this.addError(lineNum,'"Const" doit être avant "Debut"','error')}
hasConst=!0;inConstSection=!0;inVarSection=!1;return}
if(line==='debut'){if(!hasAlgorithme){this.addError(lineNum,'"Debut" sans déclaration Algorithme','error')}
if(originalLine.toLowerCase()!=='debut'){this.addError(lineNum,'"Debut" doit être seul sur la ligne','error')}
hasDebut=!0;afterDebut=!0;inVarSection=!1;inConstSection=!1;return}
if(line==='fin'){if(!hasDebut){this.addError(lineNum,'"Fin" sans "Debut"','error')}
if(originalLine.toLowerCase()!=='fin'){this.addError(lineNum,'"Fin" doit être seul sur la ligne','error')}
return}
if(inVarSection){const varMatch=line.match(/^([a-z_][a-z0-9_,\s]*)\s*:\s*([a-z]+)\s*;?\s*$/i);if(!varMatch){this.addError(lineNum,'Déclaration variable invalide (format: nom: type;)','error');return}
const varNames=varMatch[1].split(',').map(v=>v.trim());const varType=varMatch[2].toLowerCase();const validTypes=['entier','reel','chaine','caractere','booleen','tableau'];if(!validTypes.includes(varType)){this.addError(lineNum,`Type "${varType}" invalide`,'error')}
varNames.forEach(varName=>{const validation=this.isValidIdentifier(varName);if(!validation.valid){this.addError(lineNum,`Variable "${varName}" ${validation.reason}`,'error')}});if(!originalLine.endsWith(';')){this.addError(lineNum,'Point-virgule manquant','warning')}
return}
if(inConstSection){const constMatch=line.match(/^([a-z_][a-z0-9_]*)\s*=\s*(.+?)\s*;?\s*$/i);if(!constMatch){this.addError(lineNum,'Déclaration constante invalide (format: NOM = valeur;)','error');return}
const constName=constMatch[1];const validation=this.isValidIdentifier(constName);if(!validation.valid){this.addError(lineNum,`Constante "${constName}" ${validation.reason}`,'error')}
if(!originalLine.endsWith(';')){this.addError(lineNum,'Point-virgule manquant','warning')}
return}
if(afterDebut){if(this.standaloneKeywords.has(line)){if(line!==originalLine.toLowerCase()){this.addError(lineNum,`"${line}" doit être seul sur la ligne`,'error')}
return}
if(line.startsWith('si ')){if(!line.includes(' alors')){this.addError(lineNum,'Structure "Si" nécessite "alors"','error')}
if(originalLine.endsWith(';')){this.addError(lineNum,'"Si...alors" ne doit pas avoir de point-virgule','warning')}
return}
if(line.startsWith('pour ')){if(!line.includes(' de ')||!line.includes(' a ')||!line.includes(' faire')){this.addError(lineNum,'Structure "Pour" incomplète (pour X de A a B faire)','error')}
if(originalLine.endsWith(';')){this.addError(lineNum,'"Pour...faire" ne doit pas avoir de point-virgule','warning')}
return}
if(line.startsWith('tantque ')){if(!line.includes(' faire')){this.addError(lineNum,'Structure "TantQue" nécessite "faire"','error')}
if(originalLine.endsWith(';')){this.addError(lineNum,'"TantQue...faire" ne doit pas avoir de point-virgule','warning')}
return}
if(line.startsWith('lire(')){if(!line.includes(')')){this.addError(lineNum,'Parenthèse fermante manquante pour lire()','error')}else if(!originalLine.endsWith(';')){this.addError(lineNum,'Point-virgule manquant après lire()','warning')}
return}
if(line.startsWith('ecrire(')){if(!line.includes(')')){this.addError(lineNum,'Parenthèse fermante manquante pour ecrire()','error')}else if(!originalLine.endsWith(';')){this.addError(lineNum,'Point-virgule manquant après ecrire()','warning')}
return}
if(line==='sortir'||line==='sortir;'){if(!originalLine.endsWith(';')){this.addError(lineNum,'Point-virgule manquant après sortir','warning')}
return}
if(line.includes('<-')){const assignMatch=line.match(/^([a-z_][a-z0-9_]*)\s*<-/i);if(!assignMatch){this.addError(lineNum,'Affectation invalide (format: variable <- expression;)','error')}else if(!originalLine.endsWith(';')){this.addError(lineNum,'Point-virgule manquant après affectation','warning')}
return}
if(line.match(/^([a-z_][a-z0-9_]*)\s*=\s*[^=]/i)&&!line.includes('==')){this.addError(lineNum,'Utiliser "<-" pour affectation (pas "=")','error');return}
const identMatch=line.match(/^([a-z_][a-z0-9_]*)\b/i);if(identMatch&&!line.includes('<-')&&!line.match(/^(lire|ecrire|sortir)/)){this.addError(lineNum,'Instruction inconnue ou affectation "<-" manquante','error')}}});this.renderErrors()}
addError(line,message,severity){this.errors.push({line,message,severity})}
renderErrors(){if(!this.errorContainer)return;this.errorContainer.innerHTML='';const lh=this.getLineHeight();this.errors.forEach((err)=>{const dot=document.createElement('div');dot.className=`error-indicator ${err.severity}`;const topPosition=(err.line-1)*lh;dot.style.top=`${topPosition}px`;dot.dataset.tooltip=`Ligne ${err.line}: ${err.message}`;dot.addEventListener('click',()=>{this.scrollToLine(err.line)});this.errorContainer.appendChild(dot)});this.syncScroll()}
getLineHeight(){if(!this.editor)return 22;const computedStyle=getComputedStyle(this.editor);const lh=computedStyle.lineHeight;if(lh==='normal'){const fontSize=parseFloat(computedStyle.fontSize);const lineHeight=fontSize*1.5;return lineHeight}
return parseFloat(lh)}
scrollToLine(n){if(!this.editor)return;const lh=this.getLineHeight();const targetScroll=(n-1)*lh-40;this.editor.scrollTop=targetScroll;this.flashLine(n)}
flashLine(n){if(!this.editor)return;const parent=this.editor.parentElement;if(!parent)return;const lh=this.getLineHeight();const flash=document.createElement('div');flash.className='highlight-flash';flash.style.top=`${(n - 1) * lh}px`;flash.style.height=`${lh}px`;flash.style.transition='opacity 0.5s ease';parent.appendChild(flash);requestAnimationFrame(()=>{flash.style.opacity='1';setTimeout(()=>{flash.style.opacity='0';setTimeout(()=>flash.remove(),500)},150)})}
clearErrors(){if(!this.errorContainer)return;this.errorContainer.innerHTML='';this.errors=[]}
refresh(){this.updateContainerHeight();this.validateCode()}}
window.algoErrorHighlighter=new AlgoErrorHighlighter();window.refreshErrorHighlighting=function(){if(window.algoErrorHighlighter){window.algoErrorHighlighter.refresh()}};window.clearErrorHighlighting=function(){if(window.algoErrorHighlighter){window.algoErrorHighlighter.clearErrors()}};document.addEventListener('click',function(e){if(e.target.classList.contains('error-indicator')){const message=e.target.getAttribute('data-tooltip')}});function showToast(message,type){type=type||'info';document.querySelector('.error-toast')?.remove();const isDark=document.documentElement.getAttribute('data-theme')!=='light';const accent={success:'#10b981',error:'#ef4444',info:'#3b82f6'}[type]||'#3b82f6';const toast=document.createElement('div');toast.className='error-toast';Object.assign(toast.style,{position:'fixed',top:'20px',left:'50%',transform:'translateX(-50%) translateY(-12px)',background:isDark?'#1e293b':'#ffffff',color:isDark?'#e5e7eb':'#1e293b',border:`1px solid ${isDark ? '#334155' : '#cbd5e1'}`,borderLeft:`4px solid ${accent}`,borderRadius:'10px',padding:'12px 24px',fontSize:'14px',fontWeight:'500',fontFamily:'"Inter","Segoe UI",system-ui,sans-serif',boxShadow:isDark?'0 8px 32px rgba(0,0,0,0.5)':'0 8px 32px rgba(0,0,0,0.15)',zIndex:'2147483647',maxWidth:'min(420px,90vw)',textAlign:'center',pointerEvents:'none',opacity:'0',transition:'opacity 0.25s ease, transform 0.25s ease',});toast.textContent=message;document.body.appendChild(toast);requestAnimationFrame(()=>requestAnimationFrame(()=>{toast.style.opacity='1';toast.style.transform='translateX(-50%) translateY(0)'}));setTimeout(()=>{toast.style.opacity='0';toast.style.transform='translateX(-50%) translateY(-12px)';setTimeout(()=>toast.remove(),300)},4000)}
document.addEventListener('click',function(e){if(e.target.classList.contains('error-indicator')){document.querySelectorAll('.error-indicator.active-tip').forEach(el=>{if(el!==e.target)el.classList.remove('active-tip');});e.target.classList.toggle('active-tip')}else{document.querySelectorAll('.error-indicator.active-tip').forEach(el=>el.classList.remove('active-tip'))}})
