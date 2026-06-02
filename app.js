// --- 1. 파이어베이스 연동 ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  // 👇 회원님의 키값 유지 👇
  apiKey: "AIzaSyDDXX1GEJ5br5jUAR6ksuc7njSYLlrDXHA",
  authDomain: "mybluemarble-96403.firebaseapp.com",
  projectId: "mybluemarble-96403",
  storageBucket: "mybluemarble-96403.firebasestorage.app",
  messagingSenderId: "933506222719",
  appId: "1:933506222719:web:37ba7d885b003556e8cd4a",
  measurementId: "G-WRN3PCVZWC"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- 2. 전역 변수 설정 ---
window.boardData = [];
window.players = [];
window.currentPlayerIndex = 0;
let selectedDice1 = null;
let selectedDice2 = null;
window.isMoving = false;
window.movingPlayerId = null;
window.isWaitingNextTurn = false;
window.currentIsDouble = false;
window.gameMode = 'normal';
window.historyStack = [];
window.socialFund = 0; // 사회복지기금 누적 금액
window.waitingForSpaceClick = false; // 우주여행 시 목적지 클릭 대기 상태

// --- 커스텀 알럿 큐 시스템 ---
window.alertQueue = [];
window.isAlertShowing = false;

window.showCustomAlert = (msg) => {
  window.alertQueue.push(msg);
  window.processAlertQueue();
};

window.processAlertQueue = () => {
  if (window.isAlertShowing || window.alertQueue.length === 0) return;
  window.isAlertShowing = true;
  const msg = window.alertQueue.shift();
  document.getElementById('custom-alert-msg').innerText = msg;
  document.getElementById('custom-alert').style.display = 'flex';
};

window.closeCustomAlert = () => {
  document.getElementById('custom-alert').style.display = 'none';
  window.isAlertShowing = false;
  window.processAlertQueue();
};

// --- 드래그 앤 드롭 로직 ---
const playerSetup = document.getElementById('player-setup');
let draggedItem = null;

playerSetup.addEventListener('dragstart', (e) => {
  let target = e.target;
  if (!target.classList.contains('draggable-item')) {
    target = target.closest('.draggable-item');
  }
  if (target) {
    draggedItem = target;
    setTimeout(() => target.classList.add('dragging'), 0);
  }
});

playerSetup.addEventListener('dragend', (e) => {
  let target = e.target;
  if (!target.classList.contains('draggable-item')) {
    target = target.closest('.draggable-item');
  }
  if (target) {
    target.classList.remove('dragging');
    draggedItem = null;
  }
});

playerSetup.addEventListener('dragover', (e) => {
  e.preventDefault();
  const afterElement = getDragAfterElement(playerSetup, e.clientY);
  if (draggedItem) {
    if (afterElement == null) {
      playerSetup.appendChild(draggedItem);
    } else {
      playerSetup.insertBefore(draggedItem, afterElement);
    }
  }
});

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.draggable-item:not(.dragging)')];
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// --- 터치(태블릿/모바일) 드래그 앤 드롭 로직 ---
let touchDraggedItem = null;

playerSetup.addEventListener('touchstart', (e) => {
  if (e.target.classList.contains('drag-handle')) {
    touchDraggedItem = e.target.closest('.draggable-item');
    setTimeout(() => touchDraggedItem.classList.add('dragging'), 0);
  }
}, { passive: false });

playerSetup.addEventListener('touchmove', (e) => {
  if (!touchDraggedItem) return;
  e.preventDefault(); // 스크롤 방지
  const touch = e.touches[0];
  const afterElement = getDragAfterElement(playerSetup, touch.clientY);
  if (afterElement == null) {
    playerSetup.appendChild(touchDraggedItem);
  } else {
    playerSetup.insertBefore(touchDraggedItem, afterElement);
  }
}, { passive: false });

playerSetup.addEventListener('touchend', () => {
  if (touchDraggedItem) {
    touchDraggedItem.classList.remove('dragging');
    touchDraggedItem = null;
  }
});

const board = document.getElementById('board');

// --- 3. 데이터 불러오기 ---
async function fetchBoardData() {
  try {
    const querySnapshot = await getDocs(collection(db, "blue_marble_board"));
    const dataArray = [];
    querySnapshot.forEach((doc) => dataArray.push(doc.data()));
    
    if (dataArray.length === 0) return;
    
    window.boardData = dataArray.sort((a, b) => a.id - b.id);
    renderBoard(window.boardData);
  } catch (error) {
    console.error("데이터 불러오기 실패:", error);
  }
}

