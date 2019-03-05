/*
 * Audiovisualization using the html canvas element.
 * Please note: For this version to be used online you need an
 XMLHttpRequest to load the music file!
 */

let rafID = null
let analyser = null
let c = null
let cDraw = null
let ctx = null
// let micropone = null
let ctxDraw = null

let loader
let filename
let renderer
let jaw
let pivot
let cube_mesh
let scene
let camera
let controls
let fileChosen = false
let RADIUS = 2
let mouseX = 0, mouseY = 0
let windowHalfX = window.innerWidth / 2
let windowHalfY = window.innerHeight / 2
let loadedlet = 0, totallet = 0

const HIGHLIGHT_COLORS = [0x4200ff, 0x00ffff, 0xff0000, 0xff00ff]
const LOADING_WRAPPER_HEIGHT = 100

//Add sample music files
const SAMPLE_URLS = ['src/babylon-system.mp3', 'src/sample-2.mp3']
const SAMPLE_SUBTEXTS = ['You are listening to Truespirit – Babylon System.',
						 'You are listening to VA – Electrolush The Very Best Of Minimal And Electro Nouveau.']
let sampleURLIndex

//handle different prefix of the audio context
window.AudioContext = window.AudioContext || window.webkitAudioContext
//create the context.
let context = new AudioContext()

//using requestAnimationFrame instead of timeout...
if (!window.requestAnimationFrame)
	window.requestAnimationFrame = window.webkitRequestAnimationFrame
//sass
$(function () {

		$('#loading_wrapper').css('top', ($(window).height() / 2 - LOADING_WRAPPER_HEIGHT))

		//handle different types navigator objects of different browsers
		navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
	            navigator.mozGetUserMedia || navigator.msGetUserMedia
	    //eigene Init
	    loader = new BufferLoader()
            //loader.visualize = visualize
            //init canvas
	    initBinCanvas()
		//start updating
		rafID = window.requestAnimationFrame(updateVisualization)

})

function handleFiles(files) {
    if(files.length === 0){
        return
    }
	fileChosen = true
    setupAudioNodes()

	let fileReader  = new FileReader()
    fileReader.onload = function(){
         let arrayBuffer = this.result
         console.log(arrayBuffer)
         console.log(arrayBuffer.byteLength)
     }
     fileReader.readAsArrayBuffer(files[0])
     let url = URL.createObjectURL(files[0])

	let request = new XMLHttpRequest()

	request.addEventListener('progress', updateProgress)
	request.addEventListener('load', transferComplete)
	request.addEventListener('error', transferFailed)
	request.addEventListener('abort', transferCanceled)

	request.open('GET', url, true)
	request.responseType = 'arraybuffer'

 	// When loaded decode the data
	request.onload = function() {
		// decode the data
		context.decodeAudioData(request.response, function(buffer) {
		// when the audio is decoded play the sound
		sourceNode.buffer = buffer
		sourceNode.start(0)
		//on error
		}, function(e) {
			console.log(e)
		})
	}
	request.send()

	camera.position.z = 375
	camera.position.y = 0

}

function playSample() {

	fileChosen = true
    setupAudioNodes()

	let request = new XMLHttpRequest()

	request.addEventListener('progress', updateProgress)
	request.addEventListener('load', transferComplete2)
	request.addEventListener('error', transferFailed)
	request.addEventListener('abort', transferCanceled)

	sampleURLIndex = getRandomInt(0,1)
	console.log('SAMPLE URL INDEX: ' + sampleURLIndex)

	request.open('GET', SAMPLE_URLS[sampleURLIndex], true)
	request.responseType = 'arraybuffer'

 	// When loaded decode the data
	request.onload = function() {
		// decode the data
		context.decodeAudioData(request.response, function(buffer) {
		// when the audio is decoded play the sound
		sourceNode.buffer = buffer
		sourceNode.start(0)
		//on error
		}, function(e) {
			console.log(e)
		})
	}
	request.send()

	camera.position.z = 375
	camera.position.y = 0

	$('.inputfile + label, .button').addClass('animated fadeOutDown')
	$('#viewer_discretion').html(SAMPLE_SUBTEXTS[sampleURLIndex])
}

function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min
}

