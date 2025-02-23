class TaddtoyAd {
    constructor(adName, link) {
        let folder = 'ad-data/' + adName + '/';

        const depth = 0.1;
        const edgePoint = 0.65;
        const poly_path = new BABYLON.Path2(-edgePoint, -0.5);
        poly_path.addLineTo(edgePoint, -0.5);
        poly_path.addArcTo(1.06, 0, edgePoint, 0.5, 10);
        poly_path.addLineTo(-edgePoint, 0.5);
        poly_path.addArcTo(-1.065, 0, -edgePoint, -0.5, 10);
        const poly_tri2 = new BABYLON.PolygonMeshBuilder("polytri2", poly_path);
        const polygon2 = poly_tri2.build(false, depth);
        const sideMaterial = new BABYLON.StandardMaterial("sideMat", mallScene);
        sideMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
        polygon2.material = sideMaterial;
    
        const multiMat = new BABYLON.MultiMaterial("multiMat", mallScene);
        const frontMaterial = new BABYLON.StandardMaterial("frontMat", mallScene);
        frontMaterial.diffuseTexture = new BABYLON.Texture(folder + "taddtoy.jpg", mallScene);
        const backMaterial = new BABYLON.StandardMaterial("backMat", mallScene);
        backMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
    
        const box = BABYLON.MeshBuilder.CreateBox("box", { width: 2.13, height: 1, depth: depth }, mallScene);
        box.rotation.x = -Math.PI / 2;
        box.position.y = -depth / 2;
    
        multiMat.subMaterials.push(frontMaterial, backMaterial, sideMaterial);
        box.material = multiMat;
        box.subMeshes = [
            new BABYLON.SubMesh(0, 0, box.getTotalVertices(), 0, 6, box),
            new BABYLON.SubMesh(1, 0, box.getTotalVertices(), 6, 6, box),
            new BABYLON.SubMesh(2, 0, box.getTotalVertices(), 12, 24, box)
        ];
        
        var boxCSG = BABYLON.CSG2.FromMesh(box);
        box.dispose();
    
        var polyCSG = BABYLON.CSG2.FromMesh(polygon2);
        polygon2.dispose();
        let newHolePlate = polyCSG.intersect(boxCSG);
        polyCSG.dispose();
    
        let newMeshHolePlate = newHolePlate.toMesh("puzzle_piece", mallScene);
        newMeshHolePlate.bakeCurrentTransformIntoVertices();
        newMeshHolePlate.diffuseColor = new BABYLON.Color3(0, 0, 0);
        newHolePlate.dispose();
        boxCSG.dispose();
        //newMeshHolePlate.rotation.x = Math.PI / 2;
        // --- End CSG geometry ---
    
        // Create a plane that will display the video.
        var plane = BABYLON.MeshBuilder.CreatePlane("plane", { width: 0.85, height: 0.65 }, mallScene);
    
        newMeshHolePlate.position.x = roomEdgeLength / 2 - 0.1;
        newMeshHolePlate.position.y = 1;
        newMeshHolePlate.rotation = new BABYLON.Vector3(-Math.PI / 2, 0, Math.PI / 2);
        //box.position.z = 0.06;
        plane.position.x = roomEdgeLength / 2 - 0.1 - 0.07;
        plane.position.y = 1.00;
        plane.rotation = new BABYLON.Vector3(0, Math.PI / 2, 0);

        // Define an array of video URLs (one for each video index).
        var videoURLs = [
          folder + "vid_0.webm",
          folder + "vid_1.webm",
          folder + "vid_2.webm"
        ];
    
        // Preload the video textures.
        var videoTextures = [];
        for (var i = 0; i < videoURLs.length; i++){
            var vt = new BABYLON.VideoTexture("videoTexture" + i, videoURLs[i], mallScene, false, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE, { loop: false, muted: true });
            videoTextures.push(vt);
        }
    
        // Create a material for the plane and assign the first video.
        var videoMat = new BABYLON.StandardMaterial("videoMat", mallScene);
        videoMat.diffuseTexture = videoTextures[0];
        videoMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
        plane.material = videoMat;
    
        // Set the current video index, and start playing the first video.
        var currentVideoIndex = 0;
        videoTextures[currentVideoIndex].video.currentTime = 0;
        videoTextures[currentVideoIndex].video.play();
    
        // Attach an "ended" event listener to each video texture.
        videoTextures.forEach(function(vt) {
            //vt.video.addEventListener("ended", (event) => {console.log('ended')});
            vt.video.onended = function() {
                // Only switch if this video is the one currently displayed.
                if (videoMat.diffuseTexture.video === this) {
                    // Calculate next video index.
                    currentVideoIndex = (currentVideoIndex + 1) % videoTextures.length;
                    // Switch the material's texture to the next video.
                    videoMat.diffuseTexture = videoTextures[currentVideoIndex];
                    // Reset and play the next video.
                    videoTextures[currentVideoIndex].video.currentTime = 0;
                    videoTextures[currentVideoIndex].video.play();
                }
            };
        });
    
        var banner = BABYLON.MeshBuilder.CreatePlane("plane", { width: 3.64, height: 0.76 }, mallScene);
        banner.position.x = roomEdgeLength / 2 - 0.01;
        banner.position.y = -0.2;
        banner.rotation = new BABYLON.Vector3(0, Math.PI / 2, 0);

        let bannerMat = new BABYLON.StandardMaterial("boxMat", mallScene);
        bannerMat.diffuseTexture = new BABYLON.Texture(folder + 'banner.png', mallScene);
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

window.TaddtoyAd = TaddtoyAd;
