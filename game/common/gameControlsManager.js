class GameControlsManager {
    constructor() {
        this.introImage = null;
        this.pauseButton = null;
        this._paused = 0;
        this._adCallback = null;
    }

    get paused() {
        return this._paused > 0;
    }
    
    set adCallback(adCallback) {
        this._adCallback = adCallback;
    }
    
    initialize() {
        const helpThis = this;

        this.pauseButton = this.addButton("pause-button.png");

        this.pauseButton.top = "20px";
        this.pauseButton.left = "-20px";
        this.pauseButton.width = 0.1;
        this.pauseButton.height = 0.04;
        this.pauseButton.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this.pauseButton.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.pauseButton.isVivible = false;
        advancedTexture.addControl(this.pauseButton);

        // Add a controlDialog rectangle
        this.controlDialog = new BABYLON.GUI.Rectangle();
        this.controlDialog.width = "500px";
        this.controlDialog.height = "300px";
        this.controlDialog.color = "white";
        this.controlDialog.thickness = 2;
        this.controlDialog.background = "rgba(0, 0, 0, 0.7)";
        this.controlDialog.cornerRadius = 20;
        this.controlDialog.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.controlDialog.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        this.controlDialog.isVisible = false;
        this.controlDialog.zIndex = 1000;
        advancedTexture.addControl(this.controlDialog);

        // StackPanel for layout
        this.panel = new BABYLON.GUI.StackPanel();
        this.panel.width = "90%";
        this.panel.isVertical = true;
        this.panel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.panel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        this.controlDialog.addControl(this.panel);

        // Game paused text
        this.gameOverText = new BABYLON.GUI.TextBlock();
        this.gameOverText.text = "Game Paused";
        this.gameOverText.fontSize = "36px";
        this.gameOverText.height = "60px";
        this.gameOverText.color = "white";
        this.gameOverText.paddingBottom = "20px";
        this.panel.addControl(this.gameOverText);

        this.resumeButton = this.addButton("resume-button.png");

        this.resumeButton.width = "400px";
        this.resumeButton.height = "100px";

        this.panel.addControl(this.resumeButton);

        // Grid for fixed stats
        this.grid = new BABYLON.GUI.Grid();
        this.grid.width = "100%";
        this.grid.height = "100px";
        this.grid.addColumnDefinition(0.5); // 50% width for labels
        this.grid.addColumnDefinition(0.5); // 50% width for values

        const rowHeight = 50;

        this.grid.addRowDefinition(rowHeight);
        this.grid.addRowDefinition(rowHeight);

        this.addButtons(1);

        this.stopButton.onPointerClickObservable.add(() => {
            this.hide(); // Hide on play again
            if (moreGamesCallback) {
                moreGamesCallback();
            }
        });

        this.panel.addControl(this.grid);
    }

    hide() {
        this.introImage.isVisible = false;
        this.controlDialog.isVisible = false;
        document.body.style.cursor = "default";// default cursor
    }

    addButtons(row) {
        this.stopButton = this.addButton("stop-button.png");
        this.restartButton = this.addButton("restart-button.png");

        this.grid.addControl(this.stopButton, row, 0);
        this.grid.addControl(this.restartButton, row, 1);
    }

    init(imgUrl, startCallback = () => { if (gameManager) { gameManager.start(true); return true; } else { return false; } }, restartCallback = () => { gameManager.restart(); }, pauseCallback = () => {}, resumeCallback = () => {}) {
        this._paused = 0;
        
        if (this.introImage) {
            advancedTexture.removeControl(this.introImage);
            this.introImage.dispose();
        } else {
            this.initialize();
        }

        if (this.pauseCallback) {
            window.removeEventListener('blur', this.pauseCallback);
        }

        if (this.resumeCallback) {
            window.removeEventListener('focus', this.resumeCallback);
        }
        
        this.restartCallback = () => {
            this._paused = 0;
            restartCallback();
        }
        
        this.pauseCallback = () => {
            this._paused++;
            pauseCallback();
        }
        
        this.resumeCallback = () => {
            this._paused--;
            resumeCallback();
        }

        if (this.pauseCallback) {
            window.addEventListener('blur', this.pauseCallback);
        }

        if (this.resumeCallback) {
            window.addEventListener('focus', this.resumeCallback);
        }

        this.pauseButton.onPointerClickObservable.clear();
        this.pauseButton.onPointerClickObservable.add(() => {
            this.controlDialog.isVisible = true;
            this.introImage.isVisible = true;
            
            if (this.pauseCallback) {
                this.pauseCallback();
            }
        });

        this.restartButton.onPointerClickObservable.clear();
        this.restartButton.onPointerClickObservable.add(() => {
            this.hide(); // Hide on play again
            if (this.restartCallback) {
                this.restartCallback();
            }
        });

        this.resumeButton.onPointerClickObservable.clear();
        this.resumeButton.onPointerClickObservable.add(() => {
            this.hide(); // Hide on play again
            if (this.resumeCallback) {
                this.resumeCallback();
            }
        });
        
        this.introImage = new BABYLON.GUI.Image("intro", imgUrl);
        this.introImage.width = "100%";
        this.introImage.height = "100%";
        this.introImage.isPointerBlocker = true;

        this.introImage.onPointerClickObservable.add(() => {
            this.pauseButton.isVisible = true;

            if (this.controlDialog && this.controlDialog.isVisible) {
                this.hide();
                if (resumeCallback) {
                    resumeCallback();
                }
            } else if (this._adCallback) {
                this._adCallback();
                this._adCallback = null;    // TODO kills all the adds at start
            } else if (!startCallback || startCallback()) {
                this.hide();
            }
        });

        advancedTexture.addControl(this.introImage);
    }

    addButton(name, action = null) {
        var button = BABYLON.GUI.Button.CreateImageOnlyButton(name, "https://raw.githubusercontent.com/xMichal123/babylon-libraries/main/resources/" + name);
        button.width = 0.9;
        button.color = "white";
        button.thickness = 0;
        button.cornerRadius = 20;

        if (action) {
            button.onPointerClickObservable.add(action);
        }

        return button;
    }
}

window.gameControlsManager = new GameControlsManager();