// --- 4. 보드판 그리기 ---
function renderBoard(data) {
  const existingSpaces = board.querySelectorAll('.space');
  existingSpaces.forEach(space => space.remove());

  for (let i = 0; i < 40; i++) {
    const spaceData = data[i];
    const space = document.createElement('div');
    space.classList.add('space');
    space.id = 'space-' + i; 
    
    if (i % 10 === 0) space.classList.add('corner');
    
    let contentHTML = `<span class="name">${spaceData.name}</span>`;
    if (spaceData.type === 'city' || spaceData.type === 'resort') {
      contentHTML += `<span class="price">${spaceData.price_land}만</span>`;
    }
    space.innerHTML = contentHTML;
    
    let col, row;
    if (i >= 0 && i <= 10) { row = 11; col = 11 - i; } 
    else if (i > 10 && i <= 20) { col = 1; row = 11 - (i - 10); } 
    else if (i > 20 && i <= 30) { row = 1; col = 1 + (i - 20); } 
    else { col = 11; row = 1 + (i - 30); }
    
    space.style.gridColumn = col;
    space.style.gridRow = row;
    
    // 소유자가 있으면 텍스트와 배경색 반영
    if (spaceData.owner !== undefined) {
      const ownerColor = window.players.find(p => p.id === spaceData.owner).color;
      space.style.borderBottom = `5px solid ${ownerColor}`;
      space.style.backgroundColor = ownerColor + "4D";
      space.classList.add("owned-text");
    }
    
    space.onclick = () => {
      const currentPlayer = window.players[window.currentPlayerIndex];
      // 우주여행 이동 처리
      if (window.waitingForSpaceClick && currentPlayer.isSpaceTravel) {
        currentPlayer.position = i;
        currentPlayer.isSpaceTravel = false;
        window.waitingForSpaceClick = false;
        drawTokens();
        
        if (i === 0 && window.gameMode !== 'normal') currentPlayer.money += 20; // 출발지 도착 시 월급
        updateScoreBoard();
        handleLandEvent(currentPlayer, false);
        return;
      }

      if (window.isWaitingNextTurn) {
        const currentPlayer = window.players[window.currentPlayerIndex];
        currentPlayer.position = i;
        drawTokens();
        window.isWaitingNextTurn = false;
        handleLandEvent(currentPlayer, window.currentIsDouble);
      }
    };
    
    board.appendChild(space);
  }
}

// --- 5. 플레이어 말 그리기 ---
function drawTokens() {
  for (let i = 0; i < 40; i++) {
    const spaceEl = document.getElementById('space-' + i);
    if (!spaceEl) continue;

    let container = spaceEl.querySelector('.token-container');
    if (container) container.remove();

    const playersHere = window.players.filter(p => p.position === i);
    
    if (playersHere.length > 0) {
      container = document.createElement('div');
      container.className = 'token-container';
      
      playersHere.forEach(p => {
        const token = document.createElement('div');
        token.className = 'token';
        token.style.borderColor = p.color;
        token.innerText = p.char;
        
        if (window.isMoving && window.movingPlayerId === p.id) {
          token.classList.add('bouncing');
        }
        container.appendChild(token);
      });
      spaceEl.appendChild(container);
    }
  }
}

// --- 6. 게임 시작 로직 ---
window.startGame = () => {
  if (window.boardData.length === 0) return;

  const modeRadios = document.getElementsByName('gameMode');
  for (let radio of modeRadios) {
    if (radio.checked) {
      window.gameMode = radio.value;
      break;
    }
  }

  // 선택된 시작 자금 가져오기
  let startMoney = 500;
  const moneyRadios = document.getElementsByName('startMoney');
  for (let radio of moneyRadios) {
    if (radio.checked) {
      startMoney = parseInt(radio.value, 10);
      break;
    }
  }

  const inputs = document.querySelectorAll('.player-input');
  const chars = document.querySelectorAll('.player-char');
  const colors = ["#FF5252", "#448AFF", "#FFC107", "#4CAF50"];
  window.socialFund = 0;
  window.players = [
    { id: 0, name: inputs[0].value, char: chars[0].value, position: 0, color: colors[0], money: startMoney, islandTurns: 0, isSpaceTravel: false, bankrupt: false, exemptionCards: 0 },
    { id: 1, name: inputs[1].value, char: chars[1].value, position: 0, color: colors[1], money: startMoney, islandTurns: 0, isSpaceTravel: false, bankrupt: false, exemptionCards: 0 },
    { id: 2, name: inputs[2].value, char: chars[2].value, position: 0, color: colors[2], money: startMoney, islandTurns: 0, isSpaceTravel: false, bankrupt: false, exemptionCards: 0 },
    { id: 3, name: inputs[3].value, char: chars[3].value, position: 0, color: colors[3], money: startMoney, islandTurns: 0, isSpaceTravel: false, bankrupt: false, exemptionCards: 0 }
  ];

  document.getElementById('setup-screen').style.display = 'none';
  document.getElementById('scoreboard').style.display = 'flex';
  document.getElementById('dice-screen').style.display = 'block';
  
  saveState(); // 게임 초기 상태 저장
  updateScoreBoard();
  drawTokens(); 
  updateTurnUI();
};

