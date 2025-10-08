import Phaser from "phaser";
import { Debug } from "../utils/Debug";

enum TileType {
  Mineral = "mineral",
  Empty = "empty",
  Mine = "mine",
  Rock = "rock",
}
type Mode = "mine" | "flag";
type Diff = "easy" | "normal" | "hard";

interface LevelData {
  difficulty?: Diff;
  mapSize?: number;
}

export default class Level extends Phaser.Scene {
  private gridSize = 6;
  private visibleCols = 8;
  private difficulty: Diff = "normal";
  private mineProb = 0.15;
  private ensurePaths = 1;

  private grid: {
    type: TileType;
    img: Phaser.GameObjects.Image;
    flagged: boolean;
    revealed: boolean;
  }[][] = [];

  private mode: Mode = "mine";
  private scanner = 1;
  private shield = 1;
  private bombsTotal = 0;
  private mineralsLeft = 0;
  private timeLeft = 60;
  private timerEvent?: Phaser.Time.TimerEvent;
  private isResolving = false;
  private skipTurn = false;
  private isMining = false;

  private bombText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private scannerText!: Phaser.GameObjects.Text;
  private shieldText!: Phaser.GameObjects.Text;

  constructor() {
    super("Level");
  }

  init(data: LevelData) {
    if (data.mapSize) this.gridSize = data.mapSize;
    if (data.difficulty) this.difficulty = data.difficulty;

    if (this.difficulty === "easy") {
      this.mineProb = 0.1;
      this.ensurePaths = 2;
    } else if (this.difficulty === "hard") {
      this.mineProb = 0.22;
      this.ensurePaths = 1;
    } else {
      this.mineProb = 0.15;
      this.ensurePaths = 2;
    }

    this.scanner = 1;
    this.shield = 1;
  }

  preload() {
    this.load.pack("mine-asset-pack", "assets/mine/mine-asset-pack.json");
    this.load.on("progress", (p: number) =>
      Debug.log("Asset 로드:", Math.round(p * 100) + "%")
    );
  }

