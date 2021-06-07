let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
let renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


const frontColor = new THREE.Color(0xcc0099);
const backColor = new THREE.Color(0xdddddd);
const STEPS_PER_FRAME = 100;
const EPSILON = 1e-9;
const n = 2;
const z = 1;
const kl = 0.5;
const kt = 0.00007;
const kT = 0.0005;
const mu = 0.00002;
const friction = mu/STEPS_PER_FRAME;

let materials = [new THREE.MeshBasicMaterial({
	color: frontColor,
	side: THREE.DoubleSide
}),
new THREE.MeshBasicMaterial({
	color: backColor,
	side: THREE.BackSide
})];


class LinearSpring{
	constructor(a, b, aa, ab, k){
		this.a = a; this.b = b;
		this.aa = aa; this.ab = ab;
		this.d0 = this.a.distanceTo(this.b);
		this.k = k/this.d0;
	}
	
	calcAcc(){
		let d = this.a.distanceTo(this.b);
		let a = this.a.clone().sub(this.b).setLength(this.k*(this.d0 - d));
		this.aa.add(a);
		this.ab.add(a.negate());
	}
}

class AngularSpring{
	constructor(a, b, c, d, aa, ab, k, t0){
		this.a = a; this.b = b; this.c = c; this.d = d;
		this.aa = aa; this.ab = ab;
		let l = this.c.distanceTo(this.d);
		let c_d = this.c.clone().sub(this.d).normalize();
		this.ka = k*l/this.a.clone().sub(this.d).projectOnPlane(c_d).length();
		this.kb = k*l/this.b.clone().sub(this.c).projectOnPlane(c_d).length();
		this.t0 = t0;
	}
	
	calcVecsAndAngleDistance(){
		let an = this.c.clone().sub(this.a).cross(this.d.clone().sub(this.a)).normalize();
		let bn = this.d.clone().sub(this.b).cross(this.c.clone().sub(this.b)).normalize();
		let c_d = this.c.clone().sub(this.d).normalize();
		let dp = an.dot(bn);
		let tp = new THREE.Vector3().crossVectors(an, bn).dot(c_d);
		let t = Math.PI - Math.atan2(tp, dp);
		let a = -(this.t0 - t);
		return [an, bn, c_d, a];
	}
	
	calcAcc(){
		let [an, bn, c_d, a] = this.calcVecsAndAngleDistance();
		if(Math.abs(a%(2*Math.PI)) < EPSILON){
			return;
		}
		an.multiplyScalar(this.ka*a);
		bn.multiplyScalar(this.kb*a);
		this.aa.add(an);
		this.ab.add(bn);
	}
}

