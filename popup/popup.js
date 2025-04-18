document.addEventListener('DOMContentLoaded', function() {
    const select = document.getElementById('courseSelect');
    const settingsLink = document.getElementById('settingsLink');

    if (!select) {
        console.error('コース選択要素が見つかりません');
        return;
    }

    fetch(chrome.runtime.getURL('data/course-requirements.json'))
        .then(response => response.json())
        .then(data => {
            data.courses.forEach(course => {
                const option = document.createElement('option');
                option.value = course.id;
                option.textContent = course.name;
                select.appendChild(option);
            });

            // 保存されたコースを選択
            chrome.storage.sync.get(['selectedCourse'], function(result) {
                if (result.selectedCourse) {
                    select.value = result.selectedCourse;
                }
            });
        })
        .catch(error => {
            console.error('コース要件の取得に失敗しました:', error);
        });

    select.addEventListener('change', function(e) {
        const selectedCourse = e.target.value;
        chrome.storage.sync.set({selectedCourse: selectedCourse}, function() {
            console.log('コースが選択されました:', selectedCourse);
        });
    });

    // 設定ページへのリンクを処理
    settingsLink.addEventListener('click', function(e) {
        e.preventDefault();
        chrome.runtime.openOptionsPage();
    });
});