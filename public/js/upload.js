const upload = document.getElementById('upload');
const loader = document.getElementById('loader');
var img = document.getElementById('img');

var db = new PouchDB('face-recognition');

var labelsFaceDescriptors = [];

const minConfidence = 0.6;

async function loadModels (){
  await faceapi.nets.ssdMobilenetv1.loadFromUri('./js/models/ssd_mobilenetv1');
  await faceapi.nets.faceLandmark68Net.loadFromUri('./js/models/face_landmark_68');
  await faceapi.nets.faceRecognitionNet.loadFromUri('./js/models/face_recognition');  
}
  
var run = async () => {
  console.log('Model loading');
  await loadModels();
  console.log('Model loadded');
}

run();

upload.addEventListener('change', (e) => {
  readUrlAndClassify(upload);
});

const readUrlAndClassify = async (input) => {
  if (input.files && input.files[0]) {
    loader.style.display = "block"
    let reader = new FileReader();
    reader.onload = async (e) => {
      img.src = e.target.result;
      const options = new faceapi.SsdMobilenetv1Options({ minConfidence })
    
      var detection = await faceapi.detectSingleFace(img, options)
      .withFaceLandmarks()
      .withFaceDescriptor()
      
      if (detection) {
        
        var doc = {
          "_id":document.getElementById('_id'),
          "name": document.getElementById('name'),
          "descriptors": new Float32Array(Object.values(detection.descriptor))
        }
        console.log(doc);
        db.put(doc)
        .then(function (result) {
          console.log(result)
        })
        .catch(function (err) {
          console.log(err);
        });
      }
    };
    reader.readAsDataURL(input.files[0]);
  }
}