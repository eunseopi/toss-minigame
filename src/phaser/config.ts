import Phaser from "phaser";
import Boot from "./scenes/Boot";
import Preload from "./scenes/Preload";
import MainMenu from "./scenes/MainMenu";
import ShopScene from "./scenes/ShopScene";
import SettingsScene from "./scenes/SettingsScene";
import Level from "./scenes/Level";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1080,
  height: 1920,
  backgroundColor: "#2f2f2f",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [Boot, Preload, MainMenu, Level, ShopScene, SettingsScene],
};

export default config;
