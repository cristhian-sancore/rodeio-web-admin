async function checkFileId() {
  const apiKey = 'AIzaSyDOd77GqEie2svpVsSBtpWO4YeF4BYhmiE';
  const fileId = '17YoHSnI8ibvdM4xwhYruBDLGwfnI8BFX'; // ID found in browser debug
  
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,permissions,capabilities&key=${apiKey}`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log('--- FILE CHECK ---');
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
  }
}

checkFileId();
