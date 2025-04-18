chrome.runtime.onInstalled.addListener(() => {
    console.log('UTAS 修了要件チェッカーがインストールされました。');
});

chrome.runtime.onMessage.addListener((request, sendResponse) => {
    if (request.action === 'updateCourseRequirements') {
    // ここで course-requirements.json を更新するロジックを実装します
    // 注意: Chrome拡張機能の制限により、ファイルシステムに直接書き込むことはできません
    // 代わりに、chrome.storage APIを使用してデータを保存することをお勧めします
    console.log('コース要件の更新リクエストを受信しました:', request.data);
    sendResponse({success: true});
    }
});