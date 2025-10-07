import Phaser from "phaser";

export default class Boot extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  preload() {
    this.load.pack("pack", "assets/preload-asset-pack.json");
  }

  create() {
    // 게임의 첫 씬으로 이동
    this.scene.start("MainMenu");
  }
}
