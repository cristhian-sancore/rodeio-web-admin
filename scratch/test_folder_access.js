async function testFolder() {
  const apiKey = 'AIzaSyDOd77GqEie2svpVsSBtpWO4YeF4BYhmiE';
  const folderId = '1wLscg7oTamIWYm6hPMCmF-26Qm8zHHSG';
  
  const url = `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name,permissions&key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Folder accessible:', data.name);
    } else {
      console.log('❌ Error:', data.error?.message);
      console.log('Full response:', JSON.stringify(data));
    }
  } catch (err) {
    console.error('❌ Fetch failed:', err.message);
  }
}

testFolder();
