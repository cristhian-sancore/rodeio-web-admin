async function testKey() {
  const apiKey = 'AIzaSyDOd77GqEie2svpVsSBtpWO4YeF4BYhmiE';
  const folderId = '1wLscg7oTamIWYm6hPMCmF-26Qm8zHHSG';
  
  // Test listing all mp4 files
  const url = `https://www.googleapis.com/drive/v3/files?q=name+contains+'.mp4'+and+trashed=false&fields=files(id,name)&pageSize=10&key=${apiKey}`;
  
  console.log(`Checking API Key with URL: https://www.googleapis.com/drive/v3/files?q=...&key=${apiKey}`);
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Success! Files found:', data.files?.length || 0);
      if (data.files && data.files.length > 0) {
        console.log('Examples:', data.files.map(f => f.name));
      } else {
        console.log('No .mp4 files found in the account.');
      }
    } else {
      console.log('❌ API Error:', data.error?.message || 'Unknown error');
      console.log('Full response:', JSON.stringify(data));
    }
  } catch (err) {
    console.error('❌ Fetch failed:', err.message);
  }
}

testKey();
