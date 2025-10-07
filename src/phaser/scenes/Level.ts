import Phaser from "phaser";
import { Debug } from "../utils/Debug";

/** 타일 타입 */
enum TileType {
  Mineral = "mineral",
  Empty = "empty",
  Mine = "mine",
  Rock = "rock",
}
/** 클릭 모드 */
type Mode = "mine" | "flag";
/** 난이도 파라미터 */
type Diff = "easy" | "normal" | "hard";

interface LevelData {
  difficulty?: Diff;
  mapSize?: number;
}

export default class Level extends Phaser.Scene {
  // 규칙/기획 반영 변수
  private gridSize = 10; // 맵 크기 (NxN)
  private visibleCols = 9; // 화면 가로 기준 보이는 타일 수(칸 폭 계산용)
  private difficulty: Diff = "normal";
  private mineProb = 0.15; // 난이도별 기본 확률
  private ensurePaths = 1; // 보장 경로 개수

  // 상태
  private grid: {
    type: TileType;
    img: Phaser.GameObjects.Image;
    flagged: boolean;
    revealed: boolean;
  }[][] = [];
  private mode: Mode = "mine";
  private scanner = 1; // 아이템 초기 수량: 스캐너 1
  private shield = 1; // 아이템 초기 수량: 쉴드 1
  private bombsTotal = 0;
  private timeLeft = 60; // (TBD) 시간 구조 보류이지만 UI는 보여줌
  private timerEvent?: Phaser.Time.TimerEvent;
  private isResolving = false; // 애니메이션/판정 중 클릭 차단
  private skipTurn = false; // 쉴드 발동 후 다음 클릭 1회 무시

  // UI 참조
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

    // 난이도 파라미터
    if (this.difficulty === "easy") {
      this.mineProb = 0.1;
      this.ensurePaths = 2;
    }
    if (this.difficulty === "normal") {
      this.mineProb = 0.15;
      this.ensurePaths = 2;
    }
    if (this.difficulty === "hard") {
      this.mineProb = 0.22;
      this.ensurePaths = 1;
    }

