const db = new PouchDB('face-recognition');

const minConfidence = 0.6;

async function loadModels (){
  await faceapi.nets.ssdMobilenetv1.loadFromUri('./js/models/ssd_mobilenetv1');
  await faceapi.nets.faceLandmark68Net.loadFromUri('./js/models/face_landmark_68');
  await faceapi.nets.faceRecognitionNet.loadFromUri('./js/models/face_recognition');
  await faceapi.nets.faceExpressionNet.loadFromUri('./js/models/face_expression');
  await faceapi.nets.ageGenderNet.loadFromUri('./js/models/age_gender_model');  
}

var monthNames = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม",
  "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม",
  "สิงหาคม", "กันยายน", "ตุลาคม",
  "พฤศจิกายน", "ธันวาคม"
];

const formatDate = (date) => {
  var day = date.getDate();
  var monthIndex = date.getMonth();
  var year = date.getFullYear();
  return pad(day, 2) + ' ' + monthNames[monthIndex] + ' ' + year;
};

const formatTime = (date) => {
  var hour = date.getHours();
  var minute = date.getMinutes();
  var seconds = date.getSeconds();
  return pad(hour, 2) + ':' + pad(minute, 2) + ':' + pad(seconds, 2);
};

const pad = (n, width, z) => {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
};