function makeWaterbomb(){
	let linearSprings = [];
	let angularSprings = [];
	let geometry = new THREE.Geometry().setFromPoints([
		[-1, 3],//0
		[0, 3],//1
		[1, 3],//2
		[2, 3],//3
		[-2, 2],//4
		[-1, 2],//5
		[0, 2],//6
		[1, 2],//7
		[2, 2],//8
		[3, 2],//9
		[-2, 1],//10
		[-1, 1],//11
		[0, 1],//12
		[1, 1],//13
		[2, 1],//14
		[3, 1],//15
		[-2, 0],//16
		[-1, 0],//17
		[0, 0],//18
		[1, 0],//19
		[2, 0],//20
		[3, 0],//21
		[-2, -1],//22
		[-1, -1],//23
		[0, -1],//24
		[1, -1],//25
		[2, -1],//26
		[3, -1],//27
		[-1, -2],//28
		[0, -2],//29
		[1, -2],//30
		[2, -2]//31
	].map(([x, y])=>new THREE.Vector3(x, y, z)));
	let accelerations = new Array(geometry.vertices.length);
	let velocities = new Array(geometry.vertices.length);
	for(let i = 0; i < geometry.vertices.length; ++i){
		accelerations[i] = new THREE.Vector3(0, 0, 0);
		velocities[i] = new THREE.Vector3(0, 0, 0);
	}
	let creases = new THREE.Geometry();
	
	function addRawEdge(i, j, k){
		let a = geometry.vertices[i], b = geometry.vertices[j];
		creases.vertices.push(a, b);
		linearSprings.push(new LinearSpring(a, b, accelerations[i], accelerations[j], k));
	}
	
	function addCreaseEdge(ia, ib, ic, id, kl, kt, t0){
		let a = geometry.vertices[ia], b = geometry.vertices[ib];
		let c = geometry.vertices[ic], d = geometry.vertices[id];
		let aa = accelerations[ia], ab = accelerations[ib];
		let ac = accelerations[ic], ad = accelerations[id];
		creases.vertices.push(c, d);
		linearSprings.push(new LinearSpring(c, d, ac, ad, kl));
		angularSprings.push(new AngularSpring(a, b, c, d, aa, ab, kt, t0));
	}
	
	function addBigSquareFaces(c, ...ps){
		for(let i = 0; i < 8; ++i){
			geometry.faces.push(new THREE.Face3(c, ps[i], ps[(i + 1)&7], null, null, 0));
			if(i&1){
				addCreaseEdge(ps[(i + 1)&7], ps[i - 1], c, ps[i], kl, kt, 3*Math.PI/2);
			}else{
				addCreaseEdge(ps[i + 1], ps[(i + 7)&7], c, ps[i], kl, kt, 0);
			}
			if(i > 4){
				addRawEdge(ps[i], ps[(i + 1)&7], kl);
			}
		}
	}

	function addSmallSquareFaces(a, b, c, d){
		geometry.faces.push(
			new THREE.Face3(d, b, a, null, null, 0),
			new THREE.Face3(c, d, b, null, null, 0)
		);
		addCreaseEdge(a, c, d, b, kl, kT, Math.PI);
	}

	addBigSquareFaces(7, 8, 14, 13, 12, 6, 1, 2, 3);
	addBigSquareFaces(11, 5, 6, 12, 18, 17, 16, 10, 4);
	addBigSquareFaces(20, 26, 25, 19, 13, 14, 15, 21, 27);
	addBigSquareFaces(24, 23, 17, 18, 19, 25, 30, 29, 28);
	addSmallSquareFaces(0, 1, 6, 5);
	addSmallSquareFaces(8, 9, 15, 14);
	addSmallSquareFaces(12, 13, 19, 18);
	addSmallSquareFaces(16, 17, 23, 22);
	addSmallSquareFaces(25, 26, 31, 30);
	[[1, 0], [0, 5], [16, 22], [22, 23], [30, 31], [31, 26], [15, 9], [9, 8]].
		map(([i, j])=>addRawEdge(i, j, kl));
	[[11, 7, 12, 6], [7, 20, 13, 14], [20, 24, 19, 25], [24, 11, 18, 17]].
		map(is=>addCreaseEdge(...is, kl, kt, 2*Math.PI));
	[[0, 7, 6, 1], [7, 15, 14, 8], [31, 24, 25, 30], [24, 16, 17, 23], [11, 19, 18, 12], [20, 12, 13, 19],
	 [11, 0, 6, 5], [20, 8, 14, 15], [20, 31, 26, 25], [11, 23, 17, 16], [24, 12, 18, 19], [7, 19, 13, 12]].
		map(is=>addCreaseEdge(...is, kl, kt, 3*Math.PI/2));
	let paper = new THREE.Mesh(geometry, materials);
	paper.add(new THREE.LineSegments(creases, new THREE.LineBasicMaterial()));
	paper.linearSprings = linearSprings;
	paper.angularSprings = angularSprings;
	paper.accelerations = accelerations;
	paper.velocities = velocities;
	return paper;
}