function updateTurnUI() {
  const currentPlayer = window.players[window.currentPlayerIndex];
  
  if (currentPlayer.bankrupt) {
    window.currentPlayerIndex = (window.currentPlayerIndex + 1) % 4; // 파산한 플레이어 건너뛰기
    updateTurnUI();
    return;
  }

  document.getElementById('turn-indicator').innerText = `🎲 ${currentPlayer.char} ${currentPlayer.name}의 턴!`;
  document.getElementById('turn-indicator').style.color = currentPlayer.color;
  
  selectedDice1 = null;
  selectedDice2 = null;
  document.getElementById('move-btn').style.display = 'none';
  document.querySelectorAll('.dice-row button').forEach(btn => btn.classList.remove('selected'));

  // 우주여행 상태 처리
  if (currentPlayer.isSpaceTravel) {
    document.getElementById('turn-indicator').innerText = `🚀 ${currentPlayer.char} ${currentPlayer.name} 우주여행! 이동할 칸을 클릭하세요.`;
    document.getElementById('dice1-row').style.display = 'none';
    document.getElementById('dice2-row').style.display = 'none';
    document.getElementById('dice1-label').style.display = 'none';
    document.getElementById('dice2-label').style.display = 'none';
    document.getElementById('auto-dice-container').style.display = 'none';
    window.waitingForSpaceClick = true;
    return;
  } else {
    if (window.gameMode === 'auto') {
      document.getElementById('dice1-row').style.display = 'none';
      document.getElementById('dice2-row').style.display = 'none';
      document.getElementById('dice1-label').style.display = 'none';
      document.getElementById('dice2-label').style.display = 'none';
      document.getElementById('auto-dice-container').style.display = 'block';
    } else {
      document.getElementById('dice1-row').style.display = 'flex';
      document.getElementById('dice2-row').style.display = 'flex';
      document.getElementById('dice1-label').style.display = 'block';
      document.getElementById('dice2-label').style.display = 'block';
      document.getElementById('auto-dice-container').style.display = 'none';
    }
    window.waitingForSpaceClick = false;
  }

  // 무인도 탈출 버튼 처리
  let escapeBtn = document.getElementById('escape-island-btn');
  if (currentPlayer.islandTurns > 0) {
    document.getElementById('turn-indicator').innerText += ` (무인도 고립 ${currentPlayer.islandTurns}턴 남음)`;
    if (!escapeBtn) {
      escapeBtn = document.createElement('button');
      escapeBtn.id = 'escape-island-btn';
      escapeBtn.className = 'start-btn';
      escapeBtn.style.marginTop = '10px';
      escapeBtn.innerText = '💸 20만 지불하고 탈출';
      document.getElementById('dice-screen').appendChild(escapeBtn);
    }
    escapeBtn.style.display = 'inline-block';
    escapeBtn.onclick = () => {
      if (currentPlayer.money >= 20 || window.gameMode === 'normal') {
        if (window.gameMode !== 'normal') currentPlayer.money -= 20;
        currentPlayer.islandTurns = 0;
        showCustomAlert("20만원을 지불하고 무인도에서 즉시 탈출했습니다!");
        updateScoreBoard();
        updateTurnUI();
      } else {
        showCustomAlert("돈이 부족하여 탈출할 수 없습니다!");
      }
    };
  } else {
    if (escapeBtn) escapeBtn.style.display = 'none';
  }
}

