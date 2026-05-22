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
        token.style.backgroundColor = p.color;
        
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

  const colors = ["#FF5252", "#448AFF", "#FFC107", "#4CAF50"];
  window.players = [
    { id: 0, name: document.getElementById('p1').value, position: 0, color: colors[0], money: 500 },
    { id: 1, name: document.getElementById('p2').value, position: 0, color: colors[1], money: 500 },
    { id: 2, name: document.getElementById('p3').value, position: 0, color: colors[2], money: 500 },
    { id: 3, name: document.getElementById('p4').value, position: 0, color: colors[3], money: 500 }
  ];

  document.getElementById('setup-screen').style.display = 'none';
  document.getElementById('scoreboard').style.display = 'flex';
  document.getElementById('dice-screen').style.display = 'block';
  
  updateScoreBoard();
  drawTokens(); 
  updateTurnUI();
};

function updateTurnUI() {
  const currentPlayer = window.players[window.currentPlayerIndex];
  document.getElementById('turn-indicator').innerText = `🎲 ${currentPlayer.name}의 턴!`;
  document.getElementById('turn-indicator').style.color = currentPlayer.color;
  
  selectedDice1 = null;
  selectedDice2 = null;
  document.getElementById('move-btn').style.display = 'none';
  document.querySelectorAll('.dice-row button').forEach(btn => btn.classList.remove('selected'));
}

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
  
  let movesLeft = total;
  window.isMoving = true;
  window.movingPlayerId = currentPlayer.id;

  const moveInterval = setInterval(() => {
    currentPlayer.position = (currentPlayer.position + 1) % 40;
    movesLeft--;
    document.getElementById('turn-indicator').innerText = `🏃‍♂️ ${currentPlayer.name} 이동 중... (남은 칸: ${movesLeft})`;
    drawTokens(); 

    if (movesLeft === 0) {
      clearInterval(moveInterval);
      window.isMoving = false;
      drawTokens(); 
      setTimeout(() => {
        handleLandEvent(currentPlayer, isDouble);
      }, 300);
    }
  }, 500); 
};

function updateScoreBoard() {
  window.players.forEach(p => {
    const scoreEl = document.getElementById(`score-${p.id}`);
    if (scoreEl) {
      scoreEl.innerText = `${p.name}: ${p.money}만`;
      scoreEl.style.color = p.color;
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

  if (currentSpace.type === 'city' || currentSpace.type === 'resort') {
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

      descEl.innerText = `앗! ${owner.name}의 소유지입니다.\n통행료 ${totalToll}만원을 지불해야 합니다.`;
      btnEl.innerHTML = `<button class="start-btn" onclick="payToll(${currentSpace.owner}, ${totalToll}, ${isDouble})">지불하기</button>`;
    } else {
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
    }
  } else {
    descEl.innerText = currentSpace.description || "특수 칸입니다.";
    btnEl.innerHTML = `<button class="start-btn" onclick="endTurn(${isDouble})">확인</button>`;
  }
};

// --- 8. 땅 구매 ---
window.buyLand = (spaceId, price, isDouble) => {
  const player = window.players[window.currentPlayerIndex];
  
  if (player.money >= price) {
    player.money -= price; 
    window.boardData[spaceId].owner = player.id; 
    window.boardData[spaceId].buildings = { villa: false, building: false, hotel: false };
    
    const spaceEl = document.getElementById(`space-${spaceId}`);
    spaceEl.style.borderBottom = `5px solid ${player.color}`;
    
    updateScoreBoard();
    alert(`${window.boardData[spaceId].name}을(를) 구매했습니다!`);
    endTurn(isDouble);
  } else {
    alert("자금이 부족합니다! 자동으로 턴을 넘깁니다.");
    endTurn(isDouble);
  }
};

// --- 9. 건물 짓기 ---
window.buildBuilding = (spaceId, type, price, isDouble) => {
  const player = window.players[window.currentPlayerIndex];
  const space = window.boardData[spaceId];

  if (player.money >= price) {
    player.money -= price;
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
    alert(`성공적으로 건설했습니다!`);
    
    endTurn(isDouble);
  } else {
    alert("자금이 부족하여 건설할 수 없습니다.");
  }
};

// --- 10. 통행료 지불 ---
window.payToll = (ownerId, toll, isDouble) => {
  const player = window.players[window.currentPlayerIndex];
  const owner = window.players[ownerId];
  
  player.money -= toll;
  owner.money += toll;
  
  updateScoreBoard();
  alert(`${owner.name}님에게 통행료 ${toll}만원을 지불했습니다.`);
  endTurn(isDouble);
};

// --- 11. 턴 종료 ---
window.endTurn = (isDouble) => {
  if (!isDouble) {
    window.currentPlayerIndex = (window.currentPlayerIndex + 1) % 4;
  } else {
    alert("더블! 한 번 더 굴립니다.");
  }
  
  document.getElementById('action-screen').style.display = 'none';
  document.getElementById('dice-screen').style.display = 'block';
  updateTurnUI();
};

window.onload = () => fetchBoardData();