function initBinCanvas () {

	//SCENE#######################################################################
	scene = new THREE.Scene()
	scene.background = new THREE.Color( 0x00000)
	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100000)
	renderer = new THREE.WebGLRenderer()
	renderer.setSize(window.innerWidth, window.innerHeight)
	renderer.setPixelRatio( window.devicePixelRatio )
	document.body.appendChild(renderer.domElement)

	controls = new THREE.OrbitControls( camera, renderer.domElement )

	controls.enabled = false

	let geometry = new THREE.BoxGeometry(560, 560, 100000, 15, 55, 100)

	let cubeMat = new THREE.MeshBasicMaterial({color: '#4200ff', wireframe: true})
	let testMat = new THREE.MeshStandardMaterial({
		roughness: 0,
		color: 'white'
	})
	cube_mesh = new THREE.Mesh(geometry, cubeMat)
	scene.add(cube_mesh)

	//MATERIALS###################################################################
	let material = new THREE.MeshBasicMaterial({vertexColors: THREE.VertexColors})
	let objMat = new THREE.MeshStandardMaterial({
		color: '#f34093',
		wireframe: true,
		roughness: .3
	})
	let newMat = new THREE.MeshPhongMaterial({
		color: '#9600CD'
	})
	let headphoneMat = new THREE.MeshStandardMaterial({
		roughness: 0.4,
		color: '#ff4081',
		wireframe: false
	})
	let box = new THREE.Box3()
	pivot = new THREE.Group()  //group objs and center pivot of skull

	//LOADING OBJs#################################################################
	let manager = new THREE.LoadingManager()
		manager.onProgress = function ( item, loaded, total ) {
			console.log( item, loaded, total )  //loaded 1 total 3
			loadedlet = loaded
			totallet = total
	}
	let onProgress = function ( xhr ) {
		if ( xhr.lengthComputable ) {
			let percentComplete = xhr.loaded / xhr.total * 100
			console.log( Math.round(percentComplete, 2) + '% loaded' )
			$('.label').html(Math.round(percentComplete, 2) + '% loaded')
			//console.log('LOADED let:' + loadedlet + '\n TOTAL let:' + totallet)
			if (percentComplete === 100 && loadedlet === 2) {
				$('.inputfile + label, .button').css('visibility', 'visible')
				$('.inputfile + label, .button').addClass('animated fadeInUp')
				$('.inputfile + label, .button').one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
						$('.inputfile + label, .button').removeClass('fadeInUp')
				})
				$('#loading_screen').addClass('animated fadeOut')
				$('#loading_screen').one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
						$('#loading_screen').css('display', 'none')
						$('#viewer_discretion').html('This music visualizer may be harmful to viewers who are prone to epilepsy. Viewer discretion is advised.')
				})
			}
		}
	}
	let onError = function ( xhr ) {
	}
	let loader3D = new THREE.OBJLoader( manager )
	// load a resource
	loader3D.load(
		// resource URL
		'src/rest.obj',
		// Function when resource is loaded
		function ( object ) {
			object.traverse(function (child) {
				if ( child instanceof THREE.Mesh ) {

						child.material = newMat
						child.shading = THREE.FlatShading

					}
			})
			object.position.y = 0
			object.position.x = 0
			object.position.z = - 3
			box.setFromObject( object )
			box.getCenter( object.position )  // this re-sets the mesh position
			object.position.multiplyScalar( - 1 )
			pivot.add( object )
			skull = object
	}, onProgress, onError )

	loader3D.load(
		'src/jaw.obj',
		function ( object ) {
			object.traverse(function( child ) {
				if (child instanceof THREE.Mesh) {
						child.material = newMat
						child.shading = THREE.FlatShading
				}
			})
			object.position.x = 0
			object.position.y = - 20
			object.position.z = -3
			pivot.add( object )
			jaw = object
	}, onProgress, onError )

loader3D.load(
		'src/headphones.obj',
		function ( object ) {
			object.traverse(function( child ) {
				if (child instanceof THREE.Mesh) {
					child.material = headphoneMat
					child.shading = THREE.SmoothShading
				}
			})
			object.position.x = 0
			object.position.y = 3
			object.position.z = 27
			pivot.add( object )
			headphones = object
	}, onProgress, onError )
	scene.add ( jaw )


	scene.add( pivot )


	//scene.add(skull)
	//camera.position.z = 375
	camera.position.z = 500
	camera.position.y = 500

	let ambient = new THREE.AmbientLight( 0x101030 )
	scene.add( ambient )

	let directionalLight = new THREE.DirectionalLight( 0xffeedd )
	directionalLight.position.set( 0, 0, 1 )
	scene.add( directionalLight )

	document.addEventListener( 'mousemove', onDocumentMouseMove, false )
	window.addEventListener( 'resize', onWindowResize, false )
	document.addEventListener( 'touchstart', onDocumentTouchStart, false )
	document.addEventListener( 'touchmove', onDocumentTouchMove, false )

}

function onWindowResize() {

	windowHalfX = window.innerWidth / 2
	windowHalfY = window.innerHeight / 2

	camera.aspect = window.innerWidth / window.innerHeight
	camera.updateProjectionMatrix()

	renderer.setSize( window.innerWidth, window.innerHeight )

	$('#loading_wrapper').css('top', ($(window).height() / 2 - LOADING_WRAPPER_HEIGHT))

	console.log('Window.width' + $(window).width())


}
//move camera with mouse
function onDocumentMouseMove( event ) {

	mouseX = ( event.clientX - windowHalfX ) / 2
	mouseY = ( event.clientY - windowHalfY ) / 2

}

function onDocumentTouchStart( event ) {

	if ( event.touches.length > 1 ) {
		event.preventDefault()
		mouseX = (event.touches[ 0 ].pageX - windowHalfX) / 3
		mouseY = (event.touches[ 0 ].pageY - windowHalfY) / 3
	}

}

