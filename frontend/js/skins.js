// ===================== スキン =====================
const SKINS = [
  { id:'default', name:'ミッドナイトキャンディ', price:0, desc:'定番のパープル×ゴールドの夜空テーマ。',
    vars:{ '--bg-deep':'#1a1233','--bg-deep2':'#241a45','--panel':'#2c2054','--panel-light':'#382a68',
      '--gold':'#FFD93D','--coral':'#FF6B6B','--mint':'#3DDC97','--blue':'#4D96FF','--purple':'#B18CFF',
      '--pink':'#FF6FB5','--lime':'#C6E62D','--text':'#F5F3FF','--text-dim':'#B7ADDA' },
    titleGrad:'linear-gradient(90deg, #FFD93D, #FF6FB5)',
    colors:[
      {bg:'linear-gradient(135deg,#FF8B8B,#FF6B6B)'},{bg:'linear-gradient(135deg,#5FE3B3,#3DDC97)'},
      {bg:'linear-gradient(135deg,#6FB0FF,#4D96FF)'},{bg:'linear-gradient(135deg,#C9A8FF,#B18CFF)'},
      {bg:'linear-gradient(135deg,#FF95C9,#FF6FB5)'},{bg:'linear-gradient(135deg,#E1F065,#C6E62D)'},
      {bg:'linear-gradient(135deg,#FFE270,#FFD93D)'}
    ] },
  { id:'sunset', name:'サンセットソーダ', price:150, desc:'夕焼けとクリームソーダの暖色パレット。',
    vars:{ '--bg-deep':'#2b1024','--bg-deep2':'#4a1730','--panel':'#5c2038','--panel-light':'#742a44',
      '--gold':'#FFB74D','--coral':'#FF6B4A','--mint':'#FFD97D','--blue':'#FF8F6B','--purple':'#FF9AA8',
      '--pink':'#FF5E8E','--lime':'#FFDD6B','--text':'#FFF3E8','--text-dim':'#E3AFAF' },
    titleGrad:'linear-gradient(90deg,#FFB74D,#FF5E8E)',
    colors:[
      {bg:'linear-gradient(135deg,#FFB199,#FF7B54)'},{bg:'linear-gradient(135deg,#FFD97D,#FFB74D)'},
      {bg:'linear-gradient(135deg,#FF9AA8,#FF5E8E)'},{bg:'linear-gradient(135deg,#FFCF6B,#FF9A3C)'},
      {bg:'linear-gradient(135deg,#FF8AAE,#E8497A)'},{bg:'linear-gradient(135deg,#FFE29A,#FFC15E)'},
      {bg:'linear-gradient(135deg,#FF7E67,#E8503A)'}
    ] },
  { id:'ocean', name:'ディープオーシャン', price:200, desc:'深海の静けさをまとったブルー×ティール。',
    vars:{ '--bg-deep':'#07161f','--bg-deep2':'#0c2733','--panel':'#123444','--panel-light':'#1a4557',
      '--gold':'#4DE0E0','--coral':'#FF8A65','--mint':'#3DDCC0','--blue':'#4DA6FF','--purple':'#6FA8DC',
      '--pink':'#5FC9E8','--lime':'#7FE0C6','--text':'#EAFBFF','--text-dim':'#8FC4D6' },
    titleGrad:'linear-gradient(90deg,#4DE0E0,#4DA6FF)',
    colors:[
      {bg:'linear-gradient(135deg,#6FE3D8,#3DDCC0)'},{bg:'linear-gradient(135deg,#6FB0FF,#3E7EDB)'},
      {bg:'linear-gradient(135deg,#7FE0C6,#39B893)'},{bg:'linear-gradient(135deg,#8FD3FF,#4DA6FF)'},
      {bg:'linear-gradient(135deg,#5FC9E8,#2E9BC2)'},{bg:'linear-gradient(135deg,#4DE0E0,#20B2B2)'},
      {bg:'linear-gradient(135deg,#A0F0E6,#5FD6C4)'}
    ] },
  { id:'neon', name:'ネオンナイト', price:300, desc:'漆黒に浮かぶ蛍光カラーのサイバーテーマ。',
    vars:{ '--bg-deep':'#08060f','--bg-deep2':'#120a24','--panel':'#1c1030','--panel-light':'#28163f',
      '--gold':'#F5FF3D','--coral':'#FF3DBB','--mint':'#3DFFD5','--blue':'#3DAFFF','--purple':'#B93DFF',
      '--pink':'#FF3DBB','--lime':'#C6FF3D','--text':'#F2F0FF','--text-dim':'#9C8FCC' },
    titleGrad:'linear-gradient(90deg,#F5FF3D,#FF3DBB)',
    colors:[
      {bg:'linear-gradient(135deg,#FF6DD9,#FF3DBB)'},{bg:'linear-gradient(135deg,#5DFFE0,#3DFFD5)'},
      {bg:'linear-gradient(135deg,#6DC3FF,#3DAFFF)'},{bg:'linear-gradient(135deg,#CE7DFF,#B93DFF)'},
      {bg:'linear-gradient(135deg,#FF7DCF,#FF3DBB)'},{bg:'linear-gradient(135deg,#E0FF6D,#C6FF3D)'},
      {bg:'linear-gradient(135deg,#FBFF6D,#F5FF3D)'}
    ] },
  { id:'sakura', name:'さくらパステル', price:250, desc:'春の花びらのようなやわらかいピンク×白。',
    vars:{ '--bg-deep':'#2a1a22','--bg-deep2':'#3d2530','--panel':'#4a2c3a','--panel-light':'#5c3849',
      '--gold':'#FFC1CC','--coral':'#FF9EB5','--mint':'#C8F0DD','--blue':'#B8D8F0','--purple':'#D9C1EA',
      '--pink':'#FFB3D1','--lime':'#E8F0B8','--text':'#FFF6F8','--text-dim':'#D9AFC0' },
    titleGrad:'linear-gradient(90deg,#FFC1CC,#D9C1EA)',
    colors:[
      {bg:'linear-gradient(135deg,#FFD1DC,#FF9EB5)'},{bg:'linear-gradient(135deg,#D6F5E3,#C8F0DD)'},
      {bg:'linear-gradient(135deg,#D2E7FA,#B8D8F0)'},{bg:'linear-gradient(135deg,#E9D8F5,#D9C1EA)'},
      {bg:'linear-gradient(135deg,#FFC7E0,#FFB3D1)'},{bg:'linear-gradient(135deg,#F1F5C6,#E8F0B8)'},
      {bg:'linear-gradient(135deg,#FFE3EA,#FFC1CC)'}
    ] },
  { id:'goldlux', name:'ゴールドラグジュアリー', price:500, desc:'漆黒とゴールドの高級ジュエリーテーマ。',
    vars:{ '--bg-deep':'#0a0a0a','--bg-deep2':'#161412','--panel':'#211c16','--panel-light':'#332b1f',
      '--gold':'#F5D57A','--coral':'#E8A33D','--mint':'#D4B26A','--blue':'#C9A24A','--purple':'#B8934A',
      '--pink':'#F0C97A','--lime':'#E0C05A','--text':'#FBF3E0','--text-dim':'#B8A582' },
    titleGrad:'linear-gradient(90deg,#F5D57A,#E8A33D)',
    colors:[
      {bg:'linear-gradient(135deg,#F5D57A,#D4A94A)'},{bg:'linear-gradient(135deg,#F0C060,#D89B2E)'},
      {bg:'linear-gradient(135deg,#E8B84A,#C79430)'},{bg:'linear-gradient(135deg,#F5E0A0,#E0BA5A)'},
      {bg:'linear-gradient(135deg,#D9A94E,#B8873A)'},{bg:'linear-gradient(135deg,#F0D890,#DDB758)'},
      {bg:'linear-gradient(135deg,#EFCB74,#C99A3E)'}
    ] }
];

