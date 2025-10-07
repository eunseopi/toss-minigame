import Phaser from "phaser";

export default class SettingsScene extends Phaser.Scene {
  private effectSoundOn = true;
  private bgmOn = true;

  constructor() {
    super("SettingsScene");
  }

  create() {
    const { width, height } = this.scale;

    // 배경
    this.add.rectangle(width / 2, height / 2, width, height, 0xf2f2f2);

    // 톱니바퀴 아이콘
    this.add
      .text(width / 2, height * 0.25, "⚙️", {
        fontSize: "120px",
      })
      .setOrigin(0.5);

    // 제목
    this.add
      .text(width / 2, height * 0.32, "환경설정", {
        fontFamily: "Arial Black",
        fontSize: "72px",
        color: "#000000",
      })
      .setOrigin(0.5);

    // ---- 효과음 토글 ----
    this.createRoundedToggle(width / 1.65, height * 0.45, "효과음", (isOn) => {
      this.effectSoundOn = isOn;
      console.log("효과음:", isOn);
    });

    // ---- 배경음 토글 ----
    this.createRoundedToggle(width / 1.65, height * 0.52, "배경음", (isOn) => {
      this.bgmOn = isOn;
      console.log("배경음:", isOn);
    });

    // ---- 완료 버튼 ----
    const doneBtn = this.add
      .rectangle(width / 2, height * 0.65, 200, 100, 0xdddddd)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        this.scene.start("MainMenu");
      });

    this.add
      .text(width / 2, height * 0.65, "완료", {
        fontFamily: "Arial Black",
        fontSize: "48px",
        color: "#000000",
      })
      .setOrigin(0.5);
  }

  createRoundedToggle(
    centerX: number,
    y: number,
    label: string,
    callback: (isOn: boolean) => void
  ) {
    const switchWidth = 100;
    const switchHeight = 60;
    const radius = switchHeight / 2;
    const margin = 8;

    // 레이블
    this.add
      .text(centerX - 180, y, label, {
        fontSize: "40px",
        color: "#000000",
        fontFamily: "Arial",
      })
      .setOrigin(1, 0.5);

    // 그래픽 객체로 둥근 배경 생성
    const bg = this.add.graphics();
    bg.fillStyle(0x4cd964, 1);
    bg.fillRoundedRect(
      centerX - switchWidth / 2 + 40,
      y - switchHeight / 2,
      switchWidth,
      switchHeight,
      radius
    );

    // 흰색 원
    const knob = this.add.circle(
      centerX + 40 + (switchWidth / 2 - radius),
      y,
      radius - margin,
      0xffffff
    );
    knob.setOrigin(0.5);

    // 상태
    let isOn = true;

    const redraw = () => {
      bg.clear();
      bg.fillStyle(isOn ? 0x4cd964 : 0xcfcfcf, 1);
      bg.fillRoundedRect(
        centerX - switchWidth / 2 + 40,
        y - switchHeight / 2,
        switchWidth,
        switchHeight,
        radius
      );
      knob.x = isOn
        ? centerX + 40 + (switchWidth / 2 - radius)
        : centerX + 40 - (switchWidth / 2 - radius);
    };

    // 토글
    const toggle = () => {
      isOn = !isOn;
      redraw();
      callback(isOn);
    };

    // 클릭 영역 확장
    const hitArea = new Phaser.Geom.Rectangle(
      centerX - switchWidth / 2 + 40,
      y - switchHeight / 2,
      switchWidth,
      switchHeight
    );
    bg.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
    knob.setInteractive({ useHandCursor: true });

    bg.on("pointerdown", toggle);
    knob.on("pointerdown", toggle);
  }
}
