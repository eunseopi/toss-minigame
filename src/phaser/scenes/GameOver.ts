import Phaser from "phaser";

interface GameOverData {
  reason?: string;
}

export default class GameOver extends Phaser.Scene {
  constructor() {
    super("GameOver");
  }

  init(data: GameOverData) {
    this.reason = data.reason || "오류";
  }

  private reason!: string;

  create() {
    const { width, height } = this.scale;

    // 배경 반투명
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.4);

    // 원형 배경
    this.add.circle(width / 2, height / 2 - 100, 200, 0xffe4e1);

    // 텍스트
    this.add
      .text(width / 2, height / 2 - 120, "GAME OVER", {
        fontSize: "64px",
        color: "#000",
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 - 60, this.reason, {
        fontSize: "36px",
        color: "#000",
      })
      .setOrigin(0.5);

    // 버튼 2개
    const home = this.add
      .text(width / 2 - 100, height / 2 + 150, "🏠", { fontSize: "90px" })
      .setInteractive();
    const retry = this.add
      .text(width / 2, height / 2 + 150, "↩️", { fontSize: "90px" })
      .setInteractive();

    home.on("pointerdown", () => this.scene.start("MainMenu"));
    retry.on("pointerdown", () => this.scene.start("Level", { mapSize: 6 }));
  }
}
