process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // 보안 인증서 강제 패스 (사내망/VPN 우회)

// seed.js
const admin = require("firebase-admin");
// 파이어베이스 프로젝트 설정에서 다운로드 받은 서비스 계정 키 경로를 입력하세요.
const serviceAccount = require("./mybluemarble-firebase-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
db.settings({ preferRest: true });

// 40칸의 전체 데이터 배열 (아래 2번 항목의 데이터를 여기에 넣습니다)
const boardData = [
  {
    "id": 0,
    "name": "출발",
    "type": "start",
    "description": "출발지를 지나면 월급 20만원을 받습니다."
  },
  {
    "id": 1,
    "name": "타이베이",
    "type": "city",
    "price_land": 5,
    "price_villa": 5,
    "price_building": 15,
    "price_hotel": 25,
    "toll_land": 0.2,
    "toll_villa": 1,
    "toll_building": 9,
    "toll_hotel": 25
  },
  {
    "id": 2,
    "name": "황금열쇠",
    "type": "chance"
  },
  {
    "id": 3,
    "name": "베이징",
    "type": "city",
    "price_land": 8,
    "price_villa": 5,
    "price_building": 15,
    "price_hotel": 25,
    "toll_land": 0.4,
    "toll_villa": 2,
    "toll_building": 18,
    "toll_hotel": 45
  },
  {
    "id": 4,
    "name": "마닐라",
    "type": "city",
    "price_land": 8,
    "price_villa": 5,
    "price_building": 15,
    "price_hotel": 25,
    "toll_land": 0.4,
    "toll_villa": 2,
    "toll_building": 18,
    "toll_hotel": 45
  },
  {
    "id": 5,
    "name": "제주도",
    "type": "resort",
    "price_land": 20,
    "toll_land": 30
  },
  {
    "id": 6,
    "name": "싱가포르",
    "type": "city",
    "price_land": 10,
    "price_villa": 5,
    "price_building": 15,
    "price_hotel": 25,
    "toll_land": 0.6,
    "toll_villa": 3,
    "toll_building": 27,
    "toll_hotel": 55
  },
  {
    "id": 7,
    "name": "황금열쇠",
    "type": "chance"
  },
  {
    "id": 8,
    "name": "카이로",
    "type": "city",
    "price_land": 10,
    "price_villa": 5,
    "price_building": 15,
    "price_hotel": 25,
    "toll_land": 0.6,
    "toll_villa": 3,
    "toll_building": 27,
    "toll_hotel": 55
  },
  {
    "id": 9,
    "name": "이스탄불",
    "type": "city",
    "price_land": 12,
    "price_villa": 5,
    "price_building": 15,
    "price_hotel": 25,
    "toll_land": 0.8,
    "toll_villa": 4,
    "toll_building": 30,
    "toll_hotel": 60
  },
  {
    "id": 10,
    "name": "무인도",
    "type": "island",
    "description": "3턴 동안 휴식. 주사위 더블이 나오면 탈출 가능."
  },
  {
    "id": 11,
    "name": "아테네",
    "type": "city",
    "price_land": 14,
    "price_villa": 10,
    "price_building": 30,
    "price_hotel": 50,
    "toll_land": 1,
    "toll_villa": 5,
    "toll_building": 45,
    "toll_hotel": 75
  },
  {
    "id": 12,
    "name": "황금열쇠",
    "type": "chance"
  },
  {
    "id": 13,
    "name": "코펜하겐",
    "type": "city",
    "price_land": 16,
    "price_villa": 10,
    "price_building": 30,
    "price_hotel": 50,
    "toll_land": 1.2,
    "toll_villa": 6,
    "toll_building": 50,
    "toll_hotel": 90
  },
  {
    "id": 14,
    "name": "스톡홀름",
    "type": "city",
    "price_land": 16,
    "price_villa": 10,
    "price_building": 30,
    "price_hotel": 50,
    "toll_land": 1.2,
    "toll_villa": 6,
    "toll_building": 50,
    "toll_hotel": 90
  },
  {
    "id": 15,
    "name": "콩코드 여객기",
    "type": "vehicle",
    "price_land": 20,
    "toll_land": 30
  },
  {
    "id": 16,
    "name": "취리히",
    "type": "city",
    "price_land": 18,
    "price_villa": 10,
    "price_building": 30,
    "price_hotel": 50,
    "toll_land": 1.4,
    "toll_villa": 7,
    "toll_building": 60,
    "toll_hotel": 95
  },
  {
    "id": 17,
    "name": "황금열쇠",
    "type": "chance"
  },
  {
    "id": 18,
    "name": "베를린",
    "type": "city",
    "price_land": 18,
    "price_villa": 10,
    "price_building": 30,
    "price_hotel": 50,
    "toll_land": 1.4,
    "toll_villa": 7,
    "toll_building": 60,
    "toll_hotel": 95
  },
  {
    "id": 19,
    "name": "몬트리올",
    "type": "city",
    "price_land": 20,
    "price_villa": 10,
    "price_building": 30,
    "price_hotel": 50,
    "toll_land": 1.6,
    "toll_villa": 8,
    "toll_building": 65,
    "toll_hotel": 100
  },
  {
    "id": 20,
    "name": "사회복지기금 접수처",
    "type": "fund_receive",
    "description": "도착 시 모인 사회복지기금을 모두 수령합니다."
  },
  {
    "id": 21,
    "name": "부에노스아이레스",
    "type": "city",
    "price_land": 22,
    "price_villa": 15,
    "price_building": 45,
    "price_hotel": 75,
    "toll_land": 1.8,
    "toll_villa": 9,
    "toll_building": 70,
    "toll_hotel": 105
  },
  {
    "id": 22,
    "name": "황금열쇠",
    "type": "chance"
  },
  {
    "id": 23,
    "name": "상파울루",
    "type": "city",
    "price_land": 24,
    "price_villa": 15,
    "price_building": 45,
    "price_hotel": 75,
    "toll_land": 2,
    "toll_villa": 10,
    "toll_building": 75,
    "toll_hotel": 110
  },
  {
    "id": 24,
    "name": "시드니",
    "type": "city",
    "price_land": 24,
    "price_villa": 15,
    "price_building": 45,
    "price_hotel": 75,
    "toll_land": 2,
    "toll_villa": 10,
    "toll_building": 75,
    "toll_hotel": 110
  },
  {
    "id": 25,
    "name": "부산",
    "type": "resort",
    "price_land": 50,
    "toll_land": 60
  },
  {
    "id": 26,
    "name": "하와이",
    "type": "city",
    "price_land": 26,
    "price_villa": 15,
    "price_building": 45,
    "price_hotel": 75,
    "toll_land": 2.2,
    "toll_villa": 11,
    "toll_building": 80,
    "toll_hotel": 115
  },
  {
    "id": 27,
    "name": "리스본",
    "type": "city",
    "price_land": 26,
    "price_villa": 15,
    "price_building": 45,
    "price_hotel": 75,
    "toll_land": 2.2,
    "toll_villa": 11,
    "toll_building": 80,
    "toll_hotel": 115
  },
  {
    "id": 28,
    "name": "퀸엘리자베스호",
    "type": "vehicle",
    "price_land": 30,
    "toll_land": 25
  },
  {
    "id": 29,
    "name": "마드리드",
    "type": "city",
    "price_land": 28,
    "price_villa": 15,
    "price_building": 45,
    "price_hotel": 75,
    "toll_land": 2.4,
    "toll_villa": 12,
    "toll_building": 85,
    "toll_hotel": 120
  },
  {
    "id": 30,
    "name": "우주여행",
    "type": "space_travel",
    "description": "20만원을 지불하고 다음 턴에 원하는 곳으로 이동."
  },
  {
    "id": 31,
    "name": "도쿄",
    "type": "city",
    "price_land": 30,
    "price_villa": 20,
    "price_building": 60,
    "price_hotel": 100,
    "toll_land": 2.6,
    "toll_villa": 13,
    "toll_building": 90,
    "toll_hotel": 127
  },
  {
    "id": 32,
    "name": "콜롬비아호",
    "type": "vehicle",
    "price_land": 45,
    "toll_land": 50
  },
  {
    "id": 33,
    "name": "파리",
    "type": "city",
    "price_land": 32,
    "price_villa": 20,
    "price_building": 60,
    "price_hotel": 100,
    "toll_land": 2.8,
    "toll_villa": 15,
    "toll_building": 100,
    "toll_hotel": 140
  },
  {
    "id": 34,
    "name": "로마",
    "type": "city",
    "price_land": 32,
    "price_villa": 20,
    "price_building": 60,
    "price_hotel": 100,
    "toll_land": 2.8,
    "toll_villa": 15,
    "toll_building": 100,
    "toll_hotel": 140
  },
  {
    "id": 35,
    "name": "황금열쇠",
    "type": "chance"
  },
  {
    "id": 36,
    "name": "런던",
    "type": "city",
    "price_land": 35,
    "price_villa": 20,
    "price_building": 60,
    "price_hotel": 100,
    "toll_land": 3.5,
    "toll_villa": 17,
    "toll_building": 110,
    "toll_hotel": 150
  },
  {
    "id": 37,
    "name": "뉴욕",
    "type": "city",
    "price_land": 35,
    "price_villa": 20,
    "price_building": 60,
    "price_hotel": 100,
    "toll_land": 3.5,
    "toll_villa": 17,
    "toll_building": 110,
    "toll_hotel": 150
  },
  {
    "id": 38,
    "name": "사회복지기금",
    "type": "fund_pay",
    "description": "도착 시 15만원을 기금으로 납부합니다."
  },
  {
    "id": 39,
    "name": "서울",
    "type": "resort",
    "price_land": 100,
    "toll_land": 200
  }
];

async function seedBlueMarbleData() {
  console.log("데이터 업로드 시작...");
  
  try {
    const batch = db.batch();
    console.log("배치(Batch) 객체 생성 완료, 데이터 매핑 중...");

    boardData.forEach((space) => {
      const docRef = db.collection("blue_marble_board").doc(space.id.toString());
      batch.set(docRef, space);
    });

    console.log("Firestore로 전송 시도 중... (여기서 멈춘다면 100% 네트워크/방화벽/DB종류 문제입니다)");
    
    await batch.commit();
    console.log("부루마블 40칸 데이터가 Firestore에 성공적으로 입력되었습니다! 🎉");
    process.exit(0);

  } catch (error) {
    console.error("❌ 전송 중 에러 발생:", error);
    process.exit(1);
  }
}

seedBlueMarbleData().catch(console.error);