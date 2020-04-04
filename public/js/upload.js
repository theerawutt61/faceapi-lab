const upload = document.getElementById('upload');
const loader = document.getElementById('loader');
const submitBT = document.getElementById('profileSubmit');
const img = document.getElementById('img');


upload.addEventListener('change', (e) => {
  readUrlAndClassify(upload);
});

submitBT.addEventListener('click', (e) => {
  console.log('click');
  saveProfile();
});

const readUrlAndClassify = async (input) => {
  if (input.files && input.files[0]) {
    loader.style.display = "block"
    let reader = new FileReader();
    reader.onload = async (e) => {
      img.src = e.target.result;
      loader.style.display = "none";
    };
    reader.readAsDataURL(input.files[0]);
  }
}

const saveProfile = async () => {
  loader.style.display = "block"
  const options = new faceapi.SsdMobilenetv1Options({ minConfidence })

  let detection = await faceapi.detectSingleFace(img, options)
  .withFaceLandmarks()
  .withFaceDescriptor()

  if (detection) {

    let doc = {
      "_id" : document.getElementById('_id').value,
      "title" : document.getElementById('title').value,
      "firstName" : document.getElementById('firstName').value,
      "lastName" : document.getElementById('lastName').value,
      "descriptor" : new Float32Array(Object.values(detection.descriptor))
    }

    console.log(doc);

    let saveStatus = document.getElementById("saveStatus");
    saveStatus.style.display = "block";
    db.put(doc)
    .then(function (result) {
      console.log(result);
      loader.style.display = "none";
      saveStatus.className = "alert alert-success";
      saveStatus.innerText = "บันทึกข้อมูลสำเร็จ";
    })
    .catch(function (err) {
      console.log(err);
      saveStatus.className = "alert alert-danger";
      saveStatus.innerText = err.message;
    });
  }
} 