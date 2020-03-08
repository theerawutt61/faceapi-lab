const webcam = document.getElementById("webcam");
const webcamOverlay = document.getElementById("webcamOverlay");
const webcamSource = document.getElementById('webcamSource');

webcamSource.addEventListener('change', (event) => {
  webcamSeletedEvent(event.target.value);
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
    //console.log(i.doc);
    var obj = {};
    obj._id = i.doc._id;
    obj.name = i.doc.title + i.doc.firstName+' '+i.doc.lastName;
    obj.descriptor = i.doc.descriptor;
    console.log(obj);
    labelsFaceDescriptors.push(obj);
  })
  
  navigator.mediaDevices.enumerateDevices().then(function (devices) {
    for(var i = 0; i < devices.length; i ++){
      var device = devices[i];
      var option = document.createElement('option');
      if (device.kind === 'videoinput') {
        option.value = device.deviceId;
        option.text = device.label || 'camera ' + (i + 1);
        webcamSource.add(option);
      }
    };
    webcamSeletedEvent(devices[0]['deviceId'])
  });
}

const webcamSeletedEvent = (deviceId) => {
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
    .withFaceExpressions()
    .withAgeAndGender()
    if (detections) {
      //console.log(detections)
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
          //console.log(distance)
          if(distance <= 0.35){
            let name = faceDB.name;
            console.log(name);
            if(labels.indexOf(name) == -1){
              labels.push(name);
              
              var expressionsKeys = Object.keys(faceDetect.expressions)
              var expressionsValues = Object.values(faceDetect.expressions);
              var expressionsValuesMax = Math.max(...expressionsValues);
              var indexFindMax = expressionsValues.indexOf(expressionsValuesMax);
              
              let percentScore = Math.ceil(Math.abs((distance*100)-100))+'%';

              webcamOverlay.width = webcam.videoWidth;
              webcamOverlay.height = webcam.videoHeight;
              webcamOverlay.getContext('2d').drawImage(webcam,0,0);

              const faceCanvas = document.createElement('canvas');
              const width = box._width;
              const height = box._height;
              faceCanvas.width = width;
              faceCanvas.height = height;
              const ctx  = faceCanvas.getContext('2d');
              ctx.drawImage(webcamOverlay, box._x,box._y,width,height,0,0,width,height);

              const drawOptions = {
                label: name,
                lineWidth: 3
              }

              const drawBox = new faceapi.draw.DrawBox(box, drawOptions)
              drawBox.draw(webcamOverlay);

              ++countDetectFace;
              let date = new Date();
              let obj = new Object();
              obj.srcImg = webcamOverlay.toDataURL('image/webp');
              obj.faceSrcImg = faceCanvas.toDataURL('image/webp');
              obj.name = name;
              obj.date = formatDate(date);
              obj.time = formatTime(date);
              obj.match = percentScore;
              obj.gender = faceDetect.gender;
              obj.expression = expressionsKeys[indexFindMax];
              AttendanceTable(obj);
            }
            if(labels.length >= 10){
              labels = [];
            }
          }
        })
      })
      
    }else{
      webcamOverlay.getContext('2d').clearRect(0, 0, webcamOverlay.width, webcamOverlay.height);
    }
    setTimeout(() => onPlay())
}

const modal = document.getElementById("snopshotModal");
const modalImg = document.getElementById("snopshotShow");
const captionText = document.getElementById("snapshotCaption");

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
  modal.style.display = "none";
}

const AttendanceTable = (obj) => {
  let tbodyFaceDetect = $("#tbodyFaceDetect");
  let $tr1 = $("<tr>");
  $tr1.append('<td><img class="snapshotImg" src = "'+obj.faceSrcImg+'" alt="'+obj.name+'" height="80"></td>');
  tbodyFaceDetect.append($tr1);
  
  let tbodyAttendance = $("#tbodyAttendance");
  let $tr2 = $("<tr>");
  $tr2.append('<td>'+ countDetectFace +'</td>');
  $tr2.append('<td><img class="snapshotImg" src = "'+obj.srcImg+'" alt="'+obj.name+'" height="120"></td>');
  $tr2.append('<td><img class="snapshotImg" src = "'+obj.faceSrcImg+'" alt="'+obj.name+'" height="80"></td>');
  $tr2.append('<td>'+ obj.name +'</th>');
  $tr2.append('<td>'+ obj.date +'</th>');
  $tr2.append('<td>'+ obj.time +'</th>');
  $tr2.append('<td>'+ obj.match +'</th>');
  $tr2.append('<td>'+ obj.expression +'</th>');
  $tr2.append('<td>'+ obj.gender +'</th>')
  tbodyAttendance.append($tr2);

  const imgs = document.querySelectorAll('.snapshotImg');
  imgs.forEach(function(img) {
    img.onclick = function(){
      modal.style.display = "block";
      modalImg.src = this.src;
      captionText.innerHTML = this.alt;
    }
  });

  if(countDetectFace >= 10){
    tbodyAttendance.empty();
    countDetectFace = 0;
  }
};

run();