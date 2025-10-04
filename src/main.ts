import Phaser from "phaser";
import Level from "./scenes/Level";
import Preload from "./scenes/Preload";

class Boot extends Phaser.Scene {

    constructor() {
        super("Boot");
    }

    preload() {

        this.load.pack("pack", "assets/preload-asset-pack.json");
    }

    create() {

       this.scene.start("Preload");
    }
}

window.addEventListener('load', function () {
    const userAgent: string = navigator.userAgent;
    const isMobile: boolean = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
	const appElement: Element | null = document.querySelector('#app');
    if (!appElement) {
        throw new Error("App element not found");
    }
    
    if (isMobile) {
        appElement.innerHTML = `<div id="gameContainer"></div>`;
    }
	else {
        const windowHeight: number = window.innerHeight;

		// 데스크탑은 9:16 비율 유지
        const width: number = Math.floor((windowHeight * 9) / 16);
        const height: number = windowHeight;

        appElement.innerHTML = `<div id="gameContainer" style="width:${width}px; height:${height}px;"></div>`;
    }

	const game = new Phaser.Game({
		type: Phaser.AUTO,
		width: '1080',
		height: '1920',
		backgroundColor: "#2f2f2f",
		parent: 'gameContainer',
		scale: {
			mode: Phaser.Scale.ScaleModes.FIT,
			autoCenter: Phaser.Scale.Center.CENTER_BOTH,
		},
		scene: [Boot, Preload, Level]
	});

	game.scene.start("Boot");
});