// --- 주사위 굴리기 애니메이션 (자동 모드 전용) ---
window.autoRollDice = () => {
  const btn = document.getElementById('auto-roll-btn');
  btn.disabled = true;
  btn.style.animation = 'none';
  
  const overlay = document.createElement('div');
  overlay.className = 'rolling-dice-overlay';
  document.getElementById('board').appendChild(overlay);

  const die1 = document.createElement('div');
  die1.className = 'rolling-die-anim';
  const die2 = document.createElement('div');
  die2.className = 'rolling-die-anim';
  
  overlay.appendChild(die1);
  overlay.appendChild(die2);

  // 2초 동안 주사위가 랜덤하게 튀는 애니메이션
  let rollInterval = setInterval(() => {
    die1.innerText = Math.floor(Math.random() * 6) + 1;
    die2.innerText = Math.floor(Math.random() * 6) + 1;
    
    die1.style.top = (Math.random() * 70 + 10) + '%';
    die1.style.left = (Math.random() * 70 + 10) + '%';
    die1.style.transform = `rotate(${Math.random() * 360}deg)`;

    die2.style.top = (Math.random() * 70 + 10) + '%';
    die2.style.left = (Math.random() * 70 + 10) + '%';
    die2.style.transform = `rotate(${Math.random() * 360}deg)`;
  }, 100);

  setTimeout(() => {
    clearInterval(rollInterval);
    
    // 최종 결정된 값
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    
    die1.style.top = '45%'; die1.style.left = '40%';
    die1.style.transform = `translate(-50%, -50%) rotate(0deg)`;
    die1.innerText = d1;
    
    die2.style.top = '45%'; die2.style.left = '60%';
    die2.style.transform = `translate(-50%, -50%) rotate(0deg)`;
    die2.innerText = d2;

    const resultText = document.createElement('div');
    resultText.className = 'dice-result-text';
    resultText.innerText = (d1 === d2) ? `더블!\n${d1 + d2}` : `${d1 + d2}`;
    overlay.appendChild(resultText);

    setTimeout(() => {
      overlay.remove();
      btn.disabled = false;
      btn.style.animation = 'pulse-glow 1s infinite alternate';
      window.selectDice(1, d1);
      window.selectDice(2, d2);
      window.movePlayer();
    }, 1500);
  }, 2000);
};

window.selectDice = (diceNumber, value) => {
  const rowId = diceNumber === 1 ? 'dice1-row' : 'dice2-row';
  const buttons = document.querySelectorAll(`#${rowId} button`);
  buttons.forEach(btn => btn.classList.remove('selected'));
  buttons[value - 1].classList.add('selected');

  if (diceNumber === 1) selectedDice1 = value;
  if (diceNumber === 2) selectedDice2 = value;

  if (selectedDice1 !== null && selectedDice2 !== null) {
    document.getElementById('move-btn').style.display = 'inline-block';
  }
};

window.movePlayer = () => {
  const total = selectedDice1 + selectedDice2;
  const isDouble = selectedDice1 === selectedDice2;
  const currentPlayer = window.players[window.currentPlayerIndex];

  document.getElementById('move-btn').style.display = 'none';
  
  // 무인도 로직
  if (currentPlayer.islandTurns > 0) {
    if (isDouble) {
      showCustomAlert("더블! 무인도에서 기적적으로 탈출합니다.");
      currentPlayer.islandTurns = 0;
    } else {
      currentPlayer.islandTurns--;
      showCustomAlert(`주사위 합 ${total}. 탈출 실패. (남은 고립 턴: ${currentPlayer.islandTurns})`);
      endTurn(false);
      return;
    }
  }

  let movesLeft = total;
  window.isMoving = true;
  window.movingPlayerId = currentPlayer.id;

  const moveInterval = setInterval(() => {
    currentPlayer.position = (currentPlayer.position + 1) % 40;
    
    // 출발지 통과 시 20만원 월급
    if (currentPlayer.position === 0 && window.gameMode !== 'normal') {
      currentPlayer.money += 20;
      updateScoreBoard();
    }

    movesLeft--;
    document.getElementById('turn-indicator').innerText = `🏃‍♂️ ${currentPlayer.char} ${currentPlayer.name} 이동 중... (남은 칸: ${movesLeft})`;
    drawTokens(); 

    if (movesLeft === 0) {
      clearInterval(moveInterval);
      window.isMoving = false;
      drawTokens(); 
      setTimeout(() => {
        handleLandEvent(currentPlayer, isDouble);
      }, 300);
    }
  }, 200); 
};