function onDocumentTouchMove( event ) {

	if ( event.touches.length == 1 ) {
		event.preventDefault()
		mouseX = (event.touches[ 0 ].pageX - windowHalfX) / 3
		mouseY = (event.touches[ 0 ].pageY - windowHalfY) / 3
	}

}

let audioBuffer
let sourceNode
function setupAudioNodes() {
	// setup a analyser
	analyser = context.createAnalyser()
	// create a buffer source node
	sourceNode = context.createBufferSource()
	//connect source to analyser as link
	sourceNode.connect(analyser)
	// and connect source to destination
	sourceNode.connect(context.destination)
}


function reset () {
	if (typeof sourceNode !== 'undefined') {
		sourceNode.stop(0)
	}
	if (typeof microphone !== 'undefined') {
		microphone = null
	}
}


function updateVisualization () {

	// get the average, bincount is fftsize / 2
	if (fileChosen) {
		let array = new Uint8Array(analyser.frequencyBinCount)
		analyser.getByteFrequencyData(array)

		drawBars(array)
	}
	camera.position.x += ( mouseX - camera.position.x) * .05
	//console.log('Camer pos x: ' + camera.position.x)
	camera.position.y += ( - mouseY - camera.position.y) * .05
	camera.lookAt( scene.position )
	render()
	//renderer.render(scene, camera)


	rafID = window.requestAnimationFrame(updateVisualization)
	controls.update()
}

function render() {
	renderer.render( scene, camera )

}

function smoothenArr(array)
{
	let smooth_array = new Array(array.length)
	for (let i = 0; i<array.length-2; i++)
	smooth_array[i]=(array[i] + array[i+1])/2

	smooth_array[array.length-1]=array[array.length-1]

	return smooth_array
}

// progress on transfers from the server to the client (downloads)
function updateProgress (oEvent) {
  if (oEvent.lengthComputable) {
    let percentComplete = oEvent.loaded / oEvent.total
	$('#viewer_discretion').html('Loading music file... ' + Math.floor(percentComplete * 100) + '%')
	$('#viewer_discretion').addClass('animated infinite flash')
  } else {
// Unable to compute progress information since the total size is unknown
	  console.log('Unable to compute progress info.')
  }
}

function transferComplete(evt) {
  	console.log('The transfer is complete.')
	$('#viewer_discretion').removeClass('animated infinite flash')
}

function transferComplete2(evt) {
  	console.log('The transfer is complete.')
	$('#viewer_discretion').removeClass('animated infinite flash')
  	$('#viewer_discretion').html(SAMPLE_SUBTEXTS[sampleURLIndex])
}

function transferFailed(evt) {
  	console.log('An error occurred while transferring the file.')
	$('#viewer_discretion').html('An error occurred while loading the file.')
}

function transferCanceled(evt) {
  	console.log('The transfer has been canceled by the user.')
	$('#viewer_discretion').html('Loading has been canceled by the user.')
}

//let counterlet = 0  //decrease flashing frequency
function drawBars (array) {

	//just show bins with a value over the treshold
	let threshold = 0
	//the max count of bins for the visualization
	let maxBinCount = array.length
	//space between bins
	let space = 3

  let bass = Math.floor(array[1])  //1Hz Frequenz
	let snare = Math.floor(array[250])
	//console.log('Array length ' + array.length)
	console.log('BASS: ' + bass)
	console.log('Snare: ' + snare)
  RADIUS = bass * .004
	RADIUS = RADIUS < .75 ? .75 : RADIUS
	//console.log('Radius:' + RADIUS)
	//skull size
	pivot.scale.x = RADIUS
	pivot.scale.y = RADIUS
	pivot.scale.z = RADIUS
	//jaw drops at the bass
	if ( bass > 175 ) {
			jaw.position.y = - 18 - (bass * 0.08)
		} else {
			jaw.position.y = - 25
		}


	//headphones shake at the bass
  const dy = Math.random()*7

	headphones.position.y = bass >= 155 ? dy : 0

//rotate background the most when snare is more than 230
	if (snare > 0) {
		if (snare > 100) {
			if (snare > 230) {
				cube_mesh.rotation.z +=  .01
			}
			else {
				cube_mesh.rotation.z +=  .005
			}
		} else {
			cube_mesh.rotation.z +=  .001
		}
	}
//change background color and position
	if (bass > 230) {
		//counterlet++
		//if (counterlet % 3 === 0)
		cube_mesh.material.color.setHex( HIGHLIGHT_COLORS[Math.floor(Math.random() * HIGHLIGHT_COLORS.length)] )
		cube_mesh.position.z += 10
		//cube_mesh.rotation.z +=  .01
		if (cube_mesh.position.z >= 2800) {
			cube_mesh.position.z = 0
		}
	} else {
		cube_mesh.material.color.setHex( HIGHLIGHT_COLORS[0] )
	}
	//cube_mesh.position.y = dy
	//go over each bin
	for ( let i = 0; i < maxBinCount; i++ ){

	}
}
