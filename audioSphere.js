var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
var stats = new Stats();

var renderer = new THREE.WebGLRenderer({
    antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
//renderer.setClearColor(0xFF0000);
renderer.sortObjects = true;
document.body.appendChild(renderer.domElement);
document.body.appendChild(stats.domElement);
camera.position.z = 200;

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
var radius = 100;
var num_orbits = 40;
var arc_separation = 1;
var particles = new THREE.Geometry();
var particleMaterial = new THREE.PointsMaterial({
    color: 0xFFFFFF,
    size: 4,
    map: new THREE.TextureLoader().load("res/particle.png"),
    blending: THREE.AdditiveBlending,
    transparent: true
});

for(var theta = -Math.PI * (1/2 - 1/num_orbits); theta < Math.PI / 2; theta += Math.PI / num_orbits) {
    var orbitRadius = Math.cos(theta) * radius;
    var particleCount = orbitRadius / arc_separation; //Find the number of particles to put on that orbit
    for(var phi = 0; phi < 2 * Math.PI; phi += 2 * Math.PI / particleCount) {
        var particle = new THREE.Vector3(0, 0, 0);
        particle.x = particle.initX = Math.cos(theta) * Math.cos(phi) *  radius;
        particle.y = particle.initY = Math.sin(theta) * radius;
        particle.z = particle.initZ = Math.sin(phi) * orbitRadius;

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
var skipFrequencies = 620; //Skip the first frequencies as they have too big values and mess up the shape of the sphere
source.connect(analyser);
analyser.connect(audioCtx.destination);
analyser.fftSize = 8192;
analyser.smoothingTimeConstant = 0.8;

var frequencyData = new Uint8Array(analyser.frequencyBinCount);
audio.pause();
audio.play();

function render() {
    requestAnimationFrame(render);

    //Update the particles
    analyser.getByteFrequencyData(frequencyData);

    for (var i = 0; i < particles.vertices.length / 2; i++) {
        if (i + skipFrequencies < frequencyData.length) {
            var particle = particles.vertices[Math.floor(particles.vertices.length / 2) + i];
            var factor = frequencyData[i + skipFrequencies] / 256 + 1; //between 1 and 2
            particle.x = particle.initX * factor;
            particle.y = particle.initY * factor;
            particle.z = particle.initZ * factor;

            particle = particles.vertices[Math.floor(particles.vertices.length / 2) - i];
            particle.x = particle.initX * factor;
            particle.y = particle.initY * factor;
            particle.z = particle.initZ * factor;
        }
    }

    particleSystem.geometry.verticesNeedUpdate = true; //Need to specify that the object has changed

    orbit.update();
    stats.update();

    renderer.render(scene, camera);
}
render();

window.addEventListener('resize', function () {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}, false);
