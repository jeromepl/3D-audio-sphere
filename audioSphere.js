var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 30;

var renderer = new THREE.WebGLRenderer({
    antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
//renderer.setClearColor(0xFF0000);
renderer.sortObjects = true;
document.body.appendChild(renderer.domElement);

var orbit = new THREE.OrbitControls(camera, render.domElement);

var light = new THREE.AmbientLight(0x000000);
scene.add(light);

var lights = [];
lights[0] = new THREE.PointLight(0xffffff, 1, 0);
lights[1] = new THREE.PointLight(0xffffff, 1, 0);
lights[2] = new THREE.PointLight(0xffffff, 1, 0);

lights[0].position.set(0, 200, 0);
lights[1].position.set(100, 200, 100);
lights[2].position.set(-100, -200, -100);

scene.add(lights[0]);
scene.add(lights[1]);
scene.add(lights[2]);

//Create the 3D text
var mesh = new THREE.Object3D();
var geometry = new THREE.TextGeometry("Jerome", {
    size: 5,
    height: 2,
    curveSegments: 24,
    font: "helvetiker",
    weight: "normal",
    style: "normal",
    bevelEnabled: false,
    bevelThickness: 1,
    bevelSize: 0.5
});

geometry.center();

mesh.add(new THREE.Mesh(
    geometry,
    new THREE.MeshLambertMaterial({
        color: 0x156289
    })
));

mesh.renderOrder = 0;
scene.add(mesh);

/* PARTICLE SYSTEM */
var particleCount = 484;
var separation = 10; //In pixels
var particles = new THREE.Geometry();
var particleMaterial = new THREE.PointsMaterial({
    color: 0xFFFFFF,
    size: 4,
    map: new THREE.TextureLoader().load("res/particle.png"),
    blending: THREE.AdditiveBlending,
    transparent: true,
    blendEquationAlpha: THREE.SubtractEquation
});

//particleMaterial.blendSrcAlpha = THREE.ZeroFactor;
//particleMaterial.blendDstAlpha = THREE.ZeroFactor;
//particleMaterial.blendEquationAlpha = THREE.SubtractEquation;

var width = Math.sqrt(particleCount);
for (var i = -width / 2; i < width / 2; i++) {
    for (var j = -width / 2; j < width / 2; j++) {
        var particle = new THREE.Vector3(i * separation, 0, j * separation);
        particles.vertices.push(particle);
    }
}

//Create the particle system
var particleSystem = new THREE.Points(particles, particleMaterial);
scene.add(particleSystem);

/*var grid = new THREE.GridHelper(100, 10);
scene.add(grid);*/


/* AUDIO */
var audioCtx = new AudioContext();
var analyser = audioCtx.createAnalyser();
var source = audioCtx.createMediaElementSource(audio);
source.connect(analyser);
analyser.connect(audioCtx.destination);
analyser.fftSize = 1024;
analyser.smoothingTimeConstant = 0.8;

var frequencyData = new Uint8Array(analyser.frequencyBinCount);
audio.pause();
audio.play();

function render() {
    requestAnimationFrame(render);

    //Update the particles
    analyser.getByteFrequencyData(frequencyData);

    for (var i = 0; i < particleCount; i++) {
        if (i < frequencyData.length) {
            particles.vertices[i].y = (frequencyData[i] * 100) / 256;
        }
    }

    particleSystem.geometry.__dirtyVertices = true;
    particleSystem.geometry.verticesNeedUpdate = true;

    orbit.update();

    renderer.render(scene, camera);
}
render();

window.addEventListener('resize', function () {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}, false);