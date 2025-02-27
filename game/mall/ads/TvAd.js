class TvAd {
    constructor(adName, link) {
        let folder = 'ad-data/' + adName + '/';
        let boxMat = new BABYLON.StandardMaterial("boxMat", mallScene);
        boxMat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);

        var box = BABYLON.MeshBuilder.CreateBox("tv", {width: 3.8, height: 2.9, depth: 0.1 }, mallScene);
        box.material = boxMat;
        box.position.x = -roomEdgeLength / 2 + 0.01 - 0.06;
        box.position.y = 1;
        box.position.z = 2;
        box.rotation = new BABYLON.Vector3(0, -Math.PI / 2, 0);

        // Create a plane mesh
        var plane = BABYLON.MeshBuilder.CreatePlane("plane", { width: 3.6, height: 2.7 }, mallScene);
        plane.position.x = -roomEdgeLength / 2 + 0.01;
        plane.position.y = 1;
        plane.position.z = 2;
        plane.rotation = new BABYLON.Vector3(0, -Math.PI / 2, 0);

        // Create a standard material for the plane
        var videoMat = new BABYLON.StandardMaterial("videoMat", mallScene);
        
        // Create a video texture. Replace 'path/to/video.mp4' with your video file's URL.
        var videoTexture = new BABYLON.VideoTexture("video", folder + 'video.mp4', mallScene, false, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE, { muted: true });
        
        // Optionally, set properties on the video element (e.g., looping)
        videoTexture.video.loop = true;
        
        // Assign the video texture as the diffuse texture of the material
        videoMat.diffuseTexture = videoTexture;
        
        // Apply the material to the plane
        plane.material = videoMat;

        var banner = BABYLON.MeshBuilder.CreatePlane("plane", { width: 3.64, height: 0.45 }, mallScene);
        banner.position.x = -roomEdgeLength / 2 + 0.01;
        banner.position.y = -0.7;
        banner.position.z = 2;
        banner.rotation = new BABYLON.Vector3(0, -Math.PI / 2, 0);

        let bannerMat = new BABYLON.StandardMaterial("boxMat", mallScene);
        bannerMat.diffuseTexture = new BABYLON.Texture(folder + 'banner.jpg', mallScene);
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

window.TvAd = TvAd;
