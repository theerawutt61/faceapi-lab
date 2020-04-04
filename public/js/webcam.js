const webcam = document.getElementById("webcam");
const webcamOverlay = document.getElementById("webcamOverlay");
const webcamSource = document.getElementById("webcamSource");

webcamSource.addEventListener('change',(event) => {
  //console.log('change');
  webcamSelectedEvent(event.target.value);
});

var labelsFaceDescriptors = [];
var countDetectFace = 0;
var labels = [];

var run = async () => {
  console.log('Model loading');
  await loadModels();
  console.log('Model loadded');

  const facesDb = await db.allDocs({include_docs:true,attachments:true});
  facesDb.rows.forEach(async i => {
    var obj = {};
    obj._id = i.doc._id;
    obj.name = i.doc.title + i.doc.firstName+' '+i.doc.lastName;
    obj.descriptor = i.doc.descriptor;
    console.log(obj);
    labelsFaceDescriptors.push(obj);
  })

  navigator.mediaDevices.enumerateDevices().then(function(devices){
    for(var i=0; i<devices.length;i++){
      var device = devices[i];
      var option = document.createElement("option")
      if(device.kind == 'videoinput'){
        option.value = device.deviceId;
        option.text = device.label || 'camera' + (i+1);
        webcamSource.add(option);
      }
    }
    webcamSelectedEvent(devices[0]['deviceId']);
  })

}

const webcamSelectedEvent = (deviceId) => {
  if (navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: {deviceId:deviceId} })
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
      webcamOverlay.style.display = 'block';
      webcamOverlay.style.position = "absolute";
      webcamOverlay.style.left = webcam.offsetLeft + "px";
      webcamOverlay.style.top = webcam.offsetTop + "px";
      webcamOverlay.getContext('2d').clearRect(0, 0, webcamOverlay.width, webcamOverlay.height);
      const dims = await faceapi.matchDimensions(webcamOverlay, webcam, true);
      const resizedDetections = await faceapi.resizeResults(detections, dims);
      await faceapi.draw.drawDetections(webcamOverlay, resizedDetections);

      detections.forEach(async faceDetect => {
        labelsFaceDescriptors.forEach(faceDB => {

          let box = faceDetect.detection._box;

          const distance = faceapi.round(
            faceapi.euclideanDistance(faceDetect.descriptor,faceDB.descriptor)
          )
          if(distance <= 0.35){
            let name = faceDB.name;
            if(labels.indexOf(name) == -1){
              labels.push(name);
              let percentScore = Math.ceil(Math.abs((distance*100)-100))+'%';

              webcamOverlay.width = webcam.videoWidth;
              webcamOverlay.height = webcam.videoHeight;
              webcamOverlay.getContext('2d').drawImage(webcam,0,0);

              ++countDetectFace;
              var date = new Date();
              var obj = new Object();
              obj.name = name;
              obj.imgSrc = webcamOverlay.toDataURL('image/webp');
              obj.date = formatDate(date);
              obj.time = formatTime(date);
              obj.score = percentScore;
              AttendanceTable(obj);
            }
          }
          if(labels.length >= 10){
            labels = [];
          }
        })
      })
      
    }else{
      webcamOverlay.getContext('2d').clearRect(0, 0, webcamOverlay.width, webcamOverlay.height);
    }
    setTimeout(() => onPlay())
}

const AttendanceTable = (obj) => {
  let tbodyAttendance = $('#tbodyAttendance');
  let $tr = $("<tr>");
  $tr.append('<th>'+countDetectFace+'</th>');
  $tr.append('<th><img src='+obj.imgSrc+' height="120"></th>');
  $tr.append('<th>'+obj.name+'</th>');
  $tr.append('<th>'+obj.date+'</th>');
  $tr.append('<th>'+obj.time+'</th>');
  $tr.append('<th>'+obj.score+'</th>');
  tbodyAttendance.append($tr);

  if(countDetectFace >= 10){
    tbodyAttendance.empty();
    countDetectFace = 0;
  }
}

run();