async function getLatestFiles() {
  const apiKey = 'AIzaSyDOd77GqEie2svpVsSBtpWO4YeF4BYhmiE';
  const folderId = '1wLscg7oTamIWYm6hPMCmF-26Qm8zHHSG';
  
  const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,size,mimeType)&orderBy=createdTime+desc&pageSize=5&key=${apiKey}`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log('--- ÚLTIMOS ARQUIVOS NO DRIVE ---');
    console.log(JSON.stringify(data.files, null, 2));
    
    if (data.files && data.files.length > 0) {
      const latest = data.files[0];
      if (latest.mimeType !== 'video/mp4') {
        console.log(`⚠️ ALERTA: O arquivo '${latest.name}' está como '${latest.mimeType}' e não como video/mp4!`);
      } else {
        console.log(`✅ O arquivo '${latest.name}' é um MP4 válido.`);
      }
    }
  } catch (err) {
    console.error(err);
  }
}

getLatestFiles();
