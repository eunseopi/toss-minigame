// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { Debug } from '../utils/Debug';
/* END-USER-IMPORTS */

export default class Level extends Phaser.Scene {
	private tileCount: number = 4; // 화면에 타일이 몇개 보일지
    private mapSize: number = 10; // 맵 크기
	private pickaxeAnimationSpeed: number = 300; // 곡괭이 애니메이션 속도

    private isMining: boolean = false; // 채굴 중인지 확인하는 플래그

    constructor() {
        super("Level");

        /* START-USER-CTR-CODE */
        // Write your code here.
        /* END-USER-CTR-CODE */
    }
	
	/**
	 * 화면에 타일이 몇개 보일지 설정 (가로기준)
	 * @param count 타일 개수
	 */
	public setTileCount(count: number) {
		this.tileCount = count;
	}

	/**
	 * 맵 크기 설정
	 * @param size 맵 크기
	 */
    public setMapSize(size: number) {
        this.mapSize = size;
    }

    init(data: { mapSize?: number }) {
        if (data.mapSize) {
            this.mapSize = data.mapSize;
        }
        Debug.log(`설정된 맵 크기 : ${this.mapSize}x${this.mapSize}`);
    }

    editorCreate(): void {
        this.events.emit("scene-awake");
    }

    /* START-USER-CODE */

    preload() {
		// asset pack 로드
        this.load.pack("mine-asset-pack", "assets/mine/mine-asset-pack.json");

        // 개별 파일 로드 진행상황 확인 (필요시)
        this.load.on('progress', (progress: number) => {
            Debug.log('Asset 불러오는중 :', Math.round(progress * 100) + '%');
        });
        
        // asset pack 로드 완료 이벤트 리스너
        this.load.on('complete', () => {
            Debug.log('Asset Pack 로드 완료');
        });

        // 에러 처리
        this.load.on('loaderror', (file: any) => {
            Debug.error('Asset Pack 로드 오류 :', file.key, file.src);
        });
    }

    create() {
		// 맵 생성
		this.createMap();
        
        this.editorCreate();
    }

	/**
	 * 맵 생성 (타일 배치 및 클릭 이벤트 설정)
	 */
    private createMap() {
        Debug.log(`맵 생성 ${this.mapSize}x${this.mapSize} map`);
        
        // 타일 크기 계산 (화면 너비 기준)
        const tileSize = this.cameras.main.width / this.tileCount;
        
        Debug.log(`화면 크기 : ${this.cameras.main.width}, 타일 크기: ${tileSize}`);

        // 사용할 블록 텍스처
        const blockTextures = ['blockNormal1', 'blockNormal2', 'blockNormal3'];

        // 맵 데이터
        const mapData: Phaser.GameObjects.Image[][] = [];

        for (let row = 0; row < this.mapSize; row++) {
            mapData[row] = []; // 행 초기화
            for (let col = 0; col < this.mapSize; col++) {
                // 타일 위치 계산
                const x = (col * tileSize);
                const y = (row * tileSize);

                // 랜덤 블록 텍스처 선택
                const randomIndex = Phaser.Math.Between(0, blockTextures.length - 1);
                const selectedTexture = blockTextures[randomIndex];

                // 타일 생성
                const tile = this.add.image(x, y, selectedTexture);
                tile.setDisplaySize(tileSize, tileSize); // 타일 크기 정사각형 설정
                tile.setOrigin(0, 0); // 왼쪽 위 기준점으로 설정

                // 클릭 이벤트
                tile.setInteractive(); // 클릭 가능하도록 설정
                tile.on('pointerdown', () => this.eventBlockOnClick(tile));

                // 맵 데이터에 타일 저장
                mapData[row][col] = tile;
            }
        }

        // 생성한 맵 데이터를 클래스 변수에 저장
        (this as any).mapData = mapData;
        
        Debug.log('레벨 생성 완료!');
    }

	/**
	 * 블럭 클릭 이벤트 핸들러
	 * @param tile 클릭된 타일
	 */
	private eventBlockOnClick(tile: Phaser.GameObjects.Image) {
		Debug.log('블럭 클릭 :', tile);
		// 이미 채굴 중이면 클릭 무시
        if (this.isMining) {
			return;
		}
		this.mineBlock(tile); // 채굴 함수 호출
	}

	/**
	 * 블럭 클릭 처리
	 * @param tile 클릭된 타일
	 */
    private mineBlock(tile: Phaser.GameObjects.Image) {
        // 채굴 시작 - 플래그 설정
        this.isMining = true;

		// 타일의 중앙 좌표 계산
		const centerX = tile.x + tile.displayWidth / 2;
		const centerY = tile.y + tile.displayHeight / 2;
        
        // 곡괭이 이미지 생성
        const tileSize = tile.displayWidth; // 타일 크기
        const offsetX = tileSize * 0.1; // X위치 수정
        const offsetY = -tileSize * 0.45; // Y위치 수정
        
		// 곡괭이 이미지 추가
        const pickaxe = this.add.image(centerX + offsetX, centerY + offsetY, 'pickaxe');
        
        // 곡괭이 크기 조정
        pickaxe.setDisplaySize(tileSize * 1, tileSize * 1);
        
        // 초기 각도를 30도로 설정 (pickaxe 이미지가 이미 270도 정도 돌려져 있으므로 30 - 270 = -240도)
        pickaxe.setRotation(Phaser.Math.DegToRad(30 - 270));
        
        // 애니메이션: 30도에서 270도로 회전 (실제로는 -240도에서 0도로 회전)
        this.tweens.add({
            targets: pickaxe,
            rotation: 0, // 0도 = 270도 위치 (원래 곡괭이 각도임)
            duration: this.pickaxeAnimationSpeed, // 재생시간
            ease: 'Power2',
            onComplete: () => {
                // 애니메이션 완료 후 곡괭이 제거
                pickaxe.destroy();
                
                // 블럭 페이드아웃 ( 임시 )
                this.tweens.add({
                    targets: tile,
                    alpha: 0,
                    duration: 200,
                    onComplete: () => {
						// 블럭 제거
                        tile.destroy();
                        // 채굴 완료 - 플래그 해제
                        this.isMining = false;
                    }
                });
            }
        });

		// 채굴 사운드 재생
		this.sound.play('blockBreakSound', { volume: 1 });
    }

	/* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