function updateScoreBoard() {
  window.players.forEach(p => {
    const scoreEl = document.getElementById(`score-${p.id}`);
    if (scoreEl) {
      const exemptionText = p.exemptionCards > 0 ? ` [🎫${p.exemptionCards}]` : '';
      if (p.bankrupt) {
        scoreEl.innerText = `${p.char} ${p.name}: 파산💀`;
        scoreEl.style.textDecoration = "line-through";
        scoreEl.style.color = "#999";
      } else if (window.gameMode === 'normal') {
        scoreEl.innerText = `${p.char} ${p.name}${exemptionText}`;
        scoreEl.style.color = p.color;
      } else {
        scoreEl.innerText = `${p.char} ${p.name}: ${Number(p.money.toFixed(2))}만${exemptionText}`;
        scoreEl.style.color = p.color;
      }
    }
  });
}

// --- 7. 도착 이벤트 (건물 및 통행료 갱신) ---
window.handleLandEvent = (player, isDouble) => {
  const spaceIndex = player.position; 
  const currentSpace = window.boardData[spaceIndex];
  
  document.getElementById('dice-screen').style.display = 'none';
  document.getElementById('action-screen').style.display = 'block';
  
  const titleEl = document.getElementById('action-title');
  const descEl = document.getElementById('action-desc');
  const btnEl = document.getElementById('action-buttons');
  
  titleEl.innerText = currentSpace.name;
  btnEl.innerHTML = ''; 

  if (currentSpace.type === 'city' || currentSpace.type === 'resort' || currentSpace.type === 'vehicle') {
    if (currentSpace.owner === undefined) {
      // 빈 땅
      descEl.innerText = `주인이 없는 곳입니다.\n땅 구매가: ${currentSpace.price_land}만원`;
      btnEl.innerHTML = `
        <button class="start-btn" style="background-color: #4CAF50;" onclick="buyLand(${spaceIndex}, ${currentSpace.price_land}, ${isDouble})">구매하기</button>
        <button class="start-btn" style="background-color: #9e9e9e;" onclick="endTurn(${isDouble})">건너뛰기</button>
      `;
    } else if (currentSpace.owner !== player.id) {
      // 남의 땅
      const owner = window.players[currentSpace.owner];
      let totalToll = currentSpace.toll_land || 5; 
      const b = currentSpace.buildings || {};
      
      if (b.villa) totalToll += (currentSpace.toll_villa || 5);
      if (b.building) totalToll += (currentSpace.toll_building || 15);
      if (b.hotel) totalToll += (currentSpace.toll_hotel || 30);

      totalToll = Number(totalToll.toFixed(2)); // 부동소수점 계산 오차 방지

      descEl.innerText = `앗! ${owner.name}의 소유지입니다.\n통행료 ${totalToll}만원을 지불해야 합니다.`;
      let tollBtns = `<button class="start-btn" onclick="payToll(${currentSpace.owner}, ${totalToll}, ${isDouble})">지불하기</button>`;
      if (player.exemptionCards > 0) {
        tollBtns += ` <button class="start-btn" style="background-color: gold; color: black; margin-left: 5px;" onclick="useExemptionCard(${isDouble})">🎫우대권 사용</button>`;
      }
      btnEl.innerHTML = tollBtns;
    } else {
      if (currentSpace.type === 'city') {
        // 내 땅 (건물 짓기)
        const b = currentSpace.buildings || {};
        let buildHTML = '';
        
        const pVilla = currentSpace.price_villa || 10;
        const pBldg = currentSpace.price_building || 20;
        const pHotel = currentSpace.price_hotel || 30;
  
        if (!b.villa) buildHTML += `<button class="build-btn" onclick="buildBuilding(${spaceIndex}, 'villa', ${pVilla}, ${isDouble})">⛺별장(${pVilla}만)</button>`;
        if (!b.building) buildHTML += `<button class="build-btn" onclick="buildBuilding(${spaceIndex}, 'building', ${pBldg}, ${isDouble})">🏢빌딩(${pBldg}만)</button>`;
        if (!b.hotel) buildHTML += `<button class="build-btn" onclick="buildBuilding(${spaceIndex}, 'hotel', ${pHotel}, ${isDouble})">🏨호텔(${pHotel}만)</button>`;
  
        if (buildHTML === '') {
          descEl.innerText = "더 이상 지을 건물이 없습니다. 편히 쉬세요!";
          btnEl.innerHTML = `<button class="start-btn" onclick="endTurn(${isDouble})">확인</button>`;
        } else {
          descEl.innerText = "내 영지입니다! 건물을 추가하시겠습니까?";
          btnEl.innerHTML = buildHTML + `<br><br><button class="start-btn" style="background-color: #9e9e9e;" onclick="endTurn(${isDouble})">건설 안 함</button>`;
        }
      } else {
        descEl.innerText = "특수 시설(휴양지/여객기)입니다. 건물은 지을 수 없습니다.";
        btnEl.innerHTML = `<button class="start-btn" onclick="endTurn(${isDouble})">확인</button>`;
      }
    }
  } else if (currentSpace.type === 'start') {
    descEl.innerText = "출발지입니다. (지나갈 때마다 20만원 획득)";
    btnEl.innerHTML = `<button class="start-btn" onclick="endTurn(${isDouble})">확인</button>`;
  } else if (currentSpace.type === 'island') {
    if (player.islandTurns === 0) {
      player.islandTurns = 3;
      descEl.innerText = "무인도에 갇혔습니다!\n3턴 동안 이동할 수 없으며, 주사위 더블이 나오거나 20만원을 내야 탈출할 수 있습니다.";
    } else {
      descEl.innerText = "무인도에서 휴식 중입니다.";
    }
    btnEl.innerHTML = `<button class="start-btn" onclick="endTurn(${isDouble})">확인</button>`;
  } else if (currentSpace.type === 'space_travel') {
    descEl.innerText = "콜롬비아호(우주여행)에 도착했습니다!\n20만원을 지불하고 다음 턴에 원하는 곳으로 날아갑니다.";
    btnEl.innerHTML = `<button class="start-btn" onclick="paySpaceTravel(${isDouble})">20만 지불 및 탑승</button>`; // paySpaceTravel에서 자동 스킵
  } else if (currentSpace.type === 'fund_pay') {
    descEl.innerText = "사회복지기금 접수처입니다.\n15만원을 기금으로 납부해야 합니다.";
    btnEl.innerHTML = `<button class="start-btn" onclick="paySocialFund(${isDouble})">15만 납부</button>`; // paySocialFund에서 자동 스킵
  } else if (currentSpace.type === 'fund_receive') {
    descEl.innerText = `사회복지기금 수령처입니다!\n현재 쌓인 기금: ${window.socialFund}만원`;
    btnEl.innerHTML = `<button class="start-btn" onclick="receiveSocialFund(${isDouble})">기금 수령</button>`; // receiveSocialFund에서 자동 스킵
  } else if (currentSpace.type === 'chance') {
    descEl.innerText = "황금열쇠 카드를 뽑습니다!";
    btnEl.innerHTML = `<button class="start-btn" onclick="drawGoldenKey(${isDouble})">카드 뽑기</button>`; // drawGoldenKey에서 자동 스킵
  } else {
    descEl.innerText = currentSpace.description || "특수 칸입니다.";
    btnEl.innerHTML = `<button class="start-btn" onclick="endTurn(${isDouble})">확인</button>`;
  }
};

