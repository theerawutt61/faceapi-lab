const webcam = document.getElementById("webcam");
const webcamOverlay = document.getElementById("webcamOverlay");

var db = new PouchDB('face-recognition');

var labelsFaceDescriptors = [];

const minConfidence = 0.6;

async function loadModels (){
  await faceapi.nets.ssdMobilenetv1.loadFromUri('./js/models/ssd_mobilenetv1');
  await faceapi.nets.faceLandmark68Net.loadFromUri('./js/models/face_landmark_68');
  await faceapi.nets.faceRecognitionNet.loadFromUri('./js/models/face_recognition');
  //await faceapi.nets.faceExpressionNet.loadFromUri('./js/models/face_expression');
  //await faceapi.nets.faceExpressionNet.loadFromUri('./js/models/age_gender_model');  
}
  
var run = async () => {
  console.log('Model loading');
  await loadModels();
  console.log('Model loadded');
  
  const facesDb = await db.allDocs({include_docs:true,attachments:true});
  
  facesDb.rows.forEach(async i => {
    console.log(i.doc);
    labelsFaceDescriptors.push(i.doc)
  })
  
  if (navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(function (stream) {
        webcam.srcObject = stream;
      })
      .catch(function (err0r) {
        console.log("Something went wrong!");
      });
  }
}

async function onPlay() {
  if(webcam.paused || webcam.ended)
    return setTimeout(() => onPlay())
    
    const options = new faceapi.SsdMobilenetv1Options({ minConfidence })
    
    var detections = await faceapi.detectAllFaces(webcam, options)
    .withFaceLandmarks()
    .withFaceDescriptors()
    if (detections) {
      //console.log(detections)
      webcamOverlay.style.display = 'block';
      webcamOverlay.style.position = "absolute";
      webcamOverlay.style.left = webcam.offsetLeft + "px";
      webcamOverlay.style.top = webcam.offsetTop + "px";
      webcamOverlay.getContext('2d').clearRect(0, 0, webcamOverlay.width, webcamOverlay.height);
      const dims = await faceapi.matchDimensions(webcamOverlay, webcam, true);
      var resizedDetections = await faceapi.resizeResults(detections, dims);
      await faceapi.draw.drawDetections(webcamOverlay, resizedDetections);
      
      detections.forEach(async faceDetect => {
        labelsFaceDescriptors.forEach(faceDB => {
          var distance = faceapi.round(
            faceapi.euclideanDistance(faceDetect.descriptor,faceDB.descriptors)
          )
          
          //console.log(distance)
          if(distance <= 0.35){
            console.log(faceDB.name);
          }
        })
      })
      
    }else{
      webcamOverlay.getContext('2d').clearRect(0, 0, webcamOverlay.width, webcamOverlay.height);
    }
    // setTimeout(() => onPlay())
}

run();