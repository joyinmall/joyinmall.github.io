class ScoreManager {
    constructor() {
        this.horizontalPanel = null;
    }

    init(model, updateFunction) {
        this.scoreBlocks = [];
        this._animTick = -1;
        this.model = [];
        this.lastValues = [];
        this.updateFunction = updateFunction;

        if (this.horizontalPanel) {
            this.horizontalPanel.dispose();
        }

        this.horizontalPanel = new BABYLON.GUI.StackPanel();
        this.horizontalPanel.isVertical = false; // Set to false for horizontal stacking
        this.horizontalPanel.top = "20px";
        this.horizontalPanel.left = "20px";
        this.horizontalPanel.height = "20px";
        this.horizontalPanel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.horizontalPanel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        advancedTexture.addControl(this.horizontalPanel);

        for (let row of model) {
            let rowText = new BABYLON.GUI.TextBlock();
            rowText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            rowText.text = " " + row.initials + ":" + row.value + " ";
            rowText.color = "white";
            rowText.fontSize = 24;
            rowText.width = row.width ? row.width : "80px";
            this.horizontalPanel.addControl(rowText);
            this.scoreBlocks.push(rowText);
            this.lastValues.push(row.value);
            this.model.push(row);
        }
        
        window.gameScene.onBeforeRenderObservable.add(() => {
            for (let i = 0; i < this.model.length; i++) {
                if (this.model[i].value != this.lastValues[i]) {
                    this.scoreBlocks[i].text = " " + this.model[i].initials + ":" + this.model[i].value + " ";
                    this._animTick = 0;

                    if (updateFunction) {
                        updateFunction(this.model[i].initials, this.model[i].value - this.lastValues[i]);
                    }

                    if (this.model[i].value > this.lastValues[i]) {
                        this.scoreBlocks[i].color = "lightgreen";
                    } else {
                        this.scoreBlocks[i].color = "red";
                    }
                }

                this.lastValues[i] = this.model[i].value;
            }

            if (this._animTick >= 0) {
                if (this._animTick < 60) {
                    this._animTick++;
                } else {
                    for (let sb of this.scoreBlocks) {
                        sb.color = "white";
                    }

                    this._animTick = -1;
                }
            }
        });
    }
}

window.scoreManager = new ScoreManager();