// --- 8. 땅 구매 ---
window.buyLand = (spaceId, price, isDouble) => {
  const player = window.players[window.currentPlayerIndex];
  
  if (window.gameMode === 'normal' || player.money >= price) {
    if (window.gameMode !== 'normal') player.money = Number((player.money - price).toFixed(2)); 
    window.boardData[spaceId].owner = player.id; 
    window.boardData[spaceId].buildings = { villa: false, building: false, hotel: false };
    
    const spaceEl = document.getElementById(`space-${spaceId}`);
    spaceEl.style.borderBottom = `5px solid ${player.color}`;
    spaceEl.style.backgroundColor = player.color + "4D"; // 투명도 30% 배경색 추가
    spaceEl.classList.add("owned-text");
    
    updateScoreBoard();
    // 구매 완료 후 다시 이벤트를 호출하여 건물을 지을 수 있게 함
    handleLandEvent(player, isDouble);
  } else {
    showCustomAlert("자금이 부족합니다! 자동으로 턴을 넘깁니다.");
    endTurn(isDouble);
  }
};

// --- 9. 건물 짓기 ---
window.buildBuilding = (spaceId, type, price, isDouble) => {
  const player = window.players[window.currentPlayerIndex];
  const space = window.boardData[spaceId];

  if (window.gameMode === 'normal' || player.money >= price) {
    if (window.gameMode !== 'normal') player.money = Number((player.money - price).toFixed(2));
    space.buildings[type] = true;
    
    const spaceEl = document.getElementById(`space-${spaceId}`);
    let bContainer = spaceEl.querySelector('.building-container');
    if (!bContainer) {
      bContainer = document.createElement('div');
      bContainer.className = 'building-container';
      spaceEl.appendChild(bContainer);
    }
    
    const marker = document.createElement('div');
    marker.className = 'building-marker';
    if (type === 'villa') marker.innerText = '⛺';
    if (type === 'building') marker.innerText = '🏢';
    if (type === 'hotel') marker.innerText = '🏨';
    
    bContainer.appendChild(marker);
    updateScoreBoard();
    
    // 지은 후에도 다른 건물을 지을 수 있도록 다시 호출
    handleLandEvent(player, isDouble);
  } else {
    showCustomAlert("자금이 부족하여 건설할 수 없습니다.");
  }
};