window.ownedSkins = ['default'];
window.equippedSkin = 'default';
window.COLORS = [];

function applySkin(id) {
  const skin = SKINS.find(s => s.id === id) || SKINS[0];
  window.equippedSkin = skin.id;
  Object.entries(skin.vars).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
  const titleEl = document.querySelector('.title');
  if (titleEl) titleEl.style.background = skin.titleGrad;
  window.COLORS.length = 0;
  skin.colors.forEach(c => window.COLORS.push(c));
  if (G.cellEls && G.cellEls.length) {
    G.board.forEach((cellData, idx) => {
      if (cellData.filled && window.COLORS[cellData.colorIdx]) {
        G.cellEls[idx].style.background = window.COLORS[cellData.colorIdx].bg;
      }
    });
  }
  renderTray();
}

function buySkin(id) {
  const skin = SKINS.find(s => s.id === id);
  if (!skin || window.ownedSkins.includes(id) || G.coins < skin.price) return;
  G.coins -= skin.price;
  window.ownedSkins.push(id);
  updateCoinUI();
  saveSkinsData();
  syncToServer();
  renderSettingsModal('skin');
}

function equipSkin(id) {
  if (!window.ownedSkins.includes(id)) return;
  applySkin(id);
  saveSkinsData();
  renderSettingsModal('skin');
}

function renderSkinTab() {
  let html = `<div class="sub" style="margin-bottom:10px;">🪙 ${G.coins} 所持中。ゲームで貯めたコインで見た目を変えられます。</div>`;
  SKINS.forEach(skin => {
    const owned = window.ownedSkins.includes(skin.id);
    const equipped = window.equippedSkin === skin.id;
    const canBuy = !owned && G.coins >= skin.price;
    let btnLabel = equipped ? '装備中' : owned ? '装備する' : (skin.price === 0 ? '入手する' : (canBuy ? '購入する' : 'コインが足りません'));
    let btnAction = equipped ? '' : owned ? 'equip' : 'buy';
    html += `
      <div class="quest-item">
        <div class="qtitle">${skin.name}${equipped ? ' ✅' : ''}</div>
        <div class="sub" style="margin:2px 0 8px;">${skin.desc}</div>
        <div class="skin-swatches">${skin.colors.map(c => `<span class="swatch" style="background:${c.bg}"></span>`).join('')}</div>
        <div class="quest-foot" style="margin-top:8px;">
          <span>${skin.price === 0 ? '無料' : `🪙${skin.price}`}</span>
          <button class="claim-btn" data-skin="${skin.id}" data-action="${btnAction}" ${(equipped || (!owned && !canBuy)) ? 'disabled' : ''}>${btnLabel}</button>
        </div>
      </div>`;
  });
  return html;
}
