class GameOverManager {
    constructor() {
        this.initialized = false;
        this.scoreBlocks = [];
        this.currentScene = null;
        this._adCallback = null;
    }

    init(callback = () => { gameManager.restart(); }) {
        this.callback = callback;
    }
    
    set adCallback(adCallback) {
        this._adCallback = adCallback;
    }

    initialize(model) {
        // Add a background rectangle
        this.background = new BABYLON.GUI.Rectangle();
        this.background.width = "500px";
        this.background.height = "" + (model.length * 50 + 200) + "px";
        this.background.color = "white";
        this.background.thickness = 2;
        this.background.background = "rgba(0, 0, 0, 0.7)";
        this.background.cornerRadius = 20;
        this.background.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.background.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        advancedTexture.addControl(this.background);

        // StackPanel for layout
        this.panel = new BABYLON.GUI.StackPanel();
        this.panel.width = "90%";
        this.panel.isVertical = true;
        this.panel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.panel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        this.background.addControl(this.panel);

        // Game over text
        this.gameOverText = new BABYLON.GUI.TextBlock();
        this.gameOverText.text = "Game Over";
        this.gameOverText.fontSize = "36px";
        this.gameOverText.height = "60px";
        this.gameOverText.color = "white";
        this.gameOverText.paddingBottom = "20px";
        this.panel.addControl(this.gameOverText);

        // Grid for fixed stats
        this.grid = new BABYLON.GUI.Grid();
        this.grid.width = "100%";
        this.grid.height = "" + ((model.length + 2) * 50) + "px";
        this.grid.addColumnDefinition(0.5); // 50% width for labels
        this.grid.addColumnDefinition(0.5); // 50% width for values

        const rowHeight = 100 / (model.length + 2);

        for (let i = 0; i < model.length; i++) {
            this.grid.addRowDefinition(rowHeight);
            this.addLabel(model[i].name + ":", model[i].color, i, model[i].weight);
        }

        this.grid.addRowDefinition(rowHeight);
        this.grid.addRowDefinition(rowHeight);

        this.addButtons(model.length + 1);

        this.panel.addControl(this.grid);
    }

    addButtons(row) {
        const but1 = this.addButton("stop-button.png", () => {
            this.hide(); // Hide on play again
            if (moreGamesCallback) {
                moreGamesCallback();
            }
        });
        const but2 = this.addButton("restart-button.png", () => {
            this.hide(); // Hide on play again
            if (this.callback) {
                this.callback(); // Custom callback for resetting the game
            }
        });

        this.grid.addControl(but1, row, 0);
        this.grid.addControl(but2, row, 1);
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

    // Add a fixed label to the grid
    addLabel(label, color, row, weight) {
        const labelText = new BABYLON.GUI.TextBlock();
        labelText.text = label;
        labelText.color = color;
        labelText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.grid.addControl(labelText, row, 0);

        const valueText = new BABYLON.GUI.TextBlock();
        valueText.text = "0"; // Default value
        valueText.color = "white";
        valueText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this.grid.addControl(valueText, row, 1);

        if (weight) {
            labelText.fontWeight = weight;
            valueText.fontWeight = weight;
        }

        this.scoreBlocks.push(valueText);
    }

    popup(model) {
        if (this.currentScene != null && this.currentScene != window.gameScene) {
            this.background.dispose();
            this.background = null;
            this.scoreBlocks = [];
            this.initialized = false;
        }
        
        if (this.background && this.background.isVisible) {
            return;
        }
        
        if (!this.initialized) {
            this.currentScene = window.gameScene;
            this.initialize(model);
            this.initialized = true;
        }

        this.background.isVisible = true;

        for (let i = 0; i < model.length; i++) {
            this.scoreBlocks[i].text = "" + model[i].value;
        }

        if (this._adCallback) {
            this._adCallback();
        }
    }

    hide() {
        this.background.isVisible = false;
    }
}

window.gameOverManager = new GameOverManager();