// --- 10. 통행료 지불 ---
window.payToll = (ownerId, toll, isDouble) => {
  const player = window.players[window.currentPlayerIndex];
  const owner = window.players[ownerId];
  
  if (window.gameMode !== 'normal') {
    player.money = Number((player.money - toll).toFixed(2));
    owner.money = Number((owner.money + toll).toFixed(2));
  }
  
  updateScoreBoard();
  checkBankruptcy(player);
  
  if (window.gameMode === 'normal') {
    showCustomAlert(`${owner.name}님의 소유지입니다. 통행료 ${toll}만원을 오프라인으로 지불해 주세요.`);
  } else {
    showCustomAlert(`${owner.name}님에게 통행료 ${toll}만원을 지불했습니다.`);
  }
  endTurn(isDouble);
};

// --- 11-1. 특수칸 및 황금열쇠 이벤트 함수 ---
window.paySpaceTravel = (isDouble) => {
  const player = window.players[window.currentPlayerIndex];
  if (window.gameMode !== 'normal') player.money = Number((player.money - 20).toFixed(2));
  player.isSpaceTravel = true;
  updateScoreBoard();
  checkBankruptcy(player);
  endTurn(isDouble);
};

window.paySocialFund = (isDouble) => {
  const player = window.players[window.currentPlayerIndex];
  if (window.gameMode !== 'normal') player.money = Number((player.money - 15).toFixed(2));
  window.socialFund += 15;
  updateScoreBoard();
  checkBankruptcy(player);
  endTurn(isDouble);
};

window.receiveSocialFund = (isDouble) => {
  const player = window.players[window.currentPlayerIndex];
  if (window.gameMode !== 'normal') player.money = Number((player.money + window.socialFund).toFixed(2));
  showCustomAlert(`사회복지기금 ${window.socialFund}만원을 획득했습니다!`);
  window.socialFund = 0;
  updateScoreBoard();
  endTurn(isDouble);
};

// --- 우대권 사용 ---
window.useExemptionCard = (isDouble) => {
  const player = window.players[window.currentPlayerIndex];
  if(player.exemptionCards > 0) {
    player.exemptionCards--;
    showCustomAlert("🎫 우대권을 사용하여 통행료를 면제받았습니다!");
    updateScoreBoard();
    endTurn(isDouble);
  }
};

window.drawGoldenKey = (isDouble) => {
  const player = window.players[window.currentPlayerIndex];
  // 확률 계산: 30장 중 2장 (0~29 난수 중 0, 1)
  const rand = Math.floor(Math.random() * 30);
  
  if (rand < 2) {
    showCustomAlert("[황금열쇠 카드 🎫]\n우대권 당첨! 남의 땅 통행료를 한 번 면제받을 수 있습니다.");
    player.exemptionCards++;
    updateScoreBoard();
    endTurn(isDouble);
  } else {
    const keys = [
      { text: "병원비 지불: 5만원을 은행에 납부합니다.", effect: (p) => { if(window.gameMode !== 'normal') p.money-=5; } },
      { text: "복권 당첨!: 10만원을 획득합니다.", effect: (p) => { if(window.gameMode !== 'normal') p.money+=10; } },
      { text: "과속 벌금: 3만원을 은행에 납부합니다.", effect: (p) => { if(window.gameMode !== 'normal') p.money-=3; } },
      { text: "출발지로 이동: 출발지로 돌아가며 월급 20만원을 받습니다.", effect: (p) => { p.position = 0; if(window.gameMode !== 'normal') p.money+=20; drawTokens(); } },
      { text: "뒤로 3칸 이동!", effect: (p) => { p.position = (p.position - 3 + 40) % 40; drawTokens(); setTimeout(()=>handleLandEvent(p, isDouble), 500); return "skip"; } },
      { text: "건물 수리비 지불: 10만원을 은행에 납부합니다.", effect: (p) => { if(window.gameMode !== 'normal') p.money-=10; } },
      { text: "유산 상속!: 20만원을 획득합니다.", effect: (p) => { if(window.gameMode !== 'normal') p.money+=20; } },
      { text: "은행 이자 배당: 5만원을 획득합니다.", effect: (p) => { if(window.gameMode !== 'normal') p.money+=5; } }
    ];
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    showCustomAlert(`[황금열쇠 카드]\n${randomKey.text}`);
    
    const skipNext = randomKey.effect(player);
    updateScoreBoard();
    checkBankruptcy(player);
  
    if (skipNext !== "skip") {
      endTurn(isDouble);
    }
  }
};

