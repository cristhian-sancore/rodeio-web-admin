async function testList() {
  const apiKey = 'AIzaSyDOd77GqEie2svpVsSBtpWO4YeF4BYhmiE';
  const folderId = '1wLscg7oTamIWYm6hPMCmF-26Qm8zHHSG';
  
  const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&fields=files(id,name)&key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ List success! Files found:', data.files?.length || 0);
      if (data.files && data.files.length > 0) {
        console.log('Examples:', data.files.map(f => f.name));
      }
    } else {
      console.log('❌ Error:', data.error?.message);
    }
  } catch (err) {
    console.error('❌ Fetch failed:', err.message);
  }
}

testList();
