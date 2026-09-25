const STORAGE_KEY = 'indiqai-card-prototype-v1';
const DEMO = {
  card: { name: 'Café Aurora', value: 20, goal: 8, reward: 'Café especial', theme: 'purple' },
  draft: { name: 'Café Aurora', value: 20, goal: 8, reward: 'Café especial', theme: 'purple' },
  totalStamps: 3,
  redeemedRewards: 0,
  events: [],
  published: false
};

const ICON = {
  arrow: '<svg class="button-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 10h12m-5-5 5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  stamp: '<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="m8 16 5 5L24 10" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  gift: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="9" width="18" height="12" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M12 9v12M3 13h18M12 9C8.2 9 6 7.7 6 5.7c0-1.4 1-2.4 2.3-2.4C10 3.3 11.4 5 12 9Zm0 0c3.8 0 6-1.3 6-3.3 0-1.4-1-2.4-2.3-2.4C14 3.3 12.6 5 12 9Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>'
};

const app = document.querySelector('#app');
const toast = document.querySelector('#toast');
let toastTimer;
let step = 1;
let quantity = 1;
let lastAward = 0;
let awardLocked = false;

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (stored && stored.card && stored.draft && Number.isFinite(stored.totalStamps)) return stored;
  } catch (_) { /* A demonstração volta ao estado inicial. */ }
  return clone(DEMO);
}
let state = loadState();
function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function esc(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function money(value) { return new Intl.NumberFormat('pt-BR', {style:'currency',currency:'BRL',maximumFractionDigits:0}).format(Number(value) || 0); }
function initials(name) { return String(name || 'IndiqAI').trim().split(/\s+/).slice(0,2).map(w => w[0]?.toUpperCase() || '').join(''); }
function route() { const r = location.hash.replace(/^#/, '').split('?')[0]; return ['inicio','criar','cliente','gestor'].includes(r) ? r : 'inicio'; }
function encodeCard(card) {
  const bytes = new TextEncoder().encode(JSON.stringify(card));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function sharedCardFromHash() {
  const encoded = new URLSearchParams(location.hash.split('?')[1] || '').get('card');
  if (!encoded || encoded.length > 1000) return null;
  try {
    const base64 = encoded.replace(/-/g,'+').replace(/_/g,'/');
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    const card = JSON.parse(new TextDecoder().decode(bytes));
    if (typeof card.name !== 'string' || !card.name.trim() || card.name.length > 32 ||
        typeof card.reward !== 'string' || !card.reward.trim() || card.reward.length > 32 ||
        !Number.isInteger(card.value) || card.value < 1 || card.value > 10000 ||
        !Number.isInteger(card.goal) || card.goal < 1 || card.goal > 12 ||
        !['purple','berry','night'].includes(card.theme)) return null;
    return card;
  } catch (_) { return null; }
}
function applySharedCard() {
  if (route() !== 'cliente') return;
  const incoming = sharedCardFromHash();
  if (!incoming || JSON.stringify(incoming) === JSON.stringify(state.card)) return;
  state.card = incoming;
  state.draft = clone(incoming);
  state.totalStamps = 0;
  state.redeemedRewards = 0;
  state.events = [];
  state.published = true;
  save();
}
function shareUrl() { return `${location.href.split('#')[0]}#cliente?card=${encodeCard(state.card)}`; }
function onlineUrl() { return /^https?:$/.test(location.protocol); }
function progress() { return Math.max(0, state.totalStamps - state.redeemedRewards * state.card.goal); }
function availableRewards() { return Math.max(0, Math.floor(state.totalStamps / state.card.goal) - state.redeemedRewards); }
function notify(message) {
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 3100);
}

function header(current) {
  const items = [['inicio','Início'],['criar','Criar cartão'],['cliente','Cliente'],['gestor','Gestor']];
  const links = items.map(([id,label]) => `<a href="#${id}" ${current===id?'aria-current="page"':''}>${label}</a>`).join('');
  return `<header class="topbar">
    <a class="wordmark" href="#inicio" aria-label="IndiqAI, ir para início"><span class="brand-icon" aria-hidden="true"></span><span>Indiq<em>AI</em></span></a>
    <nav class="topnav" aria-label="Navegação principal">${links}</nav>
    <span class="demo-flag"><span class="demo-dot"></span> PROTÓTIPO · DADOS FICTÍCIOS</span>
  </header><nav class="mobile-nav" aria-label="Navegação principal no celular">${links}</nav>`;
}

function footer() {
  return `<footer class="footer"><span>Uma demonstração local. Nenhum dado é enviado.</span><button type="button" data-action="reset">Recomeçar demonstração</button></footer>`;
}

function cardVisual(card, filled = 0, animated = 0) {
  const goal = Math.max(1, Math.min(12, Number(card.goal) || 8));
  const count = Math.min(goal, Math.max(0, Number(filled) || 0));
  const stamps = Array.from({length:goal}, (_,i) => {
    const isFilled = i < count;
    const isNew = isFilled && i >= Math.max(0, count - animated);
    return `<span class="stamp ${isFilled?'is-filled':''} ${isNew?'is-new':''}" aria-label="${isFilled?'Carimbo recebido':'Carimbo vazio'}">${isFilled?ICON.stamp:''}</span>`;
  }).join('');
  return `<article class="loyalty-card" data-theme="${esc(card.theme)}" aria-label="Cartão fidelidade de ${esc(card.name)}">
    <div class="card-head"><div><div class="card-label">Cartão fidelidade</div><div class="card-business">${esc(card.name || 'Seu negócio')}</div></div><div class="card-mark" aria-hidden="true">${esc(initials(card.name))}</div></div>
    <div class="card-body"><div class="card-rule">A cada ${money(card.value)}, 1 carimbo</div><div class="stamps" aria-label="${count} de ${goal} carimbos neste cartão">${stamps}</div>
      <div class="card-footer"><strong><span class="reward-icon" aria-hidden="true">✦</span>${esc(card.reward || 'Sua recompensa')}</strong><span>${goal} carimbos para ganhar</span></div>
    </div>
  </article>`;
}

function home() {
  return `<main class="page"><section class="hero"><div class="hero-copy">
    <h1>Seu cartão de fidelidade, pronto para circular.</h1>
    <p class="lead">Crie o cartão, mostre o QR no balcão e deixe cada cliente acompanhar os carimbos. Experimente o fluxo antes de construir o produto definitivo.</p>
    <div class="hero-actions"><a class="button button-primary" href="#criar">Criar cartão ${ICON.arrow}</a><a class="button button-secondary" href="#cliente">Ver como cliente</a></div>
    <p class="microcopy home-note">Esta página é um protótipo. Todos os nomes e números são fictícios.</p>
  </div><div class="hero-stage" aria-hidden="true"><div class="stage-card">${cardVisual(state.card, Math.min(state.card.goal,progress()))}</div><div class="stage-badge"><strong>${Math.min(state.card.goal,progress())} de ${state.card.goal}</strong>carimbos no cartão</div></div></section></main>`;
}

function colorPicker() {
  return `<div class="field"><label>Cor do cartão</label><div class="swatches" role="group" aria-label="Cor do cartão">
    <button type="button" class="swatch" style="background:#7541ee" data-action="theme" data-theme="purple" aria-label="Roxo IndiqAI" aria-pressed="${state.draft.theme==='purple'}"></button>
    <button type="button" class="swatch" style="background:#b83773" data-action="theme" data-theme="berry" aria-label="Rosa" aria-pressed="${state.draft.theme==='berry'}"></button>
    <button type="button" class="swatch" style="background:#24244b" data-action="theme" data-theme="night" aria-label="Azul escuro" aria-pressed="${state.draft.theme==='night'}"></button>
  </div></div>`;
}

function qrMarkup() {
  if (!onlineUrl()) return `<div class="qr-fallback">O QR fica disponível quando o protótipo está hospedado.</div>`;
  try {
    const qr = qrcode(0,'M');
    qr.addData(shareUrl());
    qr.make();
    return qr.createSvgTag({cellSize:3,margin:0,scalable:true});
  } catch (_) { return `<div class="qr-fallback">Não foi possível gerar o QR nesta sessão.</div>`; }
}

function builder() {
  const title = step===1 ? 'Comece pelo nome.' : step===2 ? 'Defina o que o cliente ganha.' : 'Seu cartão está pronto.';
  const intro = step===1 ? 'O cartão aparece enquanto você preenche. Depois, ajuste a regra e a recompensa.' : step===2 ? 'Uma regra só. O valor orienta o programa; no atendimento, você escolhe quantos carimbos aplicar.' : 'Compartilhe o QR, veja a experiência do cliente ou simule o primeiro carimbo.';
  let body = '';
  if (step===1) body = `<div class="form-grid">
    <div class="field"><label for="business-name">Nome do negócio</label><input id="business-name" data-field="name" maxlength="32" value="${esc(state.draft.name)}" autocomplete="organization" placeholder="Ex.: Café Aurora"><small>É o nome que o cliente verá no cartão.</small></div>
    ${colorPicker()}
  </div><div class="builder-actions"><button class="button button-primary" type="button" data-action="next">Continuar ${ICON.arrow}</button></div>`;
  if (step===2) body = `<div class="form-grid">
    <div class="field-row"><div class="field"><label for="stamp-value">Valor por carimbo</label><div class="input-prefix"><input id="stamp-value" data-field="value" type="number" min="1" max="10000" step="1" value="${esc(state.draft.value)}" inputmode="numeric"></div><small>Valor de referência exibido no cartão.</small></div>
      <div class="field"><label for="stamp-goal">Carimbos para ganhar</label><input id="stamp-goal" data-field="goal" type="number" min="1" max="12" step="1" value="${esc(state.draft.goal)}" inputmode="numeric"><small>De 1 a 12 no protótipo.</small></div></div>
    <div class="field"><label for="reward-name">Qual é a recompensa?</label><input id="reward-name" data-field="reward" maxlength="32" value="${esc(state.draft.reward)}" placeholder="Ex.: Café especial"><small>Escreva como o cliente reconheceria o prêmio.</small></div>
  </div><div class="builder-actions button-row"><button class="button button-secondary" type="button" data-action="back">Voltar</button><button class="button button-primary" type="button" data-action="next">Publicar cartão ${ICON.arrow}</button></div>`;
  if (step===3) body = `<div class="done-panel"><h3>QR pronto para o balcão</h3><div class="qr-layout"><div class="qr-box" role="img" aria-label="QR para a visão do cliente">${qrMarkup()}</div><div class="qr-copy"><p>${location.hostname==='127.0.0.1'||location.hostname==='localhost'?'O QR aponta para esta máquina. Depois de hospedar, ele abre o cartão no celular.':'Ao escanear, o cliente abre este cartão no celular. Os carimbos da simulação não sincronizam entre aparelhos.'}</p>
    <div class="inline-actions"><button class="button button-secondary" type="button" data-action="copy-link">Copiar link</button><a class="button button-quiet" href="#cliente">Ver como cliente ${ICON.arrow}</a></div></div></div></div>
    <div class="builder-actions"><a class="button button-primary" href="#gestor">Simular carimbos ${ICON.arrow}</a></div>`;
  return `<main class="page"><div class="steps"><div class="step-track" aria-hidden="true">${[1,2,3].map(n=>`<span class="step-bar ${n<=step?'is-done':''}"></span>`).join('')}</div><span class="step-label">${step} de 3</span></div>
    <div class="builder-layout"><section class="builder-main"><h2 tabindex="-1">${title}</h2><p>${intro}</p>${body}<p class="error" id="form-error" role="alert"></p></section>
    <aside class="preview-wrap"><p class="preview-title">O cartão que o cliente vai ver</p><div class="js-live-preview">${cardVisual(step===3?state.card:state.draft,0)}</div><p class="preview-hint">Prévia ilustrativa · sem dados reais</p></aside></div></main>`;
}

function customer() {
  const current = Math.min(state.card.goal, progress());
  const ready = availableRewards();
  const remaining = Math.max(0, state.card.goal - current);
  return `<main class="page"><div class="section-intro"><h2>O cartão da Marina.</h2><p>É assim que um cliente vê o progresso depois de entrar pelo QR. Nesta demonstração, a identificação já está simulada.</p></div>
    <div class="state-layout"><section class="state-main"><div class="customer-head"><div class="avatar">M</div><div><strong>Marina</strong><span>Cliente fictícia · cartão de demonstração</span></div></div>
      <div class="view-card">${cardVisual(state.card,current,lastAward)}</div>
      <div class="progress-summary"><div><strong>${current}/${state.card.goal}</strong><p>carimbos no cartão</p></div><div><strong>${ready>0?'Pronto':remaining}</strong><p>${ready>0?'prêmio disponível':remaining===1?'carimbo para ganhar':'carimbos para ganhar'}</p></div></div>
      <div class="reward-panel">${ICON.gift}<div><strong>${ready>0?`${ready} ${ready===1?'recompensa disponível':'recompensas disponíveis'}`:remaining<=2?`Falta pouco para ${esc(state.card.reward)}`:`Sua recompensa: ${esc(state.card.reward)}`}</strong><p>${ready>0?'Apresente o cartão ao gestor para receber o benefício.':`Junte ${state.card.goal} carimbos e ganhe ${esc(state.card.reward)}.`}</p></div></div>
      <div class="button-row"><a class="button button-primary" href="#gestor">Simular atendimento ${ICON.arrow}</a></div>
    </section><aside class="aside-note"><strong>Como funciona</strong>Mostre seu cartão no balcão. O gestor registra os carimbos e o progresso aparece aqui. Quando completar, apresente o cartão para receber a recompensa.</aside></div></main>`;
}

function eventList() {
  if (!state.events.length) return `<p class="empty-state">${state.totalStamps>0?`O cartão começou com ${state.totalStamps} carimbos fictícios para facilitar a revisão.`:'Nenhum lançamento nesta sessão.'}</p>`;
  return `<ul class="event-list">${state.events.slice(0,5).map(ev=>`<li><strong>${ev.type==='stamp'?`+${ev.amount} ${ev.amount===1?'carimbo':'carimbos'}`:'Recompensa entregue'}</strong><span>${esc(ev.time)}</span></li>`).join('')}</ul>`;
}

function manager() {
  const current = Math.min(state.card.goal, progress());
  const ready = availableRewards();
  return `<main class="page"><div class="section-intro"><h2>Carimbe o cartão da Marina.</h2><p>Escolha quantos carimbos aplicar. O progresso muda na hora.</p></div>
    <div class="state-layout manager-layout"><section class="state-main"><div class="view-card">${cardVisual(state.card,current,lastAward)}</div>
      <div class="progress-summary"><div><strong>${current}/${state.card.goal}</strong><p>carimbos no cartão de Marina</p></div><div><strong>${ready}</strong><p>${ready===1?'prêmio disponível':'prêmios disponíveis'}</p></div></div>
      ${ready>0?`<div class="reward-panel">${ICON.gift}<div><strong>${esc(state.card.reward)} disponível</strong><p>O gestor confirma a entrega. Carimbos excedentes permanecem no próximo ciclo nesta simulação.</p></div></div>`:''}
      <hr class="section-divider"><h3>Atividade desta demonstração</h3>${eventList()}
    </section><aside class="operator-panel"><h3>Aplicar carimbos</h3><div class="operator-person"><div class="avatar">M</div><div><strong>Marina</strong><span>Cartão de ${esc(state.card.name)}</span></div></div>
      <span class="quantity-label">Quantos carimbos agora?</span><div class="quantity-control"><button type="button" data-action="decrease" aria-label="Diminuir quantidade" ${quantity<=1?'disabled':''}>−</button><output aria-live="polite">${quantity}</output><button type="button" data-action="increase" aria-label="Aumentar quantidade">+</button></div>
      <p class="microcopy" style="margin:12px 0 0">Você decide a quantidade neste atendimento.</p><button class="button button-primary" type="button" data-action="award">Aplicar ${quantity} ${quantity===1?'carimbo':'carimbos'} ${ICON.arrow}</button>
      ${ready>0?`<button class="button button-secondary" type="button" data-action="redeem">Marcar 1 recompensa como entregue</button>`:''}
      <p class="operator-sub">Marina já está selecionada para a demonstração. Nenhum pagamento ou visita é verificado; o lançamento fica só neste navegador.</p>
    </aside></div></main>`;
}

function render() {
  const current = route();
  const body = current==='criar'?builder():current==='cliente'?customer():current==='gestor'?manager():home();
  app.innerHTML = `<div class="shell">${header(current)}${body}${footer()}</div>`;
  document.title = `${current==='inicio'?'Protótipo':current==='criar'?'Criar cartão':current==='cliente'?'Visão do cliente':'Área do gestor'} · IndiqAI Card`;
}

function formError(message) { const target=document.querySelector('#form-error'); if (target) target.textContent=message; }
function validStep() {
  if (step===1 && !state.draft.name.trim()) { formError('Escreva o nome do negócio para continuar.'); document.querySelector('#business-name')?.focus(); return false; }
  if (step===2) {
    if (!Number.isInteger(Number(state.draft.value)) || Number(state.draft.value)<1 || Number(state.draft.value)>10000) { formError('Escolha um valor inteiro entre R$ 1 e R$ 10.000.'); document.querySelector('#stamp-value')?.focus(); return false; }
    if (!Number.isInteger(Number(state.draft.goal)) || Number(state.draft.goal)<1 || Number(state.draft.goal)>12) { formError('Escolha de 1 a 12 carimbos.'); document.querySelector('#stamp-goal')?.focus(); return false; }
    if (!state.draft.reward.trim()) { formError('Dê um nome à recompensa.'); document.querySelector('#reward-name')?.focus(); return false; }
  }
  return true;
}

document.addEventListener('input', event => {
  const field = event.target?.dataset?.field;
  if (!field) return;
  state.draft[field] = event.target.value;
  save();
  formError('');
  const preview = document.querySelector('.js-live-preview');
  if (preview) preview.innerHTML = cardVisual(state.draft,0);
});

document.addEventListener('click', async event => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  if (action==='theme') { state.draft.theme=button.dataset.theme; save(); render(); return; }
  if (action==='back') { step=Math.max(1,step-1); render(); return; }
  if (action==='next') {
    if (!validStep()) return;
    if (step===2) {
      state.card = {...state.draft,value:Number(state.draft.value),goal:Number(state.draft.goal)};
      state.totalStamps=0; state.redeemedRewards=0; state.events=[]; state.published=true;
      save();
    }
    step=Math.min(3,step+1); render(); document.querySelector('.builder-main h2')?.focus(); return;
  }
  if (action==='increase') { quantity=Math.min(99,quantity+1); render(); return; }
  if (action==='decrease') { quantity=Math.max(1,quantity-1); render(); return; }
  if (action==='award') {
    if (awardLocked) return;
    awardLocked=true;
    const amount=quantity;
    state.totalStamps+=amount;
    state.events.unshift({type:'stamp',amount,time:new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(new Date())});
    lastAward=amount; quantity=1; save(); render();
    notify(`${amount} ${amount===1?'carimbo aplicado':'carimbos aplicados'} no cartão de Marina.`);
    setTimeout(()=>{awardLocked=false;lastAward=0;},700);
    return;
  }
  if (action==='redeem') {
    if (availableRewards()<=0) return;
    state.redeemedRewards+=1;
    state.events.unshift({type:'reward',amount:1,time:new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(new Date())});
    lastAward=0; save(); render(); notify('Recompensa marcada como entregue.'); return;
  }
  if (action==='copy-link') {
    if (!onlineUrl()) { notify('Hospede o protótipo para compartilhar o link pelo celular.'); return; }
    try { await navigator.clipboard.writeText(shareUrl()); notify('Link do cartão copiado.'); }
    catch (_) { notify('Não foi possível copiar. Use o endereço desta página com #cliente.'); }
    return;
  }
  if (action==='reset') {
    if (!confirm('Recomeçar a demonstração e apagar os carimbos fictícios deste navegador?')) return;
    localStorage.removeItem(STORAGE_KEY); state=clone(DEMO); step=1; quantity=1; lastAward=0; location.hash='inicio'; render(); notify('Demonstração reiniciada.');
  }
});

window.addEventListener('hashchange', () => { applySharedCard(); render(); window.scrollTo({top:0,behavior:'instant'}); });
applySharedCard();
render();