// --- 11-2. 파산 처리 (건물/땅 반값 매각) ---
window.checkBankruptcy = (player) => {
  if (window.gameMode !== 'normal' && player.money < 0 && !player.bankrupt) {
    showCustomAlert(`${player.name}님의 자금이 부족합니다!\n(부채 청산을 위해 소유한 자산을 반값에 자동 매각합니다.)`);
    
    for (let i = 0; i < 40; i++) {
       const space = window.boardData[i];
       if (space.owner === player.id) {
         let value = space.price_land || 0;
         if (space.buildings?.villa) value += (space.price_villa || 0);
         if (space.buildings?.building) value += (space.price_building || 0);
         if (space.buildings?.hotel) value += (space.price_hotel || 0);
         
         player.money += (value / 2); // 반값 매각
         space.owner = undefined;
         space.buildings = { villa: false, building: false, hotel: false };
         
         // UI 초기화
         const spaceEl = document.getElementById(`space-${i}`);
         if (spaceEl) {
           spaceEl.style.borderBottom = 'none';
           spaceEl.style.backgroundColor = '#fff';
           spaceEl.classList.remove('owned-text');
           const bContainer = spaceEl.querySelector('.building-container');
           if (bContainer) bContainer.remove();
         }
         if (player.money >= 0) break; 
       }
    }

    if (player.money < 0) {
      showCustomAlert(`${player.name}님은 자산을 모두 처분해도 빚을 갚지 못해 파산하셨습니다!`);
      player.bankrupt = true;
      player.money = "파산";
    } else {
       showCustomAlert(`자산을 매각하여 빚을 청산했습니다. 남은 돈: ${player.money}만`);
    }
    updateScoreBoard();
  }
};

// --- 12. 롤백 기능 및 턴 종료 ---
window.saveState = () => {
  window.historyStack.push({
    boardData: JSON.parse(JSON.stringify(window.boardData)),
    players: JSON.parse(JSON.stringify(window.players)),
    currentPlayerIndex: window.currentPlayerIndex
  });
};

window.rollbackTurn = () => {
  if (window.historyStack.length <= 1) { 
    showCustomAlert("더 이상 뒤로 갈 수 없습니다.");
    return;
  }
  window.historyStack.pop(); 
  const prevState = window.historyStack[window.historyStack.length - 1]; 
  
  window.boardData = JSON.parse(JSON.stringify(prevState.boardData));
  window.players = JSON.parse(JSON.stringify(prevState.players));
  window.currentPlayerIndex = prevState.currentPlayerIndex;
  
  document.getElementById('action-screen').style.display = 'none';
  document.getElementById('dice-screen').style.display = 'block';
  
  renderBoard(window.boardData);
  drawTokens();
  updateScoreBoard();
  updateTurnUI();
};

window.endTurn = (isDouble) => {
  window.isWaitingNextTurn = false;

  const alivePlayers = window.players.filter(p => !p.bankrupt);
  if (alivePlayers.length <= 1) {
    showCustomAlert(`게임 종료! 최후의 승자는 ${alivePlayers[0].name}님 입니다! 🎉`);
    return;
  }
  
  if (!isDouble) {
    // 파산하지 않은 다음 사람 찾기
    do {
      window.currentPlayerIndex = (window.currentPlayerIndex + 1) % 4;
    } while (window.players[window.currentPlayerIndex].bankrupt);
  } else {
    showCustomAlert("더블! 한 번 더 굴립니다.");
  }
  
  saveState(); // 다음 사람의 턴 시작 상태 저장
  
  document.getElementById('action-screen').style.display = 'none';
  document.getElementById('dice-screen').style.display = 'block';
  updateTurnUI();
};

window.onload = () => fetchBoardData();