function stabilize(paper){
	let com = new THREE.Vector3(0, 0, 0);
	let netV = new THREE.Vector3(0, 0, 0);
	for(let i = 0; i < paper.geometry.vertices.length; ++i){
		let r = paper.geometry.vertices[i];
		let v = paper.velocities[i];
		com.add(r);
		netV.add(v);
	}
	com.divideScalar(paper.geometry.vertices.length);
	netV.divideScalar(paper.geometry.vertices.length);
	let netL = new THREE.Vector3(0, 0, 0);
	let mI = 0;
	for(let i = 0; i < paper.geometry.vertices.length; ++i){
		let r = paper.geometry.vertices[i].sub(com);
		let v = paper.velocities[i].sub(netV);
		netL.add(new THREE.Vector3().crossVectors(r, v));
		mI += r.lengthSq();
	}
	let w2 = netL.length()/mI;
	let w = netL.setLength(w2);//mutates netL but we're not using it anymore
	let tw = w.clone().multiplyScalar(2);
	w2 *= w2;
	for(let i = 0; i < paper.geometry.vertices.length; ++i){
		let r = paper.geometry.vertices[i];
		let v = paper.velocities[i].sub(new THREE.Vector3().crossVectors(w, r));
		paper.accelerations[i].
			sub(new THREE.Vector3().crossVectors(tw, v)).//coriolis acceleration
			add(r.clone().multiplyScalar(w2));//centrifugal acceleration
	}
}

function calcEnergy(paper){
	let E = 0;
	for(const v of paper.velocities){
		E += v.lengthSq()/2;
	}
	for(const l of paper.linearSprings){
		let x = l.d0 - l.a.distanceTo(l.b);
		E += l.k*x*x;
	}
	for(const a of paper.angularSprings){
		let [,, c_d, t] = a.calcVecsAndAngleDistance();
		let k = a.ka*a.a.clone().sub(a.d).projectOnPlane(c_d).length();
		E += k*t*t/2;
	}
	return E;
}

let paper = makeWaterbomb();

scene.add(paper);
camera.position.z = 12;
paper.rotateX(-Math.PI/6);

//let capturer = new CCapture( { format: "webm-mediarecorder" } );
//capturer.start();

let playing = false;

function animate(){
	stabilize(paper);
	if(playing){
		requestAnimationFrame(animate);
	}
	renderer.render(scene, camera);
	//capturer.capture(renderer.domElement);
	for(let i = 0; i < STEPS_PER_FRAME; ++i){
		for(let a of paper.accelerations){
			a.setScalar(0);
		}
		for(let s of paper.linearSprings){
			s.calcAcc();
		}
		for(let s of paper.angularSprings){
			s.calcAcc();
		}
		for(let i = 0; i < paper.geometry.vertices.length; ++i){
			/*
			let vi = paper.velocities[i].length();
			if(vi > friction){
				paper.velocities[i].setLength(vi - friction);
			}else{
				paper.velocities[i].setScalar(0);
			}
			*/
			paper.velocities[i].multiplyScalar(0.99997);
			paper.velocities[i].addScaledVector(paper.accelerations[i], 1/STEPS_PER_FRAME);
			paper.geometry.vertices[i].addScaledVector(paper.velocities[i], 1/STEPS_PER_FRAME);
		}
	}
	//console.log("Distance: ", paper.geometry.vertices[12].distanceTo(paper.geometry.vertices[19]));
	paper.geometry.verticesNeedUpdate = true;
	paper.children[0].geometry.verticesNeedUpdate = true;
}
animate();

function moveCreaseToAngle(t){
	paper.geometry.vertices[1].z = 1 + Math.sqrt(.5)*Math.sin(t);
	paper.geometry.vertices[1].x = .5 - .5*Math.cos(t);
	paper.geometry.vertices[1].y = .5 + .5*Math.cos(t);
	animate();
}

renderer.domElement.addEventListener("click", e=>{
	playing^=true
	animate();
	console.log("Energy: ", calcEnergy(paper));
})

