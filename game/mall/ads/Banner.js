class Banner {
    constructor(adName, link, zPos, left, width, height) {
        let folder = 'ad-data/' + adName + '/';
        var banner = BABYLON.MeshBuilder.CreatePlane("plane", { width: width, height: height }, mallScene);
        banner.position.x = (left ? -1 : 1) * (roomEdgeLength / 2 - 0.01);
        banner.position.y = Y_POS;
        banner.position.z = zPos;
        banner.rotation = new BABYLON.Vector3(0, (left ? -1 : 1) * Math.PI / 2, 0);

        let bannerMat = new BABYLON.StandardMaterial("boxMat", mallScene);
        bannerMat.diffuseTexture = new BABYLON.Texture(linkRes(folder + 'banner.webp'), mallScene);
        bannerMat.diffuseTexture.hasAlpha = true;
        banner.material = bannerMat;

        banner.actionManager = new BABYLON.ActionManager(mallScene);

        // **Click Action**
        banner.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => {
                window.open(link, "_blank");
            }
        ));

        // Pointer over action to change the cursor to a pointer (hand)
        banner.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, () => {
            document.body.style.cursor = "pointer";
            })
        );
        
        // Pointer out action to change the cursor back to default
        banner.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, () => {
            document.body.style.cursor = "default";
            })
        );
    }
}

window.Banner = Banner;