    // 시작 보장 수량
    this.scanner = 1;
    this.shield = 1;
  }

  preload() {
    // asset pack 로드
    this.load.pack("mine-asset-pack", "assets/mine/mine-asset-pack.json");

    // 개별 파일 로드 진행상황 확인 (필요시)
    this.load.on("progress", (progress: number) => {
      Debug.log("Asset 불러오는중 :", Math.round(progress * 100) + "%");
    });

    // asset pack 로드 완료 이벤트 리스너
    this.load.on("complete", () => {
      Debug.log("Asset Pack 로드 완료");
    });

    // 에러 처리
    this.load.on("loaderror", (file: any) => {
      Debug.error("Asset Pack 로드 오류 :", file.key, file.src);
    });
  }

  create() {
    // 상단 HUD
    this.createHUD();

    // 타일맵 생성
    this.createMap();

    // 모드 버튼
    this.createModeButtons();

    // 하단 네비 (도움말/상점/설정 – 데모)
    this.createBottomNav();

    // 타이머 (TBD지만 연출용)
    this.timerEvent = this.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => {
        this.timeLeft = Math.max(0, this.timeLeft - 0.1);
        this.timerText.setText(this.timeLeft.toFixed(1) + "s");
        if (this.timeLeft <= 10) this.timerText.setColor("#d9534f"); // 연출(빨간색)
        if (this.timeLeft <= 0) this.gameOver("시간 초과");
      },
    });
  }

  // ───────────────────────────────────────
  // HUD
  // ───────────────────────────────────────
  private createHUD() {
    const { width } = this.scale;

    const hud = this.add.container(width / 2, 90);
    const bw = width * 0.78,
      bh = 90;
    const bg = this.add
      .rectangle(0, 0, bw, bh, 0xffffff)
      .setStrokeStyle(3, 0x000000);
    hud.add(bg);

    // 폭탄 총량
    const bombIcon = this.add.image(-bw * 0.3, 0, "💣").setScale(0.8);
    this.bombText = this.add.text(bombIcon.x + 55, -20, "0개", {
      fontSize: "42px",
      color: "#000",
    });
    hud.add([bombIcon, this.bombText]);

    // 타이머
    const clockIcon = this.add.image(bw * 0.05, 0, "🕐").setScale(0.8);
    this.timerText = this.add.text(
      clockIcon.x + 55,
      -20,
      this.timeLeft.toFixed(1) + "s",
      { fontSize: "42px", color: "#000" }
    );
    hud.add([clockIcon, this.timerText]);

    // 일시정지
    const pause = this.add
      .image(bw * 0.5 + 60, 0, "⏸️")
      .setScale(0.9)
      .setInteractive();
    pause.on("pointerdown", () => console.log("pause"));
    hud.add(pause);

    // 아이템 표시 (실드/스캐너)
    const labelY = 190;
    const tag = (x: number, text: string) => {
      const r = this.add.rectangle(x, labelY - 24, 120, 36, 0xfcd27e, 1);
      r.setOrigin(0.5);
      const t = this.add
        .text(x, labelY - 24, text, { fontSize: "26px", color: "#000" })
        .setOrigin(0.5);
      return [r, t];
    };
    const [s1, s2] = tag(this.scale.width / 2 - 120, "쉴드");
    const [s3, s4] = tag(this.scale.width / 2 + 120, "스캐너");

    const shieldBox = this.add
      .rectangle(this.scale.width / 2 - 120, labelY + 40, 140, 80, 0xdddddd)
      .setOrigin(0.5);
    const shieldIcon = this.add
      .image(shieldBox.x - 35, shieldBox.y, "🛡️")
      .setScale(0.8);
    this.shieldText = this.add.text(
      shieldBox.x + 25,
      shieldBox.y - 18,
      `${this.shield}`,
      { fontSize: "42px", color: "#000" }
    );

    const scanBox = this.add
      .rectangle(this.scale.width / 2 + 120, labelY + 40, 140, 80, 0xdddddd)
      .setOrigin(0.5);
    const scanIcon = this.add
      .image(scanBox.x - 35, scanBox.y, "⭐")
      .setScale(0.8);
    this.scannerText = this.add.text(
      scanBox.x + 25,
      scanBox.y - 18,
      `${this.scanner}`,
      { fontSize: "42px", color: "#000" }
    );

    // 스캐너 사용: 지정 타일 지뢰 여부 공개
    scanBox.setInteractive().on("pointerdown", () => {
      if (this.scanner <= 0) return;
      this.mode = "mine"; // 클릭 충돌 방지
      this.enterScanModeOnce();
    });

    this.add.existing(s1);
    this.add.existing(s2);
    this.add.existing(s3);
    this.add.existing(s4);
  }

  // ───────────────────────────────────────
  // 맵 생성 (보장 경로)
  // ───────────────────────────────────────
  private createMap() {
    const W = this.cameras.main.width;
    const tileSize = Math.floor(W / this.visibleCols);
    const offsetX = Math.floor((W - tileSize * this.gridSize) / 2);
    const topY = 360;

    // 1. 경로 만들기(좌→우) : 최소 1개 보장
    const mainPath = this.generatePath(this.gridSize);

    // 2. Normal은 보조 경로 1개 더(서로 다른 라인 위주), Easy는 확률 낮고 다수 경로 허용
    const extraPaths: Set<string> = new Set(mainPath);
    if (this.ensurePaths >= 2) {
      const alt = this.generatePath(this.gridSize);
      alt.forEach((k) => extraPaths.add(k));
    }

    // 3. 타일 깔기 + 지뢰 배치(경로는 안전)
    this.grid = [];
    this.bombsTotal = 0;

    const blocks = ["blockNormal1", "blockNormal2", "blockNormal3"];

    for (let r = 0; r < this.gridSize; r++) {
      this.grid[r] = [];
      for (let c = 0; c < this.gridSize; c++) {
        // 위치
        const x = offsetX + c * tileSize;
        const y = topY + r * tileSize;

        // 베이스 블록
        const k = blocks[Phaser.Math.Between(0, blocks.length - 1)];
        const img = this.add
          .image(x, y, k)
          .setOrigin(0)
          .setDisplaySize(tileSize, tileSize)
          .setInteractive();

        // 경로 여부
        const key = `${r},${c}`;
        const onSafePath = extraPaths.has(key);

        // 지뢰 여부
        const isMine = !onSafePath && Math.random() < this.mineProb;

        const cell = {
          type: isMine ? TileType.Mine : TileType.Mineral,
          img,
          flagged: false,
          revealed: false,
        };
        if (isMine) this.bombsTotal++;

        // 클릭 로직
        img.on("pointerdown", () => this.onTileClick(r, c));

        this.grid[r][c] = cell;
      }
    }

    this.bombText.setText(`${this.bombsTotal}개`);
  }

  /** 무조건 도달 가능한 좌→우 경로 생성 (간단 랜덤 워크) */
  private generatePath(n: number): Set<string> {
    let r = Phaser.Math.Between(0, n - 1);
    let c = 0;
    const path = new Set<string>([`${r},${c}`]);

    while (c < n - 1) {
      // 우선 오른쪽 진행, 가끔 위/아래로 굴절
      const dirs = [
        { dr: 0, dc: 1 },
        { dr: 1, dc: 0 },
        { dr: -1, dc: 0 },
      ];
      const d = Phaser.Utils.Array.GetRandom(dirs);
      const nr = Phaser.Math.Clamp(r + d.dr, 0, n - 1);
      const nc = Phaser.Math.Clamp(c + d.dc, 0, n - 1);
      if (nc < c) continue; // 뒤로는 안 감
      r = nr;
      c = nc;
      path.add(`${r},${c}`);
    }
    return path;
  }

  // ───────────────────────────────────────
  // 타일 클릭/채굴/마킹/아이템
  // ───────────────────────────────────────
  private async onTileClick(r: number, c: number) {
    if (this.isResolving) return;
    const cell = this.grid?.[r]?.[c];
    if (!cell || cell.revealed) return;

    // 마킹 모드
    if (this.mode === "flag") {
      cell.flagged = !cell.flagged;
      cell.img.setTexture(cell.flagged ? "flag" : "blockNormal1"); // flag 아이콘/텍스처 준비
      return;
    }

    // 채굴 모드
    if (this.skipTurn) {
      this.skipTurn = false;
      return;
    }

    this.isResolving = true;

    // 지뢰 클릭
    if (cell.type === TileType.Mine) {
      if (this.shield > 0) {
        // 쉴드 소모: 지뢰 무효화 + 빈칸으로 개방 + 다음 클릭 스킵
        this.shield--;
        this.shieldText.setText(String(this.shield));

        await this.revealAsEmpty(cell);
        this.skipTurn = true; // 페널티: 다음 클릭 스킵
      } else {
        // 게임오버
        this.revealMine(cell);
        this.gameOver("지뢰 폭발!");
        this.isResolving = false;
        return;
      }
    } else {
      // 광물/빈칸 처리: 여기선 간단히 빈칸 개방 + 소리
      await this.revealAsEmpty(cell);
      // 낮은 확률로 아이템 드랍
      const p = Math.random();
      if (p < 0.05) {
        this.scanner++;
        this.scannerText.setText(String(this.scanner));
      } else if (p < 0.1) {
        this.shield++;
        this.shieldText.setText(String(this.shield));
      }
    }

    this.isResolving = false;

    // 목적지 도달 규칙(간단): 우측 끝 열을 열면 클리어로 처리
    if (c === this.gridSize - 1) this.gameClear();
  }

  private revealMine(cell: { img: Phaser.GameObjects.Image }) {
    cell.img.setTint(0xff4444);
    // this.sound.play("boom", { volume: 0.8 }); 여기도 보류
  }

  private async revealAsEmpty(cell: {
    img: Phaser.GameObjects.Image;
    revealed?: boolean;
  }) {
    cell.revealed = true;
    // 간단 페이드
    return new Promise<void>((res) => {
      this.tweens.add({
        targets: cell.img,
        alpha: 0.15,
        duration: 120,
        onComplete: () => res(),
      });
      // this.sound.play("blockBreakSound", { volume: 1 }); 아직 사운드가 없어서 보류
    });
  }

  /** 스캐너: 다음으로 클릭한 타일의 지뢰 여부만 공개 (소모형) */
  private enterScanModeOnce() {
    if (this.isResolving) return;
    if (this.scanner <= 0) return;
    this.scanner--;
    this.scannerText.setText(String(this.scanner));

    const once = (r: number, c: number) => {
      const cell = this.grid[r][c];
      const hintColor = cell.type === TileType.Mine ? 0xff7777 : 0x77ff77;
      this.add
        .rectangle(
          cell.img.x + cell.img.displayWidth / 2,
          cell.img.y + cell.img.displayHeight / 2,
          cell.img.displayWidth * 0.9,
          cell.img.displayHeight * 0.9,
          hintColor,
          0.35
        )
        .setOrigin(0.5);
    };

    // 한 번만 가로채기
    const handler = (pointer: any, gObj: Phaser.GameObjects.GameObject[]) => {
      const img = gObj.find(
        (go) => go instanceof Phaser.GameObjects.Image
      ) as Phaser.GameObjects.Image;
      if (!img) return;
      // 좌표로 셀 찾기
      outer: for (let r = 0; r < this.gridSize; r++) {
        for (let c = 0; c < this.gridSize; c++) {
          if (this.grid[r][c].img === img) {
            once(r, c);
            break outer;
          }
        }
      }
      this.input.off("gameobjectdown", handler);
    };

    this.input.once("gameobjectdown", handler);
  }

  // ───────────────────────────────────────
  // 모드 버튼 / 하단 네비
  // ───────────────────────────────────────
  private createModeButtons() {
    const y = this.scale.height - 260;
    const x1 = this.scale.width / 2 - 140;
    const x2 = this.scale.width / 2 + 140;

    const mk = (x: number, key: string, label: string, onClick: () => void) => {
      const cont = this.add.container(x, y);
      const bg = this.add.rectangle(0, 0, 180, 180, 0xe0ad6b, 20);
      const ic = this.add.image(0, -20, key).setScale(0.9);
      const tx = this.add
        .text(0, 56, label, { fontSize: "32px", color: "#000" })
        .setOrigin(0.5);
      cont.add([bg, ic, tx]);
      cont.setSize(180, 180);
      cont
        .setInteractive(
          new Phaser.Geom.Rectangle(-90, -90, 180, 180),
          Phaser.Geom.Rectangle.Contains
        )
        .on("pointerdown", onClick);
      return cont;
    };

    mk(x1, "icon-pickaxe", "채굴 모드", () => {
      this.mode = "mine";
    });
    mk(x2, "icon-bomb", "폭탄 마킹", () => {
      this.mode = "flag";
    });
  }

  private createBottomNav() {
    const y = this.scale.height - 100;
    const s = 200,
      cx = this.scale.width / 2;
    const mk = (x: number, key: string, cb: () => void) => {
      const c = this.add.circle(x, y, 70, 0xff7a7a).setInteractive();
      const i = this.add.image(x, y, key).setScale(0.9);
      c.on("pointerdown", cb);
    };
    mk(cx - s, "icon-help", () => console.log("help"));
    mk(cx, "icon-cart", () => console.log("shop"));
    mk(cx + s, "icon-settings", () => console.log("settings"));
  }

  // ───────────────────────────────────────
  // 엔딩
  // ───────────────────────────────────────
  private gameClear() {
    this.timerEvent?.remove();
    this.add
      .text(this.scale.width / 2, this.scale.height * 0.42, "CLEAR!", {
        fontSize: "120px",
        color: "#000",
      })
      .setOrigin(0.5);
    this.time.delayedCall(1200, () => this.scene.start("MainMenu"));
  }

  private gameOver(msg: string) {
    this.timerEvent?.remove();
    this.add
      .text(this.scale.width / 2, this.scale.height * 0.42, "GAME OVER", {
        fontSize: "100px",
        color: "#000",
      })
      .setOrigin(0.5);
    this.add
      .text(this.scale.width / 2, this.scale.height * 0.5, msg, {
        fontSize: "48px",
        color: "#000",
      })
      .setOrigin(0.5);
    this.time.delayedCall(1400, () => this.scene.start("MainMenu"));
  }
}
