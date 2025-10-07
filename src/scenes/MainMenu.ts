import Phaser from "phaser";

export default class MainMenu extends Phaser.Scene {
  constructor() {
    super("MainMenu");
  }

  create() {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0xd9d9d9);

    this.add
      .text(width / 2, height * 0.12, "SUB TITLE", {
        fontFamily: "Arial",
        fontSize: "64px",
        color: "#000",
        fontStyle: "normal",
      })
      .setOrigin(0.5);
    this.add
      .text(width / 2, height * 0.18, "MAIN TITLE", {
        fontFamily: "Arial",
        fontSize: "96px",
        color: "#000",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.add.circle(width / 2, height * 0.45, 250, 0xffffff);

    // 난이도 버튼
    const createButton = (
      x: number,
      y: number,
      label: string,
      onClick: () => void
    ) => {
      const w = 250;
      const h = 100;

      const rect = this.add
        .rectangle(x, y, w, h, 0xffffff)
        .setStrokeStyle(4, 0x000000)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", onClick);

      const text = this.add
        .text(x, y, label, {
          fontFamily: "Arial Black",
          fontSize: "36px",
          color: "#000000",
        })
        .setOrigin(0.5);

      return { rect, text };
    };

    // 버튼들 중앙 배치
    const baseY = height * 0.75;
    const spacing = 320;
    createButton(width / 2 - spacing, baseY, "Easy", () =>
      this.scene.start("Level", { difficulty: "easy" })
    );
    createButton(width / 2, baseY, "Normal", () =>
      this.scene.start("Level", { difficulty: "normal" })
    );
    createButton(width / 2 + spacing, baseY, "Hard", () =>
      this.scene.start("Level", { difficulty: "hard" })
    );

    // 하단 아이콘
    const iconsY = height * 0.9;
    const iconSize = 160;
    const iconSpacing = 300;

    const iconBgColor = 0xff7f7f;
    const emojis = ["⭐", "🛒", "⚙️"];

    emojis.forEach((emoji, i) => {
      const x = width / 2 - iconSpacing + i * iconSpacing;
      const circle = this.add
        .circle(x, iconsY, iconSize / 2, iconBgColor)
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", () => {
          if (emoji === "🛒") {
            this.scene.start("ShopScene");
          } else if (emoji === "⚙️") {
            this.scene.start("SettingsScene");
          }
        });
      const text = this.add
        .text(x, iconsY, emoji, {
          fontSize: "96px",
          color: "#000000",
        })
        .setOrigin(0.5);
    });
  }
}
