import Phaser from "phaser";

export default class ShopScene extends Phaser.Scene {
  constructor() {
    super("ShopScene");
  }

  create() {
    const { width, height } = this.scale;

    // 배경 색
    this.add.rectangle(width / 2, height / 2, width, height, 0xfdf6e3);

    // 제목
    this.add
      .text(width / 2, height * 0.22, "아이템", {
        fontFamily: "Arial Black",
        fontSize: "80px",
        color: "#000000",
      })
      .setOrigin(0.5);

    // --- 쉴드 아이템 ---
    const shieldY = height * 0.39;
    this.add
      .text(width * 0.4, shieldY, "🛡️", { fontSize: "120px" })
      .setOrigin(0.5);
    this.add
      .text(width * 0.4, shieldY - 120, "쉴드", {
        fontSize: "40px",
        color: "#000",
      })
      .setOrigin(0.5);

    // 무료 버튼
    const shieldBtn = this.add
      .rectangle(width * 0.6, shieldY, 180, 100, 0xdddddd)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(width * 0.6, shieldY, "무료!", {
        fontFamily: "Arial Black",
        fontSize: "48px",
        color: "#000000",
      })
      .setOrigin(0.5);

    // 설명
    this.add
      .text(
        width / 2,
        shieldY + 130,
        "폭탄이 심어진 광석에 도착했을 때,\n1회 피해를 무효화시켜줘요.",
        {
          fontSize: "36px",
          color: "#000000",
          align: "center",
        }
      )
      .setOrigin(0.5);

    // 구분선
    this.add
      .line(width / 2, height * 0.52, 0, 0, 800, 0, 0x000000)
      .setLineWidth(2);

    // --- 스캐너 아이템 ---
    const scannerY = height * 0.65;
    this.add
      .text(width * 0.4, scannerY - 120, "스캐너", {
        fontSize: "40px",
        color: "#000",
      })
      .setOrigin(0.5);
    this.add
      .text(width * 0.4, scannerY, "⭐", { fontSize: "120px" })
      .setOrigin(0.5);

    const scannerBtn = this.add
      .rectangle(width * 0.6, scannerY, 180, 100, 0xdddddd)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(width * 0.6, scannerY, "AD\n무료!", {
        fontFamily: "Arial Black",
        fontSize: "42px",
        color: "#000000",
        align: "center",
      })
      .setOrigin(0.5);

    this.add
      .text(
        width / 2,
        scannerY + 130,
        "원하는 광석에 스캐너를 사용해서,\n폭탄의 위치를 알 수 있어요.",
        {
          fontSize: "36px",
          color: "#000000",
          align: "center",
        }
      )
      .setOrigin(0.5);

    // 뒤로가기
    const backBtn = this.add
      .text(width / 2, height * 0.93, "← 뒤로가기", {
        fontSize: "48px",
        color: "#000000",
        backgroundColor: "#ffffff",
        padding: { x: 30, y: 15 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        this.scene.start("MainMenu");
      });
  }
}