  create() {
    this.createHUD();
    this.createMap();
    this.createModeButtons();
    this.createBottomNav();

    // ⏰ 타이머
    this.timerEvent = this.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => {
        this.timeLeft = Math.max(0, this.timeLeft - 0.1);
        this.timerText.setText(this.timeLeft.toFixed(1) + "s");
        if (this.timeLeft <= 10) this.timerText.setColor("#d9534f");
        if (this.timeLeft <= 0) this.gameOver("시간 초과");
      },
    });
  }

  // ──────────────────────────────── HUD ────────────────────────────────
  private createHUD() {
    const { width } = this.scale;
    const hud = this.add.container(width / 2, 90);
    const bw = width * 0.78;
    const bg = this.add
      .rectangle(0, 0, bw, 90, 0xffffff)
      .setStrokeStyle(3, 0x000000);
    hud.add(bg);

    const bombIcon = this.add.text(-bw * 0.3, -20, "💣", {
      fontSize: "40px",
    });
    this.bombText = this.add.text(bombIcon.x + 55, -20, "0개", {
      fontSize: "36px",
      color: "#000",
    });
    hud.add([bombIcon, this.bombText]);

    const clockIcon = this.add.text(bw * 0.05, -20, "⏰", { fontSize: "40px" });
    this.timerText = this.add.text(
      clockIcon.x + 55,
      -20,
      this.timeLeft.toFixed(1) + "s",
      {
        fontSize: "36px",
        color: "#000",
      }
    );
    hud.add([clockIcon, this.timerText]);

    const pause = this.add
      .text(bw * 0.45, -20, "Ⅱ", { fontSize: "46px", color: "#000" })
      .setInteractive();
    pause.on("pointerdown", () => console.log("pause"));
    hud.add(pause);
  }

  private updateHUD() {
    this.bombText.setText(`${this.bombsTotal}개`);
  }

  // ──────────────────────────────── MAP ────────────────────────────────
  private createMap() {
    const W = this.cameras.main.width;
    const tileSize = Math.floor(W / this.visibleCols);
    const offsetX = Math.floor((W - tileSize * this.gridSize) / 2);
    const topY = 360;

    const mainPath = this.generatePath(this.gridSize);
    const extraPaths: Set<string> = new Set(mainPath);
    if (this.ensurePaths >= 2) {
      const alt = this.generatePath(this.gridSize);
      alt.forEach((k) => extraPaths.add(k));
    }

    this.grid = [];
    this.bombsTotal = 0;
    this.mineralsLeft = 0;

    const blocks = ["blockNormal1", "blockNormal2", "blockNormal3"];

    for (let r = 0; r < this.gridSize; r++) {
      this.grid[r] = [];
      for (let c = 0; c < this.gridSize; c++) {
        const x = offsetX + c * tileSize;
        const y = topY + r * tileSize;
        const k = blocks[Phaser.Math.Between(0, blocks.length - 1)];
        const img = this.add
          .image(x, y, k)
          .setOrigin(0)
          .setDisplaySize(tileSize, tileSize)
          .setInteractive();

        const key = `${r},${c}`;
        const onSafePath = extraPaths.has(key);
        const isMine = !onSafePath && Math.random() < this.mineProb;

        const cell = {
          type: isMine ? TileType.Mine : TileType.Mineral,
          img,
          flagged: false,
          revealed: false,
        };
        if (isMine) this.bombsTotal++;
        else this.mineralsLeft++;

        img.on("pointerdown", () => this.onTileClick(r, c));
        this.grid[r][c] = cell;
      }
    }

    this.updateHUD();
  }

  private generatePath(n: number): Set<string> {
    let r = Phaser.Math.Between(0, n - 1);
    let c = 0;
    const path = new Set<string>([`${r},${c}`]);
    while (c < n - 1) {
      const dirs = [
        { dr: 0, dc: 1 },
        { dr: 1, dc: 0 },
        { dr: -1, dc: 0 },
      ];
      const d = Phaser.Utils.Array.GetRandom(dirs);
      const nr = Phaser.Math.Clamp(r + d.dr, 0, n - 1);
      const nc = Phaser.Math.Clamp(c + d.dc, 0, n - 1);
      if (nc < c) continue;
      r = nr;
      c = nc;
      path.add(`${r},${c}`);
    }
    return path;
  }

  // ──────────────────────────────── TILE CLICK ────────────────────────────────
  private async onTileClick(r: number, c: number) {
    if (this.isResolving || this.isMining) return;
    const cell = this.grid?.[r]?.[c];
    if (!cell || cell.revealed) return;

    this.isMining = true;

    if (cell.type === TileType.Mine) {
      this.mineBlock(cell, false);
      this.revealAllMines();
      this.gameOver("지뢰 폭발!");
      this.isMining = false;
      return;
    }

    await this.mineBlock(cell, true);
    this.mineralsLeft--;
    this.updateHUD();
    if (this.mineralsLeft <= 0) this.gameClear();
    this.isMining = false;
  }

  // 곡괭이 애니메이션 + 파티클 효과 유지
  private mineBlock(
    cell: { img: Phaser.GameObjects.Image },
    isMineral: boolean
  ) {
    return new Promise<void>((resolve) => {
      const tile = cell.img;
      const centerX = tile.x + tile.displayWidth / 2;
      const centerY = tile.y + tile.displayHeight / 2;
      const pickaxe = this.add.image(
        centerX,
        centerY - tile.displayHeight * 0.4,
        "pickaxe"
      );
      pickaxe.setDisplaySize(tile.displayWidth, tile.displayWidth);
      pickaxe.setRotation(Phaser.Math.DegToRad(30 - 270));

      this.tweens.add({
        targets: pickaxe,
        rotation: 0,
        duration: 300,
        ease: "Power2",
        onComplete: () => {
          pickaxe.destroy();
          if (isMineral) {
            this.sound.play("blockBreakSound", { volume: 0.8 });
            this.addDustEffect(centerX, centerY);
            this.tweens.add({
              targets: tile,
              alpha: 0.1,
              duration: 250,
              onComplete: () => {
                tile.setAlpha(0.1);
                cell.revealed = true;
                resolve();
              },
            });
          } else resolve();
        },
      });
    });
  }

  private addDustEffect(x: number, y: number) {
    const particles = this.add.particles(0, 0, "blockNormal1", {
      x,
      y,
      lifespan: 400,
      speed: { min: 80, max: 200 },
      scale: { start: 0.4, end: 0 },
      gravityY: 300,
      alpha: { start: 0.8, end: 0 },
      quantity: 8,
      tint: 0xaaaaaa,
    });
    this.time.delayedCall(400, () => particles.destroy());
  }

  private revealAllMines() {
    for (const row of this.grid) {
      for (const cell of row) {
        if (cell.type === TileType.Mine) cell.img.setTint(0xff4444);
      }
    }
  }

  // ──────────────────────────────── GAME END ────────────────────────────────
  private gameClear() {
    this.timerEvent?.remove();
    this.add
      .text(this.scale.width / 2, this.scale.height * 0.42, "CLEAR!", {
        fontSize: "120px",
        color: "#000",
      })
      .setOrigin(0.5);
  }

  private gameOver(reason: string) {
    this.timerEvent?.remove();
    this.scene.start("GameOver", { reason });
  }

  // ──────────────────────────────── UI ────────────────────────────────
  private createModeButtons() {
    const y = this.scale.height - 260;
    const x1 = this.scale.width / 2 - 140;
    const x2 = this.scale.width / 2 + 140;

    const mk = (x: number, key: string, label: string, onClick: () => void) => {
      const cont = this.add.container(x, y);
      const bg = this.add.rectangle(0, 0, 180, 180, 0xe0ad6b, 20);
      const ic = this.add
        .text(0, -20, key, { fontSize: "60px" })
        .setOrigin(0.5);
      const tx = this.add
        .text(0, 56, label, { fontSize: "32px", color: "#000" })
        .setOrigin(0.5);
      cont.add([bg, ic, tx]);
      cont
        .setInteractive(
          new Phaser.Geom.Rectangle(-90, -90, 180, 180),
          Phaser.Geom.Rectangle.Contains
        )
        .on("pointerdown", onClick);
    };

    mk(x1, "⛏️", "채굴 모드", () => (this.mode = "mine"));
    mk(x2, "💣", "폭탄 마킹", () => (this.mode = "flag"));
  }

  private createBottomNav() {
    const y = this.scale.height - 100;
    const s = 200,
      cx = this.scale.width / 2;
    const mk = (x: number, key: string, cb: () => void) => {
      const c = this.add.circle(x, y, 70, 0xff7a7a).setInteractive();
      const i = this.add
        .text(x, y - 10, key, { fontSize: "60px" })
        .setOrigin(0.5);
      c.on("pointerdown", cb);
    };
    mk(cx - s, "❓", () => console.log("help"));
    mk(cx, "🛒", () => console.log("shop"));
    mk(cx + s, "⚙️", () => console.log("settings"));
  }
}
